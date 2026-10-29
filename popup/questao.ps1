<#
  Pop-up de questão rápida (Estudos CG).
  A tarefa agendada roda este script a cada 15 min e ele decide sozinho se é hora de abrir:
    - só entre config.inicio e config.fim, respeitando o intervalo sorteado (intervaloMin..intervaloMax) e as pausas;
    - não abre se o microfone ou a câmera estiverem em uso (reunião), com app em tela cheia ou apresentação,
      no "não perturbe" do Windows, com a tela bloqueada ou com o PC parado há mais de config.minutosParado.
  Respostas ficam em popup\progresso-popup.json, no mesmo formato do "Exportar" do site (dá para importar lá).

  Uso:
    questao.ps1                         modo agendado (checa tudo)
    questao.ps1 -Agora                  abre já, sem checar nada
    questao.ps1 -Diagnostico            só diz se abriria agora e por quê
    questao.ps1 -Captura x.png [-Responder 1]   desenha a janela num PNG sem mostrar (teste)
    questao.ps1 -Dados <pasta>          lê data/ de outra pasta (teste)
#>
param([switch]$Agora, [switch]$Diagnostico, [string]$Captura, [int]$Responder = -1, [string]$Dados)

$ErrorActionPreference = 'Stop'
$Pasta = $PSScriptRoot
$Raiz = if ($Dados) { $Dados } else { Split-Path -Parent $Pasta }
$Utf8 = New-Object System.Text.UTF8Encoding $false
$ArqEstado = Join-Path $Pasta 'estado.json'
$ArqProgresso = Join-Path $Pasta 'progresso-popup.json'
$ArqLog = Join-Path $Pasta 'popup.log'

function Ler-Json($p) {
    if (Test-Path $p) { try { return [IO.File]::ReadAllText($p, $Utf8) | ConvertFrom-Json } catch { } }
    return $null
}
# Grava num temporário e troca: um desligamento no meio nunca deixa o arquivo pela metade.
function Gravar-Json($p, $o) {
    $tmp = "$p.tmp"
    [IO.File]::WriteAllText($tmp, ($o | ConvertTo-Json -Depth 8 -Compress), $Utf8)
    Move-Item -LiteralPath $tmp -Destination $p -Force
}
function Agora-Ms { [DateTimeOffset]::Now.ToUnixTimeMilliseconds() }
function Log($msg) {
    try {
        if ((Test-Path $ArqLog) -and (Get-Item $ArqLog).Length -gt 200KB) { Remove-Item $ArqLog -Force }
        [IO.File]::AppendAllText($ArqLog, ("{0:yyyy-MM-dd HH:mm} {1}`r`n" -f (Get-Date), $msg), $Utf8)
    } catch { }
}

# Erro inesperado (o pop-up roda escondido): vai para o popup.log em vez de sumir calado.
trap { Log ("erro: {0} (linha {1})" -f $_.Exception.Message, $_.InvocationInfo.ScriptLineNumber); break }

$cfg = Ler-Json (Join-Path $Pasta 'config.json')
if (-not $cfg) { Log 'config.json não abriu'; exit 1 }
[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12

# Sincronização pelo Drive (opcional): popup\sync.json = { "url", "chave" }, gravado por ligar-sync.ps1.
$Sync = Ler-Json (Join-Path $Pasta 'sync.json')
if ($Sync -and -not ([string]$Sync.url -match '^https://script\.google(usercontent)?\.com/' -and $Sync.chave)) { $Sync = $null }
function Url-Leitura { return ([string]$Sync.url + '?t=' + [uri]::EscapeDataString([string]$Sync.chave)) }

Add-Type -Namespace EstudosCG -Name Win -MemberDefinition @'
[DllImport("shell32.dll")] public static extern int SHQueryUserNotificationState(out int state);
[StructLayout(LayoutKind.Sequential)] public struct LASTINPUTINFO { public uint cbSize; public uint dwTime; }
[DllImport("user32.dll")] static extern bool GetLastInputInfo(ref LASTINPUTINFO plii);
public static uint IdleMs() {
    LASTINPUTINFO l = new LASTINPUTINFO();
    l.cbSize = (uint)Marshal.SizeOf(l);
    if (!GetLastInputInfo(ref l)) return 0;
    return (uint)Environment.TickCount - l.dwTime;
}
[DllImport("ntdll.dll")] static extern int NtQueryWnfStateData(ref ulong StateName, IntPtr TypeId, IntPtr ExplicitScope, out uint ChangeStamp, byte[] Buffer, ref uint BufferSize);
// Estado "não perturbe"/foco do Windows 11 (WNF_SHEL_QUIETHOURS_ACTIVE_PROFILE_CHANGED): 0 = desligado; -1 = não deu para ler.
public static int QuietHours() {
    try {
        ulong s = 0x0D83063EA3BF1C75UL; uint stamp; byte[] b = new byte[4]; uint size = 4;
        int r = NtQueryWnfStateData(ref s, IntPtr.Zero, IntPtr.Zero, out stamp, b, ref size);
        if (r != 0 || size < 4) return -1;
        return BitConverter.ToInt32(b, 0);
    } catch { return -1; }
}
'@

# ---------- está livre? ----------
function Em-Uso([string]$recurso) {
    $base = "HKCU:\Software\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\$recurso"
    if (-not (Test-Path $base)) { return $false }
    $chaves = @(Get-ChildItem $base -ErrorAction SilentlyContinue) + @(Get-ChildItem "$base\NonPackaged" -ErrorAction SilentlyContinue)
    foreach ($k in $chaves) {
        $p = Get-ItemProperty $k.PSPath -ErrorAction SilentlyContinue
        if ($p -and $p.PSObject.Properties['LastUsedTimeStop'] -and $p.LastUsedTimeStop -eq 0 -and $p.LastUsedTimeStart -gt 0) {
            return $true
        }
    }
    return $false
}

function Nao-Perturbe {
    if ([EstudosCG.Win]::QuietHours() -gt 0) { return $true }
    $p = Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Notifications\Settings' -ErrorAction SilentlyContinue
    return ($p -and $p.PSObject.Properties['NOC_GLOBAL_SETTING_TOASTS_ENABLED'] -and $p.NOC_GLOBAL_SETTING_TOASTS_ENABLED -eq 0)
}

# Devolve o motivo para NÃO abrir agora, ou $null se pode abrir.
function Motivo {
    $h = (Get-Date).Hour
    if ($h -lt [int]$cfg.inicio -or $h -ge [int]$cfg.fim) { return 'fora do horário' }
    $est = Ler-Json $ArqEstado
    $agora = Agora-Ms
    if ($est -and $est.PSObject.Properties['pausaAte'] -and [int64]$est.pausaAte -gt $agora) { return 'pausado' }
    if ($est -and $est.PSObject.Properties['proximo'] -and [int64]$est.proximo -gt $agora) {
        return ('ainda não é hora (próxima às {0:HH:mm})' -f [DateTimeOffset]::FromUnixTimeMilliseconds([int64]$est.proximo).LocalDateTime)
    }
    if (Em-Uso 'microphone') { return 'microfone em uso (reunião?)' }
    if (Em-Uso 'webcam') { return 'câmera em uso (reunião?)' }
    $s = 0; [void][EstudosCG.Win]::SHQueryUserNotificationState([ref]$s)
    if ($s -ne 5) { return "Windows ocupado (estado ${s}: tela cheia, apresentação, tela bloqueada ou modo foco)" }
    if (Nao-Perturbe) { return 'não perturbe ligado' }
    $parado = [EstudosCG.Win]::IdleMs() / 60000
    if ($parado -gt [double]$cfg.minutosParado) { return ('PC parado há {0:N0} min' -f $parado) }
    return $null
}

function Agendar-Proxima([int64]$pausaAte = 0) {
    $est = Ler-Json $ArqEstado
    $o = [ordered]@{ proximo = (Agora-Ms) + 60000L * (Get-Random -Minimum ([int]$cfg.intervaloMin) -Maximum ([int]$cfg.intervaloMax + 1)); pausaAte = 0L }
    if ($est -and $est.PSObject.Properties['pausaAte']) { $o.pausaAte = [int64]$est.pausaAte }
    # Pausa: a próxima vem um intervalo sorteado DEPOIS do fim da pausa (senão "Pausar 1h" não adiaria nada).
    if ($pausaAte) { $o.pausaAte = $pausaAte; $o.proximo = $pausaAte + 60000L * (Get-Random -Minimum ([int]$cfg.intervaloMin) -Maximum ([int]$cfg.intervaloMax + 1)) }
    Gravar-Json $ArqEstado $o
}

if ($Diagnostico) {
    $m = Motivo
    if ($m) { "Não abriria agora: $m" } else { 'Abriria agora: está tudo livre.' }
    if ($Sync) {
        try {
            $r = Invoke-RestMethod -Uri (Url-Leitura) -TimeoutSec 15
            if ($r.ok) { 'Drive: sincronização ligada e respondendo.' } else { "Drive: o script recusou ($($r.erro))." }
        } catch { "Drive: sem resposta ($($_.Exception.Message))." }
    } else { 'Drive: sincronização desligada (rode ligar-sync.ps1 com o link do passo a passo).' }
    exit 0
}
if (-not $Agora -and -not $Captura) {
    $m = Motivo
    if ($m) { Log "pulado: $m"; exit 0 }
}
# Uma janela por vez: a tarefa agendada não espera o pop-up fechar, então a trava é aqui.
$Trava = $null
if (-not $Captura) {
    $Trava = New-Object System.Threading.Mutex($false, 'Local\EstudosCG-popup')
    $tem = $false
    try { $tem = $Trava.WaitOne(0) } catch [System.Threading.AbandonedMutexException] { $tem = $true }
    if (-not $tem) { Log 'pulado: já há uma janela do pop-up aberta'; exit 0 }
}

# ---------- questões ----------
$idx = Ler-Json (Join-Path $Raiz 'data\index.json')
$Disc = @{}; foreach ($d in $idx.disciplinas) { $Disc[$d.id] = $d }
$Assunto = @{}
foreach ($f in Get-ChildItem (Join-Path $Raiz 'data\disciplinas') -Filter *.json -ErrorAction SilentlyContinue) {
    $d = Ler-Json $f.FullName
    if ($d) { foreach ($a in $d.assuntos) { $Assunto["$($d.id):$($a.id)"] = $a.nome } }
}
$PorDisc = @{}
$Vistas = @{}
function Adicionar($q, [string]$discPadrao = '') {
    if (-not $q -or -not $q.id -or -not $q.alternativas) { return }
    if (-not $q.disciplina -and $discPadrao) { $q | Add-Member -NotePropertyName disciplina -NotePropertyValue $discPadrao -Force }
    # Só questão com gabarito que aponta para uma alternativa (senão o pop-up daria a A como certa).
    # Tabela ou figura não cabem no pop-up (aparecem no site).
    if (([string]$q.enunciado) -match '\|\s*:?-{3,}' -or ([string]$q.enunciado + ' ' + (@($q.alternativas) -join ' ')) -match '!\[') { return }
    $n = @($q.alternativas).Count
    if (-not ($q.correta -is [int] -or $q.correta -is [long]) -or [int]$q.correta -lt 0 -or [int]$q.correta -ge $n) { return }
    if ($Vistas.ContainsKey([string]$q.id) -or -not $Disc.ContainsKey([string]$q.disciplina)) { return }
    $Vistas[[string]$q.id] = $true
    if (-not $PorDisc.ContainsKey($q.disciplina)) { $PorDisc[$q.disciplina] = New-Object System.Collections.ArrayList }
    [void]$PorDisc[$q.disciplina].Add($q)
}
foreach ($f in Get-ChildItem (Join-Path $Raiz 'data\questoes') -Filter *.json -ErrorAction SilentlyContinue) {
    foreach ($q in (Ler-Json $f.FullName)) { Adicionar $q $f.BaseName }
}
# Provas digitadas: só as publicadas (data\provas\index.json; rascunho fora dele não entra) e só as questões que
# cabem num pop-up (sem anulada, sem figura e sem texto de apoio).
foreach ($ip in @(Ler-Json (Join-Path $Raiz 'data\provas\index.json'))) {
    if (-not $ip -or -not ([string]$ip.id -match '^[\w-]+$')) { continue }
    $p = Ler-Json (Join-Path $Raiz ('data\provas\{0}.json' -f $ip.id))
    if (-not $p -or -not $p.questoes) { continue }
    foreach ($q in $p.questoes) {
        if ($q.anulada -or $null -eq $q.correta -or $q.imagem -or $q.texto) { continue }
        if (([string]$q.enunciado + ' ' + (@($q.alternativas) -join ' ')) -match '!\[') { continue }
        foreach ($c in 'banca', 'ano', 'orgao', 'cargo') { if (-not $q.$c -and $p.$c) { $q | Add-Member -NotePropertyName $c -NotePropertyValue $p.$c -Force } }
        $q | Add-Member -NotePropertyName origem -NotePropertyValue 'banca' -Force
        $q | Add-Member -NotePropertyName prova -NotePropertyValue $p.id -Force
        Adicionar $q
    }
}
if (-not $PorDisc.Count) { Log 'sem questões em data\questoes'; exit 0 }

$Prog = $null
if (Test-Path $ArqProgresso) {
    $Prog = Ler-Json $ArqProgresso
    if (-not $Prog -or -not $Prog.PSObject.Properties['resp']) {
        # Arquivo ilegível: guarda à parte e começa outro; nunca grava por cima das respostas antigas.
        $ruim = $ArqProgresso -replace '\.json$', ('-ilegivel-{0:yyyyMMdd-HHmmss}.json' -f (Get-Date))
        Move-Item -LiteralPath $ArqProgresso -Destination $ruim -Force
        Log "progresso ilegível guardado em $ruim"
        $Prog = $null
    }
}
if (-not $Prog) { $Prog = [pscustomobject]@{ origem = 'popup'; resp = [pscustomobject]@{} } }

# Última resposta de cada questão: a do pop-up e, com a sincronização ligada, a do site (PC e celular) que está no Drive.
$Hist = @{}
function Juntar-Hist($resp) {
    if (-not $resp) { return }
    foreach ($p in $resp.PSObject.Properties) {
        foreach ($x in @($p.Value)) {
            if ($null -eq $x -or $null -eq $x.ts) { continue }
            $u = $Hist[$p.Name]
            if (-not $u -or [int64]$x.ts -gt [int64]$u.ts) { $Hist[$p.Name] = $x }
        }
    }
}
Juntar-Hist $Prog.resp
if ($Sync -and -not $Captura) {
    try {
        $r = Invoke-RestMethod -Uri (Url-Leitura) -TimeoutSec 8
        if ($r.ok -and $r.estado) { Juntar-Hist $r.estado.resp }
    } catch { Log "Drive não respondeu ao ler: $($_.Exception.Message)" }
}
function Ultima($id) { return $Hist[[string]$id] }
# Mais chance para quem errou ou nunca viu; acertadas voltam aos poucos.
function Peso($q) {
    $u = Ultima $q.id
    if (-not $u) { return 3.0 }
    if (-not $u.ok) { return 6.0 }
    return [math]::Min(3.0, 0.3 + ((Agora-Ms) - [int64]$u.ts) / 86400000.0 / 7)
}
function Sortear($itens, [scriptblock]$peso) {
    $total = 0.0; $ps = @(); foreach ($i in $itens) { $w = [double](& $peso $i); $ps += $w; $total += $w }
    $r = (Get-Random -Minimum 0.0 -Maximum 1.0) * $total
    for ($k = 0; $k -lt $ps.Count; $k++) { $r -= $ps[$k]; if ($r -le 0) { return $itens[$k] } }
    return $itens[$itens.Count - 1]
}
# A disciplina sai na proporção do peso na prova (Específicas ~2/3); a questão, pelo histórico.
function Nova-Questao {
    $ids = @($PorDisc.Keys)
    # Peso da disciplina na prova, reduzido quando ela tem poucas questões no pop-up (senão repetem demais).
    $did = Sortear $ids { param($x) $d = $Disc[$x]; $w = if ($d) { [double]$d.questoesNaProva * [double]$d.peso } else { 1.0 }; $w * [math]::Min(1.0, $PorDisc[$x].Count / 30.0) }
    return Sortear @($PorDisc[$did]) { param($q) Peso $q }
}

function Registrar($q, [int]$k) {
    $ok = ($k -eq [int]$q.correta)
    # Outra janela pode ter gravado neste meio-tempo: relê o arquivo e junta pelo horário antes de gravar.
    $disco = Ler-Json $ArqProgresso
    if ($disco -and $disco.PSObject.Properties['resp']) {
        foreach ($pp in $disco.resp.PSObject.Properties) {
            $atual = $Prog.resp.PSObject.Properties[$pp.Name]
            $lista = New-Object System.Collections.ArrayList
            $vistos = @{}
            if ($atual) { foreach ($x in @($atual.Value)) { if ($x) { [void]$lista.Add($x); $vistos[[string]$x.ts] = $true } } }
            foreach ($x in @($pp.Value)) { if ($x -and -not $vistos.ContainsKey([string]$x.ts)) { [void]$lista.Add($x) } }
            $Prog.resp | Add-Member -NotePropertyName $pp.Name -NotePropertyValue ([object[]]($lista | Sort-Object { [int64]$_.ts })) -Force
        }
    }
    $h = @(); $p = $Prog.resp.PSObject.Properties[$q.id]
    if ($p) { $h = @($p.Value) }
    $h += [pscustomobject]@{ ts = (Agora-Ms); e = $k; ok = $ok }
    if ($h.Count -gt 20) { $h = $h[($h.Count - 20)..($h.Count - 1)] }
    $Prog.resp | Add-Member -NotePropertyName $q.id -NotePropertyValue $h -Force
    $Hist[[string]$q.id] = $h[$h.Count - 1]
    $Estado.n++
    try { Gravar-Json $ArqProgresso $Prog } catch { Log "não gravou o progresso: $_" }
    Log ("respondida {0}: {1}" -f $q.id, $(if ($ok) { 'certa' } else { 'errada' }))
    return $ok
}
function Hoje-Resumo {
    $ini = [DateTimeOffset]::new([DateTime]::Today).ToUnixTimeMilliseconds()
    $n = 0; $c = 0
    foreach ($p in $Prog.resp.PSObject.Properties) { foreach ($x in @($p.Value)) { if ([int64]$x.ts -ge $ini) { $n++; if ($x.ok) { $c++ } } } }
    if ($n) { return "Hoje no pop-up: $c de $n certas" } else { return 'Primeira de hoje' }
}

# ---------- janela ----------
Add-Type -AssemblyName PresentationFramework, PresentationCore, WindowsBase

$xaml = @'
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation" xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="Questão rápida · Estudos CG" Width="540" SizeToContent="Height" WindowStyle="None" AllowsTransparency="True"
        Background="Transparent" Topmost="True" ShowInTaskbar="True" ResizeMode="NoResize" ShowActivated="False"
        FontFamily="Segoe UI" TextOptions.TextFormattingMode="Display">
  <Window.Resources>
    <Style x:Key="Btn" TargetType="Button">
      <Setter Property="Foreground" Value="#EEF1F8"/><Setter Property="Background" Value="#20263A"/>
      <Setter Property="BorderBrush" Value="#323A55"/><Setter Property="Padding" Value="12,7"/>
      <Setter Property="Margin" Value="8,0,0,0"/><Setter Property="Cursor" Value="Hand"/><Setter Property="FontWeight" Value="SemiBold"/>
      <Setter Property="FontSize" Value="12.5"/>
      <Setter Property="Template"><Setter.Value><ControlTemplate TargetType="Button">
        <Border x:Name="b" Background="{TemplateBinding Background}" BorderBrush="{TemplateBinding BorderBrush}" BorderThickness="1" CornerRadius="9" Padding="{TemplateBinding Padding}">
          <ContentPresenter HorizontalAlignment="Center" VerticalAlignment="Center"/></Border>
        <ControlTemplate.Triggers><Trigger Property="IsMouseOver" Value="True"><Setter TargetName="b" Property="BorderBrush" Value="#7C5CFF"/></Trigger></ControlTemplate.Triggers>
      </ControlTemplate></Setter.Value></Setter>
    </Style>
    <Style x:Key="Link" TargetType="Button" BasedOn="{StaticResource Btn}">
      <Setter Property="Background" Value="Transparent"/><Setter Property="BorderBrush" Value="Transparent"/>
      <Setter Property="Foreground" Value="#9AA3BA"/><Setter Property="Margin" Value="0,0,4,0"/><Setter Property="Padding" Value="6,7"/>
    </Style>
  </Window.Resources>
  <Border CornerRadius="18" BorderThickness="1" BorderBrush="#3A3466" Margin="14">
    <Border.Background>
      <LinearGradientBrush StartPoint="0,0" EndPoint="1,1"><GradientStop Color="#1A1838" Offset="0"/><GradientStop Color="#12151F" Offset="0.55"/></LinearGradientBrush>
    </Border.Background>
    <Border.Effect><DropShadowEffect BlurRadius="28" ShadowDepth="0" Opacity="0.65"/></Border.Effect>
    <Grid Margin="22,18,22,18">
      <Grid.RowDefinitions><RowDefinition Height="Auto"/><RowDefinition Height="Auto"/><RowDefinition Height="Auto"/><RowDefinition Height="Auto"/><RowDefinition Height="Auto"/><RowDefinition Height="Auto"/></Grid.RowDefinitions>
      <DockPanel x:Name="Topo" Grid.Row="0" Background="Transparent">
        <Button x:Name="BtnX" DockPanel.Dock="Right" Style="{StaticResource Link}" Content="✕" FontSize="14" ToolTip="Fechar"/>
        <StackPanel>
          <TextBlock Text="QUESTÃO RÁPIDA" Foreground="#B9A8FF" FontWeight="Bold" FontSize="11"/>
          <TextBlock x:Name="Titulo" Foreground="#9AA3BA" FontSize="12.5" TextTrimming="CharacterEllipsis" Margin="0,2,0,0"/>
        </StackPanel>
      </DockPanel>
      <WrapPanel Grid.Row="1" Margin="0,10,0,0">
        <Border x:Name="TagDisc" CornerRadius="9" Padding="9,2" Margin="0,0,6,0"><TextBlock x:Name="TagDiscT" FontSize="11.5" FontWeight="SemiBold"/></Border>
        <Border x:Name="TagOrig" CornerRadius="9" Padding="9,2"><TextBlock x:Name="TagOrigT" FontSize="11.5" FontWeight="SemiBold"/></Border>
      </WrapPanel>
      <ScrollViewer Grid.Row="2" MaxHeight="300" VerticalScrollBarVisibility="Auto" Margin="0,12,0,0">
        <TextBlock x:Name="Enunciado" TextWrapping="Wrap" Foreground="#EEF1F8" FontSize="14.5" LineHeight="21"/>
      </ScrollViewer>
      <StackPanel x:Name="Alts" Grid.Row="3" Margin="0,12,0,0"/>
      <Border x:Name="Fb" Grid.Row="4" CornerRadius="12" Padding="14,10" Margin="0,12,0,0" BorderThickness="1" Visibility="Collapsed">
        <StackPanel>
          <TextBlock x:Name="FbTitulo" FontWeight="Bold" FontSize="14"/>
          <ScrollViewer MaxHeight="150" VerticalScrollBarVisibility="Auto"><TextBlock x:Name="FbTexto" TextWrapping="Wrap" Foreground="#D8DCEA" FontSize="13" Margin="0,4,0,0" LineHeight="19"/></ScrollViewer>
          <TextBlock x:Name="FbFonte" TextWrapping="Wrap" Foreground="#6B7491" FontSize="11" Margin="0,6,0,0"/>
        </StackPanel>
      </Border>
      <DockPanel Grid.Row="5" Margin="0,14,0,0" LastChildFill="False">
        <Button x:Name="BtnP1" DockPanel.Dock="Left" Style="{StaticResource Link}" Content="Pausar 1h"/>
        <Button x:Name="BtnPH" DockPanel.Dock="Left" Style="{StaticResource Link}" Content="Chega por hoje"/>
        <Button x:Name="BtnFechar" DockPanel.Dock="Right" Style="{StaticResource Btn}" Content="Fechar"/>
        <Button x:Name="BtnOutra" DockPanel.Dock="Right" Style="{StaticResource Btn}" Content="Outra" ToolTip="Outra questão" Visibility="Collapsed"/>
        <Button x:Name="BtnSite" DockPanel.Dock="Right" Style="{StaticResource Btn}" Content="Ver a aula" ToolTip="Abre este assunto na plataforma" Visibility="Collapsed"/>
      </DockPanel>
      <TextBlock x:Name="Rodape" Grid.Row="5" Foreground="#6B7491" FontSize="11" HorizontalAlignment="Center" VerticalAlignment="Bottom" Margin="0,0,0,-14" Visibility="Collapsed"/>
    </Grid>
  </Border>
</Window>
'@

$win = [Windows.Markup.XamlReader]::Parse($xaml)
$E = @{}
foreach ($n in 'Topo', 'Titulo', 'TagDisc', 'TagDiscT', 'TagOrig', 'TagOrigT', 'Enunciado', 'Alts', 'Fb', 'FbTitulo', 'FbTexto', 'FbFonte',
    'BtnX', 'BtnP1', 'BtnPH', 'BtnFechar', 'BtnOutra', 'BtnSite') { $E[$n] = $win.FindName($n) }

# Cor que o WPF não entende (rgb(), hsl()…) vira o violeta padrão em vez de derrubar a janela.
function Cor([string]$cor) {
    try { return [Windows.Media.ColorConverter]::ConvertFromString($cor) } catch { return [Windows.Media.ColorConverter]::ConvertFromString('#7C5CFF') }
}
function Pincel([string]$cor) { New-Object Windows.Media.SolidColorBrush (Cor $cor) }
function Mistura([string]$cor, [double]$a) {
    $c = Cor $cor
    $c.A = [byte](255 * $a); New-Object Windows.Media.SolidColorBrush $c
}

# Markdown simples -> Runs (negrito com **, sem links, sem crases).
function Pintar-Texto($tb, [string]$md) {
    $tb.Inlines.Clear()
    $t = $md -replace '\r', '' -replace '\+\+', '' -replace '\\\n', "`n" -replace '\\$', '' -replace '\[([^\]]+)\]\([^)]+\)', '$1' -replace '`', '' -replace '(?m)^#{1,6}\s*', '' -replace '(?m)^\s*[-*+]\s+', '• '
    $partes = $t -split '\*\*'
    for ($i = 0; $i -lt $partes.Count; $i++) {
        $s = $partes[$i] -replace '(?<![\w*])\*([^*\n]+)\*(?![\w*])', '$1'
        $r = New-Object Windows.Documents.Run $s
        if ($i % 2 -eq 1) { $r.FontWeight = 'Bold' }
        $tb.Inlines.Add($r)
    }
}

$Estado = @{ q = $null; respondida = $false; n = 0 }
$Letras = 'ABCDE'

function Cartao-Alt([int]$k, [string]$texto) {
    $b = New-Object Windows.Controls.Border
    $b.CornerRadius = 12; $b.Padding = '12,9'; $b.Margin = '0,0,0,8'; $b.BorderThickness = 1
    $b.Background = Pincel '#181C29'; $b.BorderBrush = Pincel '#323A55'; $b.Cursor = 'Hand'; $b.Tag = $k
    $g = New-Object Windows.Controls.Grid
    $c0 = New-Object Windows.Controls.ColumnDefinition; $c0.Width = 'Auto'
    $c1 = New-Object Windows.Controls.ColumnDefinition
    $g.ColumnDefinitions.Add($c0); $g.ColumnDefinitions.Add($c1)
    $l = New-Object Windows.Controls.Border
    $l.Width = 26; $l.Height = 26; $l.CornerRadius = 8; $l.Background = Pincel '#20263A'; $l.VerticalAlignment = 'Top'; $l.Margin = '0,0,12,0'
    $lt = New-Object Windows.Controls.TextBlock
    $lt.Text = $Letras[$k]; $lt.FontWeight = 'Bold'; $lt.Foreground = Pincel '#EEF1F8'; $lt.HorizontalAlignment = 'Center'; $lt.VerticalAlignment = 'Center'
    $l.Child = $lt
    $tx = New-Object Windows.Controls.TextBlock
    $tx.TextWrapping = 'Wrap'; $tx.Foreground = Pincel '#EEF1F8'; $tx.FontSize = 13.5; $tx.VerticalAlignment = 'Center'; $tx.Margin = '0,2,0,0'
    Pintar-Texto $tx $texto
    [Windows.Controls.Grid]::SetColumn($tx, 1)
    [void]$g.Children.Add($l); [void]$g.Children.Add($tx)
    $b.Child = $g
    $b.Add_MouseEnter({ if (-not $Estado.respondida) { $this.BorderBrush = Pincel '#7C5CFF' } })
    $b.Add_MouseLeave({ if (-not $Estado.respondida) { $this.BorderBrush = Pincel '#323A55' } })
    $b.Add_MouseLeftButtonUp({ Responder ([int]$this.Tag) })
    return $b
}

function Mostrar-Questao($q) {
    $Estado.q = $q; $Estado.respondida = $false
    $d = $Disc[$q.disciplina]
    $cor = if ($d -and $d.cor) { $d.cor } else { '#7C5CFF' }
    $nomeAss = $Assunto["$($q.disciplina):$($q.assunto)"]
    $E.Titulo.Text = (@($(if ($d) { $d.nome } else { $q.disciplina }), $nomeAss) | Where-Object { $_ }) -join ' · '
    $E.TagDisc.Background = Mistura $cor 0.2; $E.TagDiscT.Foreground = Pincel $cor
    $E.TagDiscT.Text = if ($d) { $d.nome } else { $q.disciplina }
    switch ($q.origem) {
        'banca' { $E.TagOrigT.Text = "$($q.banca) $($q.ano)".Trim(); $E.TagOrig.Background = Mistura '#FFB020' 0.16; $E.TagOrigT.Foreground = Pincel '#FFC95C' }
        'semelhante' { $E.TagOrigT.Text = "Semelhante · $($q.banca) $($q.ano)".Trim(); $E.TagOrig.Background = Mistura '#22B8CF' 0.16; $E.TagOrigT.Foreground = Pincel '#6FDCEC' }
        default { $E.TagOrigT.Text = 'Autoral · estilo IDECAN'; $E.TagOrig.Background = Pincel '#20263A'; $E.TagOrigT.Foreground = Pincel '#9AA3BA' }
    }
    Pintar-Texto $E.Enunciado ([string]$q.enunciado)
    $E.Alts.Children.Clear()
    $alts = @($q.alternativas)
    for ($k = 0; $k -lt $alts.Count; $k++) { [void]$E.Alts.Children.Add((Cartao-Alt $k ([string]$alts[$k]))) }
    $E.Fb.Visibility = 'Collapsed'; $E.BtnOutra.Visibility = 'Collapsed'; $E.BtnSite.Visibility = 'Collapsed'
    if ($timer -and $timer.IsEnabled) { $timer.Stop(); $timer.Start() }   # questão nova: o prazo para fechar recomeça
}

function Responder([int]$k) {
    if ($Estado.respondida) { return }
    $Estado.respondida = $true
    if ($timer -and $timer.IsEnabled) { $timer.Stop(); $timer.Start() }   # tempo para ler a explicação, depois fecha
    $q = $Estado.q; $certa = [int]$q.correta
    $ok = Registrar $q $k
    foreach ($b in $E.Alts.Children) {
        $i = [int]$b.Tag; $b.Cursor = 'Arrow'
        $letra = $b.Child.Children[0]
        if ($i -eq $certa) { $b.BorderBrush = Pincel '#2FBF71'; $b.Background = Mistura '#2FBF71' 0.14; $letra.Background = Pincel '#2FBF71' }
        elseif ($i -eq $k) { $b.BorderBrush = Pincel '#FF5470'; $b.Background = Mistura '#FF5470' 0.12; $letra.Background = Pincel '#FF5470' }
        else { $b.Opacity = 0.5 }
    }
    if ($ok) {
        $E.Fb.Background = Mistura '#2FBF71' 0.1; $E.Fb.BorderBrush = Mistura '#2FBF71' 0.45
        $E.FbTitulo.Foreground = Pincel '#7EE2A8'; $E.FbTitulo.Text = '✓ Você acertou!'
    } else {
        $E.Fb.Background = Mistura '#FF5470' 0.08; $E.Fb.BorderBrush = Mistura '#FF5470' 0.4
        $E.FbTitulo.Foreground = Pincel '#FF8DA0'; $E.FbTitulo.Text = "✕ Não foi dessa vez. Resposta: $($Letras[$certa])"
    }
    Pintar-Texto $E.FbTexto ([string]$q.comentario)
    $E.FbTexto.Visibility = if ($q.comentario) { 'Visible' } else { 'Collapsed' }
    $partes = if ($q.origem -ne 'autoral') { @($q.banca, $q.ano, $q.orgao, $q.cargo) | Where-Object { $_ } } else { @() }
    $E.FbFonte.Text = ((@($partes) -join ' · ') + '   ' + (Hoje-Resumo)).Trim()
    $E.Fb.Visibility = 'Visible'; $E.BtnOutra.Visibility = 'Visible'; $E.BtnSite.Visibility = 'Visible'
    $E.BtnFechar.Content = 'Fechar'
}

function Posicionar {
    $wa = [System.Windows.SystemParameters]::WorkArea
    $win.Left = $wa.Right - $win.ActualWidth - 4
    $win.Top = [math]::Max($wa.Top, $wa.Bottom - $win.ActualHeight - 4)
}
function Pausar([int64]$ate) { Agendar-Proxima $ate; $win.Close() }

$E.BtnX.Add_Click({ $win.Close() })
$E.BtnFechar.Add_Click({ $win.Close() })
$E.BtnOutra.Add_Click({ Mostrar-Questao (Nova-Questao) })
$E.BtnSite.Add_Click({
    $q = $Estado.q
    $rota = if ($q.assunto) { "a/$($q.disciplina)/$($q.assunto)" } elseif ($q.prova) { "prova/$($q.prova)" } else { "d/$($q.disciplina)" }
    Start-Process ("{0}#/{1}" -f $cfg.siteUrl, $rota)
    $win.Close()
})
$E.BtnP1.Add_Click({ Pausar ((Agora-Ms) + 3600000L) })
$E.BtnPH.Add_Click({ Pausar ([DateTimeOffset]::new([DateTime]::Today.AddDays(1).AddHours([int]$cfg.inicio)).ToUnixTimeMilliseconds()) })
$E.Topo.Add_MouseLeftButtonDown({ try { $win.DragMove() } catch { } })
$win.Add_SizeChanged({ Posicionar })
$win.Add_KeyDown({
    param($s, $e)
    $t = $e.Key.ToString()
    $i = $Letras.IndexOf($t)
    if ($i -lt 0 -and $t -match '^D([1-5])$') { $i = [int]$Matches[1] - 1 }
    if ($i -ge 0 -and $i -lt $E.Alts.Children.Count) { Responder $i }
    elseif ($t -eq 'Escape') { $win.Close() }
})

# Some sozinho se ninguém responder (a pessoa pode ter saído).
$timer = New-Object Windows.Threading.DispatcherTimer
$timer.Interval = [TimeSpan]::FromMinutes([double]$cfg.fecharSemRespostaMin)
$timer.Add_Tick({ $timer.Stop(); Log $(if ($Estado.respondida) { 'fechado depois do tempo de leitura' } else { 'fechado sem resposta' }); $win.Close() })

Mostrar-Questao (Nova-Questao)

if ($Captura) {
    $win.ShowInTaskbar = $false; $win.Left = -20000; $win.Top = -20000
    $win.Show()
    if ($Responder -ge 0) { $Prog = [pscustomobject]@{ origem = 'popup'; resp = [pscustomobject]@{} }; $ArqProgresso = Join-Path $env:TEMP 'estudos-cg-captura.json'; Responder $Responder }
    $win.UpdateLayout()
    $raiz = $win.Content
    $w = [int][math]::Ceiling($raiz.ActualWidth + 28); $h = [int][math]::Ceiling($raiz.ActualHeight + 28)
    $bmp = New-Object Windows.Media.Imaging.RenderTargetBitmap $w, $h, 96, 96, ([Windows.Media.PixelFormats]::Pbgra32)
    $bmp.Render($raiz)
    $enc = New-Object Windows.Media.Imaging.PngBitmapEncoder
    $enc.Frames.Add([Windows.Media.Imaging.BitmapFrame]::Create($bmp))
    $fs = [IO.File]::Create($Captura); $enc.Save($fs); $fs.Close()
    $win.Close()
    "captura salva em $Captura"
    exit 0
}

Agendar-Proxima
Log ('aberta: ' + $Estado.q.id)
$win.Add_ContentRendered({ Posicionar; $timer.Start() })
[void]$win.ShowDialog()

# Depois que a janela fecha: manda as respostas do pop-up para o Drive (o servidor ignora as que já tem).
if ($Sync -and $Estado.n -gt 0) {
    try {
        $corpo = @{ t = [string]$Sync.chave; estado = @{ resp = $Prog.resp } } | ConvertTo-Json -Depth 8 -Compress
        $r = Invoke-RestMethod -Uri ([string]$Sync.url) -Method Post -Body ([Text.Encoding]::UTF8.GetBytes($corpo)) -ContentType 'text/plain; charset=utf-8' -TimeoutSec 25
        if ($r.ok) { Log "Drive: $($r.novas) resposta(s) nova(s) enviada(s)" } else { Log "Drive recusou: $($r.erro)" }
    } catch { Log "Drive não respondeu ao enviar: $($_.Exception.Message)" }
}
if ($Trava) { $Trava.ReleaseMutex() }

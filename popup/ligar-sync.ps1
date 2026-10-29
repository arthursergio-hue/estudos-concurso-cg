<#
  Liga a sincronização do pop-up com o Drive. Recebe o mesmo link que você abre no PC e no celular
  (https://arthursergio-hue.github.io/estudos-concurso-cg/#/sync?u=...&t=...), testa e grava popup\sync.json.
  Uso:    powershell -ExecutionPolicy Bypass -File C:\dev\pessoal\estudos\popup\ligar-sync.ps1 "<link>"
  Desligar: apague popup\sync.json (ele fica fora do Git: guarda a chave).
#>
param([Parameter(Mandatory = $true)][string]$Link)
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12

$consulta = ($Link -split '#/sync\?', 2)[1]
if (-not $consulta) { throw 'O link precisa ter "#/sync?u=...&t=...". Use o link que o configurar() mostrou no Apps Script.' }
$par = @{}
foreach ($kv in $consulta -split '&') {
    $k, $v = $kv -split '=', 2
    if ($k) { $par[$k] = [uri]::UnescapeDataString([string]$v) }
}
$url = [string]$par['u']; $chave = [string]$par['t']
if ($url -match '/dev([?#]|$)') {
    throw 'Esse link usa o endereço de teste (/dev) do Apps Script, que só abre logado. Use a URL do app da Web (termina em /exec).'
}
if ($url -notmatch '^https://script\.google(usercontent)?\.com/' -or $chave -notmatch '^[\w-]{16,128}$') {
    throw 'Link inválido: falta o endereço do Apps Script ou a chave.'
}
try { $r = Invoke-RestMethod -Uri ($url + '?t=' + [uri]::EscapeDataString($chave)) -TimeoutSec 20 }
catch { throw "O Drive não respondeu: $($_.Exception.Message)" }
if (-not $r.ok) { throw "O Apps Script respondeu, mas recusou a chave: $($r.erro)" }

$arq = Join-Path $PSScriptRoot 'sync.json'
[IO.File]::WriteAllText($arq, (@{ url = $url; chave = $chave } | ConvertTo-Json -Compress), (New-Object System.Text.UTF8Encoding $false))
"Pronto: o pop-up agora junta as respostas com o Drive (configuração em $arq)."

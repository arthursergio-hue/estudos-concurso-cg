<#
  Liga o pop-up de questões: cria a tarefa agendada "Estudos CG - questao rapida", que roda a cada 15 minutos
  (e no logon). O script questao.ps1 decide se é hora e se você está livre. Para desligar: remover.ps1.
#>
$ErrorActionPreference = 'Stop'
$Nome = 'Estudos CG - questao rapida'
$vbs = Join-Path $PSScriptRoot 'iniciar.vbs'
$acao = New-ScheduledTaskAction -Execute 'wscript.exe' -Argument "`"$vbs`""
$cada15 = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(2) -RepetitionInterval (New-TimeSpan -Minutes 15)
$logon = New-ScheduledTaskTrigger -AtLogOn -User "$env:USERDOMAIN\$env:USERNAME"
$cfg = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 30) -MultipleInstances IgnoreNew
Register-ScheduledTask -TaskName $Nome -Action $acao -Trigger @($cada15, $logon) -Settings $cfg `
    -Description 'Mostra uma questão do concurso de Campina Grande de tempos em tempos, só quando o PC está livre (C:\dev\pessoal\estudos\popup).' -Force | Out-Null

# A primeira questão vem daqui a uns 20 minutos (depois segue o intervalo sorteado do config.json).
$est = Join-Path $PSScriptRoot 'estado.json'
$prox = [DateTimeOffset]::Now.AddMinutes(20).ToUnixTimeMilliseconds()
[IO.File]::WriteAllText($est, "{`"proximo`":$prox,`"pausaAte`":0}", (New-Object System.Text.UTF8Encoding $false))

$t = Get-ScheduledTask -TaskName $Nome
"Tarefa '$Nome' criada ($($t.State)). Primeira questão por volta de $((Get-Date).AddMinutes(20).ToString('HH:mm'))."

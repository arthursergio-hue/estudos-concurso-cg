<# Desliga o pop-up de questões (apaga a tarefa agendada). Para ligar de novo: agendar.ps1. #>
$Nome = 'Estudos CG - questao rapida'
if (Get-ScheduledTask -TaskName $Nome -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName $Nome -Confirm:$false
    "Tarefa '$Nome' removida."
} else { "A tarefa '$Nome' não existe." }

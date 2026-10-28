' Abre o pop-up de questões sem mostrar a janela preta do PowerShell (é o que a tarefa agendada chama).
Set sh = CreateObject("WScript.Shell")
pasta = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
sh.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -STA -WindowStyle Hidden -File """ & pasta & "\questao.ps1""", 0, False

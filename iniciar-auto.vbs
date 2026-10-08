Dim WshShell, scriptDir
Set WshShell = CreateObject("WScript.Shell")
scriptDir = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\"))

WshShell.Run "cmd /c cd /d """ & scriptDir & """ && node server.js", 0, False
WScript.Sleep 2000
WshShell.Run "http://localhost:8787"

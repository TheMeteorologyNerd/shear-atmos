Set shell = CreateObject("WScript.Shell")
shell.Run Chr(34) & Replace(WScript.ScriptFullName, ".vbs", ".cmd") & Chr(34), 0, False

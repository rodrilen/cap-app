@echo off
set NODE_EXTRA_CA_CERTS=C:\ProgramData\Avast Software\Avast\wscert.pem
set NODE_USE_SYSTEM_CA=1
"C:\Program Files\nodejs\node.exe" "%~dp0node_modules\next\dist\bin\next" dev "%~dp0."

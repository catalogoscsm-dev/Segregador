@echo off
cd /d "%~dp0"

:: Verifica se já está rodando na porta 8787
netstat -ano | findstr ":8787" >nul 2>&1
if %errorlevel% == 0 (
    echo Servidor ja esta rodando.
    start "" "http://localhost:8787"
    exit
)

:: Inicia o servidor em background
start /B node server.js

:: Aguarda 2 segundos e abre o navegador
timeout /t 2 /nobreak >nul
start "" "http://localhost:8787"

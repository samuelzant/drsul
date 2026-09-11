@echo off
setlocal
title Sistema Metalurgica - Iniciar

set "BASE=%~dp0"
cd /d "%BASE%"

echo ============================================
echo   Sistema Metalurgica - Iniciando servidor
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 goto sem_node

if not exist "%BASE%server\node_modules" goto sem_instalacao
if not exist "%BASE%client\dist" goto sem_instalacao

set "IP="
for /f "tokens=2 delims=:" %%A in ('ipconfig ^| findstr /R /C:"IPv4"') do call :guarda_ip "%%A"

echo ============================================
echo   Acesse neste computador:
echo     http://localhost:3001
echo.
if not defined IP goto sem_ip
echo   Acesse do outro computador da rede:
echo     http://%IP%:3001
goto fim_endereco

:sem_ip
echo   Nao foi possivel detectar o IP automaticamente.
echo   Digite ipconfig no prompt e use o Endereco IPv4
echo   da sua placa de rede no lugar de localhost.

:fim_endereco
echo ============================================
echo.
echo NAO FECHE A JANELA "Metalurgica - Servidor" enquanto o sistema
echo estiver em uso. Para parar o servidor, feche aquela janela.
echo.

cd /d "%BASE%server"
start "Metalurgica - Servidor" cmd /k "call npm start"

echo Aguardando o servidor iniciar...
timeout /t 5 /nobreak >nul

start "" "http://localhost:3001"

echo.
echo O navegador foi aberto automaticamente. Esta janela pode ser
echo fechada com seguranca - o servidor continua rodando na janela
echo "Metalurgica - Servidor".
echo.
pause
exit /b 0

:guarda_ip
if defined IP goto :eof
set "IP=%~1"
set "IP=%IP: =%"
goto :eof

:sem_node
echo [ERRO] O Node.js nao foi encontrado neste computador.
echo Execute primeiro o arquivo "instalar.bat".
echo.
pause
exit /b 1

:sem_instalacao
echo [ERRO] O sistema ainda nao foi instalado neste computador.
echo Execute primeiro o arquivo "instalar.bat".
echo.
pause
exit /b 1

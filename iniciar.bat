@echo off
chcp 65001 >nul
setlocal
title Sistema Metalurgica - Servidor

set "BASE=%~dp0"
cd /d "%BASE%"

echo ============================================
echo   Sistema Metalurgica - Iniciando servidor
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo [ERRO] Node.js nao foi encontrado neste computador.
    echo Execute primeiro o arquivo "instalar.bat".
    echo.
    pause
    exit /b 1
)

if not exist "%BASE%server\node_modules" (
    echo [ERRO] Dependencias do servidor nao instaladas.
    echo Execute primeiro o arquivo "instalar.bat".
    echo.
    pause
    exit /b 1
)

if not exist "%BASE%client\dist" (
    echo [ERRO] A interface ainda nao foi gerada (build).
    echo Execute primeiro o arquivo "instalar.bat".
    echo.
    pause
    exit /b 1
)

echo Descobrindo o endereco deste computador na rede local...
echo.
for /f "tokens=2 delims=:" %%A in ('ipconfig ^| findstr /R /C:"IPv4"') do (
    set "IP=%%A"
    goto :ip_encontrado
)
:ip_encontrado
if defined IP set "IP=%IP: =%"

echo ============================================
echo   Acesse neste computador:
echo     http://localhost:3001
echo.
if defined IP (
    echo   Acesse do outro computador da rede:
    echo     http://%IP%:3001
) else (
    echo   Nao foi possivel detectar o IP automaticamente.
    echo   Descubra manualmente digitando "ipconfig" e use o
    echo   "Endereco IPv4" no lugar de localhost.
)
echo ============================================
echo.
echo NAO FECHE A JANELA "Metalurgica - Servidor" enquanto o sistema
echo estiver em uso. Para parar o servidor, feche aquela janela ou
echo pressione Ctrl+C dentro dela.
echo.

cd /d "%BASE%server"
start "Metalurgica - Servidor" cmd /k "call npm start"

echo Aguardando o servidor iniciar...
timeout /t 4 /nobreak >nul

start "" "http://localhost:3001"

echo.
echo O navegador foi aberto automaticamente. Esta janela pode ser
echo fechada com seguranca - o servidor continua rodando na janela
echo "Metalurgica - Servidor".
echo.
pause

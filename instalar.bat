@echo off
chcp 65001 >nul
setlocal
title Sistema Metalurgica - Instalacao

set "BASE=%~dp0"
cd /d "%BASE%"

echo ============================================
echo   Sistema Metalurgica - Instalacao inicial
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo [ERRO] Node.js nao foi encontrado neste computador.
    echo.
    echo Baixe e instale o Node.js (versao LTS) em:
    echo   https://nodejs.org
    echo.
    echo Depois de instalar, feche esta janela e execute este arquivo novamente.
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js encontrado:
node -v
echo.

echo [1/3] Instalando dependencias do servidor...
cd /d "%BASE%server"
call npm install
if errorlevel 1 (
    echo.
    echo [ERRO] Falha ao instalar dependencias do servidor.
    pause
    exit /b 1
)
echo.

echo [2/3] Instalando dependencias da interface (frontend)...
cd /d "%BASE%client"
call npm install
if errorlevel 1 (
    echo.
    echo [ERRO] Falha ao instalar dependencias da interface.
    pause
    exit /b 1
)
echo.

echo [3/3] Gerando build da interface...
call npm run build
if errorlevel 1 (
    echo.
    echo [ERRO] Falha ao gerar o build da interface.
    pause
    exit /b 1
)

cd /d "%BASE%"
echo.
echo ============================================
echo   Instalacao concluida com sucesso!
echo ============================================
echo.
echo Agora execute o arquivo "iniciar.bat" para ligar o sistema.
echo.
pause

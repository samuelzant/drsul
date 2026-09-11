@echo off
setlocal
title Sistema Metalurgica - Instalacao

set "BASE=%~dp0"
cd /d "%BASE%"

echo ============================================
echo   Sistema Metalurgica - Instalacao inicial
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 goto sem_node

echo [OK] Node.js encontrado:
node -v
echo.

echo [1/3] Instalando dependencias do servidor...
cd /d "%BASE%server"
call npm install
if errorlevel 1 goto erro_servidor
echo.

echo [2/3] Instalando dependencias da interface...
cd /d "%BASE%client"
call npm install
if errorlevel 1 goto erro_interface
echo.

echo [3/3] Gerando a interface...
call npm run build
if errorlevel 1 goto erro_build

cd /d "%BASE%"
echo.
echo ============================================
echo   Instalacao concluida com sucesso!
echo ============================================
echo.
echo Agora execute o arquivo "iniciar.bat" para ligar o sistema.
echo.
pause
exit /b 0

:sem_node
echo [ERRO] O Node.js nao foi encontrado neste computador.
echo.
echo Baixe e instale o Node.js - versao LTS - no site:
echo    https://nodejs.org
echo.
echo Depois de instalar, feche esta janela e execute este arquivo de novo.
echo.
pause
exit /b 1

:erro_servidor
echo.
echo [ERRO] Falha ao instalar as dependencias do servidor.
echo Verifique se este computador esta conectado a internet.
echo.
pause
exit /b 1

:erro_interface
echo.
echo [ERRO] Falha ao instalar as dependencias da interface.
echo Verifique se este computador esta conectado a internet.
echo.
pause
exit /b 1

:erro_build
echo.
echo [ERRO] Falha ao gerar a interface.
echo.
pause
exit /b 1

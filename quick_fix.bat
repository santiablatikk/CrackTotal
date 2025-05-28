@echo off
title 🚀 SOLUCIÓN RÁPIDA - SIN CACHE

echo ==========================================
echo   🚀 SOLUCIÓN RÁPIDA SIN COMPLICACIONES
echo ==========================================

echo.
echo 🔥 ABRIENDO NAVEGADOR EN MODO INCÓGNITO
echo    (No hay cache en modo incógnito)
echo.

timeout /t 2 >nul

echo ✅ Verificando servidor...
tasklist | find "python" >nul
if %errorlevel% neq 0 (
    echo 🚀 Iniciando servidor...
    start /b python super_no_cache_server.py
    timeout /t 3 >nul
)

echo 🌐 Abriendo Chrome en modo incógnito...
start chrome --incognito "http://localhost:8000/ranking.html"

if %errorlevel% neq 0 (
    echo 🌐 Probando Edge en modo incógnito...
    start msedge --inprivate "http://localhost:8000/ranking.html"
)

if %errorlevel% neq 0 (
    echo 🌐 Probando Firefox en modo privado...
    start firefox --private-window "http://localhost:8000/ranking.html"
)

echo.
echo ✅ LISTO! El navegador se abrió en modo incógnito
echo 🔥 En modo incógnito NO HAY CACHE
echo 💡 Los cambios se ven INMEDIATAMENTE
echo.
echo ➡️  URL: http://localhost:8000/ranking.html
echo.
pause 
@echo off
title Crack Total - Toggle Cache Configuration

echo =========================================
echo   ⚙️  CONFIGURADOR DE CACHE CRACK TOTAL
echo =========================================

echo.
echo 🔍 Estado actual:
if exist ".htaccess_production" (
    echo    💚 Modo DESARROLLO activo (sin cache)
    echo.
    echo 🔄 ¿Cambiar a modo PRODUCCIÓN? (S/N)
    set /p choice="> "
    if /i "%choice%"=="S" (
        echo.
        echo 📦 Cambiando a modo PRODUCCIÓN...
        move ".htaccess" ".htaccess_dev" >nul 2>&1
        move ".htaccess_production" ".htaccess" >nul 2>&1
        echo ✅ Modo PRODUCCIÓN activado (con cache optimizado)
    ) else (
        echo ❌ Cancelado. Manteniendo modo desarrollo.
    )
) else (
    echo    🔥 Modo PRODUCCIÓN activo (con cache)
    echo.
    echo 🔄 ¿Cambiar a modo DESARROLLO? (S/N)
    set /p choice="> "
    if /i "%choice%"=="S" (
        echo.
        echo 🛠️  Cambiando a modo DESARROLLO...
        move ".htaccess" ".htaccess_production" >nul 2>&1
        move ".htaccess_dev" ".htaccess" >nul 2>&1
        echo ✅ Modo DESARROLLO activado (sin cache)
    ) else (
        echo ❌ Cancelado. Manteniendo modo producción.
    )
)

echo.
echo 🚀 ¿Reiniciar servidor? (S/N)
set /p restart="> "
if /i "%restart%"=="S" (
    echo.
    echo 🔄 Reiniciando servidor...
    taskkill /f /im python3.11.exe >nul 2>&1
    taskkill /f /im python.exe >nul 2>&1
    timeout /t 2 >nul
    start /b python no_cache_server.py
    echo ✅ Servidor reiniciado en: http://localhost:8000
)

echo.
echo 💡 RECORDATORIO:
echo    - Modo DESARROLLO: Cambios inmediatos, sin cache
echo    - Modo PRODUCCIÓN: Cache optimizado para velocidad
echo.
pause
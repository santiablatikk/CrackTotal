@echo off
title 🔥 FORZAR RECARGA SIN CACHÉ - CRACK TOTAL

echo =========================================
echo   🔥 FORZAR RECARGA TOTAL SIN CACHE
echo =========================================

echo.
echo ❌ PROBLEMA: F5 no es suficiente cuando hay cache persistente
echo.
echo ✅ SOLUCIÓN: Sigue estos pasos EXACTOS:
echo.
echo 📋 PASO 1: ABRE DEVTOOLS PRIMERO
echo    ➡️ Presiona F12 (o Ctrl+Shift+I)
echo.
echo 📋 PASO 2: ACTIVA "DISABLE CACHE"
echo    ➡️ Ve a la pestaña "Network"
echo    ➡️ Marca la casilla "Disable cache" ✅
echo.
echo 📋 PASO 3: RECARGA FORZADA
echo    ➡️ Con DevTools ABIERTO, presiona:
echo       🔥 Ctrl + Shift + R
echo       🔥 O Ctrl + F5
echo       🔥 O Shift + F5
echo.
echo 🚨 IMPORTANTE: DevTools debe estar ABIERTO
echo    (si cierras DevTools, el cache vuelve)
echo.
echo 📋 PASO 4: ALTERNATIVA EXTREMA
echo    Si aún no funciona:
echo    ➡️ Ctrl + Shift + Delete
echo    ➡️ Selecciona "Cached images and files"
echo    ➡️ Click "Clear data"
echo.

echo 💡 DETECTANDO ESTADO DEL SERVIDOR...
echo.

timeout /t 2 >nul

tasklist | find "python" >nul
if %errorlevel% equ 0 (
    echo ✅ Servidor Python ejecutándose
    echo 📍 URL: http://localhost:8000
) else (
    echo ❌ Servidor no detectado. Iniciando...
    start /b python no_cache_server.py
    timeout /t 3 >nul
    echo ✅ Servidor iniciado en: http://localhost:8000
)

echo.
echo 🎯 AHORA HAZ ESTO:
echo    1️⃣ Abre el navegador
echo    2️⃣ Ve a: http://localhost:8000/ranking.html
echo    3️⃣ Presiona F12 para abrir DevTools
echo    4️⃣ Ve a Network → Marca "Disable cache" ✅
echo    5️⃣ Presiona Ctrl + Shift + R
echo.
echo 🔥 ¡Los cambios aparecerán INMEDIATAMENTE!
echo.
pause

echo.
echo 🚀 ¿Abrir navegador automáticamente? (S/N)
set /p open="> "
if /i "%open%"=="S" (
    start http://localhost:8000/ranking.html
    echo 🌐 Navegador abierto. Recuerda:
    echo    F12 → Network → Disable cache ✅
    echo    Luego: Ctrl + Shift + R
)

echo.
pause 
@echo off
echo =========================================
echo   🧹 LIMPIADOR DE CACHE CRACK TOTAL
echo =========================================

echo.
echo 🔄 Deteniendo servidores anteriores...
taskkill /f /im python3.11.exe 2>nul
taskkill /f /im python.exe 2>nul
timeout /t 2 >nul

echo.
echo 🚀 Iniciando servidor SIN CACHE...
start /b python no_cache_server.py

echo.
echo 💡 INSTRUCCIONES PARA LIMPIAR CACHE DEL NAVEGADOR:
echo.
echo 🔥 CHROME/EDGE:
echo    Ctrl + Shift + R  (Recarga forzada)
echo    F12 → Network → Disable cache ✅
echo.
echo 🔥 FIREFOX:
echo    Ctrl + Shift + R  (Recarga forzada)
echo    F12 → Network → Settings → Disable cache ✅
echo.
echo 🔥 ALTERNATIVA EXTREMA:
echo    Ctrl + Shift + Delete (Borrar datos de navegación)
echo.
echo ✅ Servidor iniciado en: http://localhost:8000
echo.
echo 📝 TIPS:
echo    - Usa modo incógnito/privado para evitar cache
echo    - Abre DevTools (F12) antes de cargar la página
echo    - Activa "Disable cache" en DevTools
echo.
pause 
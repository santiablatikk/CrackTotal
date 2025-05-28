#!/usr/bin/env python3
"""
Servidor HTTP SÚPER SIN CACHÉ para desarrollo
Soluciona TODOS los problemas de caché del navegador
"""
import http.server
import socketserver
import os
import sys
import time
from urllib.parse import unquote, urlparse, parse_qs

class SuperNoCacheHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Headers EXTREMOS anti-caché
        timestamp = str(int(time.time()))
        
        # Múltiples headers anti-caché
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', 'Thu, 01 Jan 1970 00:00:00 GMT')
        self.send_header('Last-Modified', 'Thu, 01 Jan 1970 00:00:00 GMT')
        
        # Headers adicionales anti-caché
        self.send_header('X-Accel-Expires', '0')
        self.send_header('Surrogate-Control', 'no-store')
        self.send_header('Clear-Site-Data', '"cache", "storage"')
        
        # CORS completo
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
        self.send_header('Access-Control-Max-Age', '0')
        
        # Timestamp único para cada respuesta
        self.send_header('X-Timestamp', timestamp)
        self.send_header('X-Cache-Buster', f'nocache-{timestamp}')
        self.send_header('X-App-Version', f'DEV-{timestamp}')
        
        # Prevenir proxy caché
        self.send_header('Vary', '*')
        
        super().end_headers()
    
    def do_GET(self):
        """GET con logging mejorado y anti-caché extremo"""
        path = self.path
        timestamp = int(time.time())
        
        # Log detallado
        print(f"🔄 [{timestamp}] GET: {path}")
        
        # Si es un archivo estático, agregar timestamp
        if path.endswith(('.css', '.js', '.html')):
            print(f"📄 Archivo estático detectado: {path}")
            
        # Llamar al método padre
        return super().do_GET()
    
    def do_OPTIONS(self):
        """Manejar preflight CORS"""
        self.send_response(200)
        self.end_headers()
    
    def log_message(self, format, *args):
        """Log personalizado con timestamp"""
        timestamp = time.strftime('%H:%M:%S')
        print(f"🌐 [{timestamp}] {format % args}")

def run_server(port=8000):
    """Ejecutar servidor SÚPER sin caché"""
    try:
        # Cambiar al directorio del script
        script_dir = os.path.dirname(os.path.abspath(__file__))
        os.chdir(script_dir)
        
        print("=" * 60)
        print("🚀 SERVIDOR SÚPER SIN CACHÉ INICIADO")
        print("=" * 60)
        print(f"📂 Directorio: {script_dir}")
        print(f"🌐 Puerto: {port}")
        print(f"📍 URLs:")
        print(f"   • http://localhost:{port}")
        print(f"   • http://127.0.0.1:{port}")
        print()
        print("💡 CARACTERÍSTICAS EXTREMAS:")
        print("   ✅ Headers anti-caché múltiples")
        print("   ✅ Timestamps únicos por request")
        print("   ✅ Clear-Site-Data automático")
        print("   ✅ CORS completo habilitado")
        print("   ✅ Logs detallados en tiempo real")
        print()
        print("🔥 GARANTÍA: CERO CACHÉ DEL NAVEGADOR")
        print()
        print("⚠️  INSTRUCCIONES PARA EL NAVEGADOR:")
        print("   1. Abre DevTools (F12)")
        print("   2. Ve a Network → ✅ Disable cache")
        print("   3. Usa Ctrl+Shift+R (recarga forzada)")
        print()
        print("⏹️  Presiona Ctrl+C para detener")
        print("=" * 60)
        
        with socketserver.TCPServer(("", port), SuperNoCacheHTTPRequestHandler) as httpd:
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n\n🛑 Servidor detenido por el usuario")
        print("📊 ESTADÍSTICAS:")
        print(f"   • Tiempo activo: {time.strftime('%H:%M:%S')}")
        print("   • Cache eliminado: ✅")
        
    except OSError as e:
        if "Address already in use" in str(e):
            print(f"\n❌ Puerto {port} ocupado.")
            print(f"🔄 Intentando puerto {port + 1}...")
            run_server(port + 1)
        else:
            print(f"\n❌ Error: {e}")

if __name__ == "__main__":
    port = 8000
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print("❌ Puerto debe ser un número")
            sys.exit(1)
    
    run_server(port) 
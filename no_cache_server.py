#!/usr/bin/env python3
"""
Servidor HTTP sin caché para desarrollo
Soluciona problemas de caché del navegador
"""
import http.server
import socketserver
import os
import sys
from urllib.parse import unquote

class NoCacheHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Headers para deshabilitar completamente el caché
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.send_header('Last-Modified', 'Thu, 01 Jan 1970 00:00:00 GMT')
        # CORS headers para evitar problemas con módulos ES6
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_GET(self):
        # Log para debug
        print(f"📂 Sirviendo: {self.path}")
        
        # Llamar al método padre
        return super().do_GET()
    
    def log_message(self, format, *args):
        # Log personalizado más limpio
        print(f"🔄 {format % args}")

def run_server(port=8000):
    """Ejecutar servidor sin caché"""
    try:
        # Cambiar al directorio del script
        os.chdir(os.path.dirname(os.path.abspath(__file__)))
        
        with socketserver.TCPServer(("", port), NoCacheHTTPRequestHandler) as httpd:
            print(f"🚀 Servidor SIN CACHÉ iniciado en:")
            print(f"   📍 http://localhost:{port}")
            print(f"   📍 http://127.0.0.1:{port}")
            print("\n💡 CARACTERÍSTICAS:")
            print("   ✅ Sin caché del navegador")
            print("   ✅ Headers CORS habilitados")
            print("   ✅ Recarga automática de archivos")
            print("\n🔥 Los cambios se verán INMEDIATAMENTE")
            print("\n⏹️  Presiona Ctrl+C para detener")
            print("=" * 50)
            
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n🛑 Servidor detenido por el usuario")
    except OSError as e:
        if "Address already in use" in str(e):
            print(f"\n❌ Puerto {port} ocupado. Intentando puerto {port + 1}...")
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
import { defineConfig } from 'vite';

export default defineConfig({
  // Opciones de configuración si son necesarias,
  // por ahora, la configuración por defecto suele ser suficiente
  // para un sitio estático simple.
  build: {
    // Opcional: configuraciones específicas del build
  },
  server: {
    // Opcional: configuraciones del servidor de desarrollo local
    // port: 3000, // Puedes cambiar el puerto si 5173 está ocupado
    // open: true, // Abrir automáticamente en el navegador
  }
});

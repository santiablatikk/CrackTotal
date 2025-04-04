// server.js
const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000; // Render proporciona el puerto vía env var

// Define la carpeta que contiene los archivos estáticos (HTML, CSS, JS, imágenes)
const publicDirectoryPath = path.join(__dirname, 'public');

// Sirve los archivos estáticos desde la carpeta 'public'
app.use(express.static(publicDirectoryPath));

// Ruta catch-all para manejar cualquier solicitud que no coincida con un archivo estático
// Envía el archivo principal (ajusta 'crack-total.html' si es necesario)
app.get('*', (req, res) => {
  // Intenta enviar el archivo solicitado, si no, envía crack-total.html
  res.sendFile(path.join(publicDirectoryPath, 'crack-total.html'), (err) => {
      if (err) {
          // Si hay un error (ej. archivo no encontrado), envía el index
          // Asegúrate de que 'crack-total.html' existe en public/
          res.sendFile(path.join(publicDirectoryPath, 'crack-total.html'), (finalErr) => {
            if (finalErr) {
                console.error("Error al enviar archivo catch-all:", finalErr);
                res.status(500).send('Error interno del servidor');
            }
          });
      }
  });
});

app.listen(port, () => {
  console.log(`Servidor iniciado en el puerto ${port}`);
  console.log(`Sirviendo archivos desde: ${publicDirectoryPath}`);
});

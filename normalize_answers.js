// Script para normalizar respuestas en archivos JSON
const fs = require('fs');

// Función para normalizar texto (eliminar acentos y caracteres especiales)
function normalizeText(text) {
  if (!text) return text;
  
  return text
    // Normalizar caracteres específicos
    .replace(/[áàäâãå]/gi, 'a')
    .replace(/[éèëê]/gi, 'e')
    .replace(/[íìïî]/gi, 'i')
    .replace(/[óòöôõø]/gi, 'o')
    .replace(/[úùüû]/gi, 'u')
    .replace(/[ñ]/gi, 'n')
    .replace(/[ç]/gi, 'c')
    .replace(/[đ]/gi, 'd')
    .replace(/[ß]/gi, 'ss')
    .replace(/[ğ]/gi, 'g')
    .replace(/[ř]/gi, 'r')
    .replace(/[ș]/gi, 's')
    .replace(/[ț]/gi, 't')
    .replace(/[ž]/gi, 'z')
    .replace(/[ć]/gi, 'c')
    .replace(/[ł]/gi, 'l')
    .replace(/[ś]/gi, 's')
    .replace(/[ź]/gi, 'z')
    .replace(/[ý]/gi, 'y');
}

// Archivos a procesar
const files = [
  'public/data/questions.json',
  'public/data/questions_pasapalabra.json'
];

// Procesar cada archivo
files.forEach(filePath => {
  try {
    console.log(`Procesando ${filePath}...`);
    
    // Leer el archivo
    const data = fs.readFileSync(filePath, 'utf8');
    const jsonData = JSON.parse(data);
    let changesCount = 0;
    
    // Normalizar respuestas
    jsonData.forEach(letterObj => {
      if (letterObj.preguntas && Array.isArray(letterObj.preguntas)) {
        letterObj.preguntas.forEach(questionObj => {
          if (questionObj.respuesta) {
            const originalAnswer = questionObj.respuesta;
            const normalizedAnswer = normalizeText(originalAnswer);
            
            if (originalAnswer !== normalizedAnswer) {
              questionObj.respuesta = normalizedAnswer;
              changesCount++;
              console.log(`Cambio: "${originalAnswer}" → "${normalizedAnswer}"`);
            }
          }
        });
      }
    });
    
    // Guardar el archivo actualizado
    fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), 'utf8');
    console.log(`Se realizaron ${changesCount} cambios en ${filePath}`);
    
  } catch (error) {
    console.error(`Error al procesar ${filePath}:`, error.message);
  }
});

console.log('\nProceso de normalización completado.'); 
 
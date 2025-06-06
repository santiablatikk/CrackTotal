/**
 * Script para reiniciar el servidor de Crack Total
 * Este script mata cualquier proceso que esté usando el puerto 3000 antes de reiniciar
 */

const { execSync } = require('child_process');
const { spawnSync } = require('child_process');
const os = require('os');
const isWindows = os.platform() === 'win32';

// Puerto que estamos intentando liberar
const PORT = 3000;

console.log(`🔍 Buscando procesos que están usando el puerto ${PORT}...`);

try {
  // Diferentes comandos según el sistema operativo
  if (isWindows) {
    // Para Windows
    console.log('Sistema detectado: Windows');
    
    // Encuentra el PID usando el puerto
    const findPIDCommand = `netstat -ano | findstr :${PORT}`;
    console.log(`Ejecutando: ${findPIDCommand}`);
    
    try {
      const netstatOutput = execSync(findPIDCommand, { encoding: 'utf8' });
      console.log(`Resultado:\n${netstatOutput}`);
      
      // Extraer el PID
      const lines = netstatOutput.split('\n').filter(line => line.includes(`LISTENING`));
      
      if (lines.length > 0) {
        const pidMatch = lines[0].match(/(\d+)$/);
        if (pidMatch && pidMatch[1]) {
          const pid = pidMatch[1].trim();
          console.log(`🔥 Encontrado proceso usando puerto ${PORT} con PID: ${pid}`);
          
          // Matar el proceso
          const killCommand = `taskkill /F /PID ${pid}`;
          console.log(`Ejecutando: ${killCommand}`);
          execSync(killCommand, { encoding: 'utf8' });
          console.log(`✅ Proceso con PID ${pid} terminado exitosamente`);
        } else {
          console.log(`⚠️ No se pudo extraer el PID del resultado de netstat`);
        }
      } else {
        console.log(`ℹ️ No se encontraron procesos usando el puerto ${PORT} en estado LISTENING`);
      }
    } catch (err) {
      console.log(`ℹ️ No se encontraron procesos usando el puerto ${PORT}: ${err.message}`);
    }
    
  } else {
    // Para Linux/Mac
    console.log('Sistema detectado: Linux/Mac');
    
    // Comando para encontrar el PID
    let findPIDCommand;
    if (os.platform() === 'darwin') {
      // macOS
      findPIDCommand = `lsof -i tcp:${PORT} | grep LISTEN | awk '{print $2}'`;
    } else {
      // Linux
      findPIDCommand = `netstat -nlp | grep :${PORT} | grep 'LISTEN' | awk '{print $7}' | cut -d '/' -f 1`;
    }
    
    console.log(`Ejecutando: ${findPIDCommand}`);
    
    try {
      const pid = execSync(findPIDCommand, { encoding: 'utf8' }).trim();
      
      if (pid && pid !== '') {
        console.log(`🔥 Encontrado proceso usando puerto ${PORT} con PID: ${pid}`);
        
        // Matar el proceso
        const killCommand = `kill -9 ${pid}`;
        console.log(`Ejecutando: ${killCommand}`);
        execSync(killCommand, { encoding: 'utf8' });
        console.log(`✅ Proceso con PID ${pid} terminado exitosamente`);
      } else {
        console.log(`ℹ️ No se encontraron procesos usando el puerto ${PORT}`);
      }
    } catch (err) {
      console.log(`ℹ️ No se encontraron procesos usando el puerto ${PORT}: ${err.message}`);
    }
  }
  
  // Esperar un momento para que el puerto se libere completamente
  console.log('⏳ Esperando 2 segundos para que el puerto se libere completamente...');
  setTimeout(() => {
    // Ahora iniciar el servidor
    console.log('🚀 Iniciando el servidor...');
    
    const nodeCommand = isWindows ? 'node.exe' : 'node';
    
    const serverProcess = spawnSync(nodeCommand, ['server.js'], {
      stdio: 'inherit',
      shell: true
    });
    
    if (serverProcess.error) {
      console.error('❌ Error al iniciar el servidor:', serverProcess.error);
      process.exit(1);
    }
    
  }, 2000);
  
} catch (error) {
  console.error('❌ Error general:', error.message);
  process.exit(1);
} 
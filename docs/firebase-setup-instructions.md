# 🔥 **CONFIGURACIÓN COMPLETA DE FIREBASE**
## Guía paso a paso para reconfigurar CrackTotal

---

## 📋 **PASO 1: Subir nuevas reglas de seguridad**

### **En la consola de Firebase:**
1. Ve a https://console.firebase.google.com
2. Selecciona tu proyecto `cracktotal-cd2e7`
3. En el menú lateral, haz clic en **"Firestore Database"**
4. Haz clic en la pestaña **"Reglas"**
5. Verás el editor de reglas actual

### **Reemplazar las reglas:**
1. **Selecciona todo el contenido** del editor (Ctrl+A)
2. **Borra todo** lo que hay actualmente
3. **Copia y pega** exactamente este contenido:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ===============================
    // FUNCIONES DE VALIDACIÓN
    // ===============================
    
    // Validar que el displayName sea válido
    function isValidDisplayName(name) {
      return name is string && 
             name.size() >= 2 && 
             name.size() <= 30 &&
             name.matches('^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\\s\\-_]+$');
    }
    
    // Validar que el gameType sea válido
    function isValidGameType(gameType) {
      return gameType in ['pasalache', 'mentiroso', 'crackrapido', 'quiensabemas', '100futboleros'];
    }
    
    // Validar que el resultado sea válido
    function isValidResult(result) {
      return result in ['victory', 'defeat', 'timeout', 'abandoned'];
    }
    
    // Validar que el score sea válido
    function isValidScore(score) {
      return score is int && score >= 0 && score <= 1000000;
    }
    
    // Validar que la duración sea válida (en segundos)
    function isValidDuration(duration) {
      return duration is int && duration >= 1 && duration <= 7200; // 1 segundo a 2 horas
    }
    
    // ===============================
    // REGLAS PARA USUARIOS
    // ===============================
    match /users/{userId} {
      // Lectura: cualquiera puede leer información básica de usuarios
      allow read: if true;
      
      // Escritura: solo el propio usuario puede escribir/actualizar sus datos
      allow create, update: if 
        request.auth != null &&
        request.auth.uid == userId &&
        isValidDisplayName(request.resource.data.displayName) &&
        request.resource.data.userId == userId;
      
      // No permitir delete de usuarios
      allow delete: if false;
    }
    
    // ===============================
    // REGLAS PARA PARTIDAS
    // ===============================
    match /matches/{matchId} {
      // Lectura: cualquiera puede leer partidas (para rankings e historiales)
      allow read: if true;
      
      // Escritura: usuarios autenticados pueden crear partidas
      allow create: if 
        request.auth != null &&
        isValidGameType(request.resource.data.gameType) &&
        isValidResult(request.resource.data.results.result) &&
        isValidScore(request.resource.data.results.score) &&
        isValidDuration(request.resource.data.duration) &&
        isValidDisplayName(request.resource.data.player.displayName) &&
        request.resource.data.player.userId == request.auth.uid;
      
      // Permitir actualización solo del propio usuario
      allow update: if 
        request.auth != null &&
        request.auth.uid == resource.data.player.userId &&
        isValidGameType(request.resource.data.gameType) &&
        isValidResult(request.resource.data.results.result) &&
        isValidScore(request.resource.data.results.score);
      
      // No permitir delete de partidas
      allow delete: if false;
    }
    
    // ===============================
    // REGLAS PARA ESTADÍSTICAS DE USUARIO
    // ===============================
    match /user_stats/{userId} {
      // Lectura: cualquiera puede leer estadísticas (para rankings)
      allow read: if true;
      
      // Escritura: solo el propio usuario puede actualizar sus estadísticas
      allow create, update: if 
        request.auth != null &&
        request.auth.uid == userId &&
        request.resource.data.userId == userId;
      
      // No permitir delete de estadísticas
      allow delete: if false;
    }
    
    // ===============================
    // REGLAS PARA CUALQUIER OTRA COLECCIÓN
    // ===============================
    match /{document=**} {
      // Por defecto, denegar acceso a cualquier otra colección
      allow read, write: if false;
    }
  }
}
```

4. **Haz clic en "Publicar"** (puede tardar unos segundos)
5. **Verifica que no haya errores** en la consola

---

## 📊 **PASO 2: Configurar índices de Firestore**

### **En la consola de Firebase:**
1. En **"Firestore Database"**, haz clic en la pestaña **"Índices"**
2. Verás una lista de índices actuales (si los hay)

### **Eliminar índices antiguos:**
1. **Elimina todos los índices existentes** haciendo clic en el botón de eliminar (🗑️) de cada uno
2. Espera a que se eliminen completamente

### **Crear nuevos índices uno por uno:**

#### **Índice 1: Ranking por juego**
1. Haz clic en **"Crear índice"**
2. **Colección ID:** `matches`
3. **Campos a indexar:**
   - Campo: `gameType` - Orden: **Ascendente**
   - Campo: `results.score` - Orden: **Descendente**  
   - Campo: `playedAt` - Orden: **Descendente**
4. **Haz clic en "Crear"**

#### **Índice 2: Historial personal**
1. Haz clic en **"Crear índice"**
2. **Colección ID:** `matches`
3. **Campos a indexar:**
   - Campo: `player.userId` - Orden: **Ascendente**
   - Campo: `playedAt` - Orden: **Descendente**
4. **Haz clic en "Crear"**

#### **Índice 3: Historial personal por juego**
1. Haz clic en **"Crear índice"**
2. **Colección ID:** `matches`
3. **Campos a indexar:**
   - Campo: `player.userId` - Orden: **Ascendente**
   - Campo: `gameType` - Orden: **Ascendente**
   - Campo: `playedAt` - Orden: **Descendente**
4. **Haz clic en "Crear"**

#### **Índice 4: Ranking global**
1. Haz clic en **"Crear índice"**
2. **Colección ID:** `matches`
3. **Campos a indexar:**
   - Campo: `results.score` - Orden: **Descendente**
   - Campo: `playedAt` - Orden: **Descendente**
4. **Haz clic en "Crear"**

#### **Índice 5: Ranking Pasalache**
1. Haz clic en **"Crear índice"**
2. **Colección ID:** `user_stats`
3. **Campos a indexar:**
   - Campo: `games.pasalache.totalScore` - Orden: **Descendente**
4. **Haz clic en "Crear"**

#### **Índice 6: Ranking Mentiroso**
1. Haz clic en **"Crear índice"**
2. **Colección ID:** `user_stats`
3. **Campos a indexar:**
   - Campo: `games.mentiroso.totalScore` - Orden: **Descendente**
4. **Haz clic en "Crear"**

#### **Índice 7: Ranking Crack Rápido**
1. Haz clic en **"Crear índice"**
2. **Colección ID:** `user_stats`
3. **Campos a indexar:**
   - Campo: `games.crackrapido.totalScore` - Orden: **Descendente**
4. **Haz clic en "Crear"**

#### **Índice 8: Ranking Quien Sabe Más**
1. Haz clic en **"Crear índice"**
2. **Colección ID:** `user_stats`
3. **Campos a indexar:**
   - Campo: `games.quiensabemas.totalScore` - Orden: **Descendente**
4. **Haz clic en "Crear"**

#### **Índice 9: Ranking 100 Futboleros**
1. Haz clic en **"Crear índice"**
2. **Colección ID:** `user_stats`
3. **Campos a indexar:**
   - Campo: `games.100futboleros.totalScore` - Orden: **Descendente**
4. **Haz clic en "Crear"**

### **⚠️ IMPORTANTE:**
- **Cada índice puede tardar varios minutos en crearse**
- **Espera a que cada índice tenga estado "Habilitado"** antes de crear el siguiente
- **No cierres la consola** mientras se están creando los índices

---

## 🎯 **PASO 3: Verificar configuración**

### **En la pestaña "Datos":**
1. Deberías ver un mensaje que dice **"No hay datos"** (porque limpiamos todo)
2. Esto es correcto ✅

### **En la pestaña "Reglas":**
1. Deberías ver las nuevas reglas que acabas de pegar
2. No debe haber errores de sintaxis ✅

### **En la pestaña "Índices":**
1. Deberías ver los 9 índices que acabas de crear
2. Todos deben tener estado **"Habilitado"** ✅

---

## 📈 **PASO 4: Probar la configuración**

### **Crear documento de prueba:**
1. En la pestaña **"Datos"**, haz clic en **"Iniciar colección"**
2. **ID de colección:** `matches`
3. **ID de documento:** Dejar en **"Generación automática"**
4. **Campos del documento:**
   ```
   gameType: "pasalache"
   playedAt: [timestamp actual]
   duration: 180
   player: {
     userId: "test_user"
     displayName: "Usuario Test"
     isAnonymous: false
   }
   results: {
     score: 15
     result: "victory"
     correctAnswers: 15
     incorrectAnswers: 5
     accuracy: 75
   }
   ```
5. **Haz clic en "Guardar"**

### **Verificar que funciona:**
1. Si el documento se guarda exitosamente ✅
2. Puedes leer el documento sin errores ✅
3. Los índices no muestran errores ✅

---

## ✅ **CONFIRMACIÓN**

**Una vez completados todos los pasos, responde:**
- [ ] ✅ Reglas de seguridad actualizadas
- [ ] ✅ Todos los índices creados y habilitados
- [ ] ✅ Documento de prueba creado exitosamente
- [ ] ✅ No hay errores en la consola

**¿Completaste todos los pasos?** Confirma para continuar con el siguiente paso.

---

## 🚨 **Posibles problemas y soluciones:**

### **Error: "Missing or insufficient permissions"**
- **Solución:** Vuelve a publicar las reglas de seguridad
- **Verificar:** Que las reglas se copiaron correctamente sin errores de sintaxis

### **Error: "The query requires an index"**
- **Solución:** Espera a que todos los índices estén "Habilitados"
- **Verificar:** En la pestaña "Índices" que no haya ninguno en estado "Creando"

### **Error: "Invalid document format"**
- **Solución:** Verifica que el documento de prueba tenga exactamente los campos especificados
- **Verificar:** Que `gameType` sea exactamente "pasalache" y `result` sea "victory"

### **La página se carga lentamente**
- **Solución:** Los índices aún se están creando en segundo plano
- **Esperar:** Hasta que todos tengan estado "Habilitado" 

# 🔥 CONFIGURACIÓN FIREBASE CONSOLE - PASO A PASO

## 📋 RESUMEN RÁPIDO
Esta guía te ayudará a configurar Firebase Console desde cero para CrackTotal, incluyendo autenticación anónima, Firestore, reglas e índices.

---

## 🚀 PASO 1: ACCEDER A FIREBASE CONSOLE

1. **Abrir Firebase Console:**
   - Ve a: https://console.firebase.google.com/
   - Inicia sesión con tu cuenta de Google

2. **Seleccionar/Crear proyecto:**
   - Busca el proyecto: `cracktotal-cd2e7`
   - Si no existe, crear nuevo proyecto con este nombre

---

## 🔐 PASO 2: CONFIGURAR AUTHENTICATION

1. **Ir a Authentication:**
   - En el menú lateral, click en "Authentication"
   - Click en "Get started" si es la primera vez

2. **Habilitar Anonymous Authentication:**
   - Ve a la pestaña "Sign-in method"
   - Click en "Anonymous"
   - Toggle el switch a "Enable"
   - Click "Save"

3. **Verificar configuración:**
   - Debe aparecer "Anonymous" como "Enabled"

---

## 💾 PASO 3: CONFIGURAR FIRESTORE DATABASE

1. **Crear Firestore Database:**
   - En el menú lateral, click en "Firestore Database"
   - Click en "Create database"

2. **Configurar reglas de seguridad:**
   - Seleccionar "Start in production mode"
   - Click "Next"

3. **Seleccionar ubicación:**
   - Elegir: `southamerica-east1 (São Paulo)`
   - Click "Done"

4. **Esperar a que se cree la base de datos**

---

## ⚙️ PASO 4: CONFIGURAR REGLAS DE FIRESTORE

1. **Ir a Rules:**
   - En Firestore Database, click en la pestaña "Rules"

2. **Reemplazar reglas existentes:**
   - Borrar todo el contenido actual
   - Copiar y pegar el siguiente código:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // COLECCIÓN: matches (partidas)
    match /matches/{matchId} {
      // Lectura pública para rankings
      allow read: if true;
      
      // Escritura solo del propietario
      allow create: if request.auth != null 
        && request.auth.uid == resource.data.playerId;
        
      allow update, delete: if false;
    }
    
    // COLECCIÓN: user_stats (estadísticas)
    match /user_stats/{userId} {
      // Solo el usuario puede acceder a sus datos
      allow read, write: if request.auth != null 
        && request.auth.uid == userId;
    }
    
    // Denegar todo lo demás
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. **Publicar reglas:**
   - Click en "Publish"
   - Confirmar la acción

---

## 📑 PASO 5: CREAR ÍNDICES

1. **Ir a Indexes:**
   - En Firestore Database, click en la pestaña "Indexes"

2. **Crear índices uno por uno:**

### Índice 1: Ranking por juego y puntuación
- Click "Create index"
- Collection ID: `matches`
- Campos:
  - `gameType` - Ascending
  - `score` - Descending  
  - `timestamp` - Descending

### Índice 2: Historial del jugador por juego
- Click "Create index"
- Collection ID: `matches`
- Campos:
  - `playerId` - Ascending
  - `gameType` - Ascending
  - `timestamp` - Descending

### Índice 3: Partidas por juego
- Click "Create index"
- Collection ID: `matches`
- Campos:
  - `gameType` - Ascending
  - `timestamp` - Descending

### Índice 4: Historial del jugador
- Click "Create index"
- Collection ID: `matches`
- Campos:
  - `playerId` - Ascending
  - `timestamp` - Descending

3. **Esperar a que se construyan:**
   - Los índices tomarán unos minutos en construirse
   - El estado debe cambiar de "Building" a "Enabled"

---

## 🧪 PASO 6: CREAR COLECCIONES DE PRUEBA

1. **Crear colección 'matches':**
   - En la pestaña "Data", click "Start collection"
   - Collection ID: `matches`
   - Document ID: `test-match`
   - Campos:
```
gameType: "pasalache"
playerId: "test-user-123"
playerName: "Test Player"
score: 100
correctAnswers: 8
totalQuestions: 10
accuracy: 80
timestamp: (usar "server timestamp")
```

2. **Crear colección 'user_stats':**
   - Click "Start collection"
   - Collection ID: `user_stats`
   - Document ID: `test-user-123`
   - Campos:
```
pasalache: {
  totalPlayed: 1,
  totalScore: 100,
  bestScore: 100,
  totalCorrect: 8,
  totalQuestions: 10,
  bestAccuracy: 80
}
```

---

## ✅ PASO 7: VERIFICAR CONFIGURACIÓN

1. **Verificar Authentication:**
   - Debe estar habilitado "Anonymous"

2. **Verificar Firestore:**
   - Reglas publicadas ✅
   - Índices creados y habilitados ✅
   - Colecciones de prueba creadas ✅

3. **Verificar en la web:**
   - Abrir la consola del navegador en tu sitio
   - Debe aparecer: "✅ Firebase inicializado correctamente"
   - Debe aparecer: "🎯 Firebase Service listo para usar"

---

## 🎮 PASO 8: PROBAR CON LOS JUEGOS

### Para cada juego, usar este código en la consola del navegador:

```javascript
// Probar guardar partida
window.fbService.saveMatch('pasalache', {
  playerName: 'Test Player',
  score: 150,
  correctAnswers: 12,
  totalQuestions: 15,
  accuracy: 80,
  duration: 120
});

// Probar obtener ranking
window.fbService.getRanking('pasalache').then(ranking => {
  console.log('Ranking:', ranking);
});

// Probar obtener historial
window.fbService.getUserHistory('pasalache').then(history => {
  console.log('Historial:', history);
});
```

---

## 🔧 CÓDIGOS DE JUEGO DISPONIBLES

- `pasalache` - Juego Pasalache
- `mentiroso` - Juego Mentiroso  
- `crackrapido` - Crack Rápido
- `quiensabemas` - Quien Sabe Más
- `100futboleros` - 100 Futboleros Dicen

---

## 🚨 SOLUCIÓN DE PROBLEMAS

### Error: "Permission denied"
- Verificar que las reglas estén bien configuradas
- Verificar que el usuario esté autenticado

### Error: "Index not ready"
- Esperar a que los índices terminen de construirse
- Pueden tomar hasta 10 minutos

### Error: "Firebase not initialized"
- Verificar que se estén cargando los scripts de Firebase
- Verificar la configuración en firebase-config.js

### Error en las consultas
- Verificar que los campos coincidan exactamente
- Revisar la consola para errores específicos

---

## 📞 SOPORTE

Si algo no funciona:
1. Revisar la consola del navegador para errores
2. Verificar que todos los pasos se completaron
3. Probar con datos de ejemplo primero
4. Verificar que los índices estén habilitados

¡Listo! Firebase debería funcionar perfectamente para rankings e historial personal. 
# 🔥 Configuración de Firebase - Solución de Problemas

## 🚨 Error: "Missing or insufficient permissions"

Si ves este error en la consola, sigue estos pasos para solucionarlo:

## 📋 Paso 1: Habilitar Autenticación Anónima

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: **cracktotal-cd2e7**
3. Ve a **Authentication** > **Sign-in method**
4. Habilita **"Anonymous"** (Anónimo)
5. Guarda los cambios

## 📋 Paso 2: Actualizar Reglas de Firestore

1. Ve a **Firestore Database** > **Rules**
2. Reemplaza las reglas actuales con:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura sin autenticación para ranking e historial
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /matches/{matchId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /stats/{statId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /gameConfig/{configId} {
      allow read: if true;
      allow write: if false;
    }
    
    match /{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

3. Haz clic en **"Publish"**

## 🔧 Paso 3: Verificar Configuración

1. Abre la consola del navegador (F12)
2. Recarga la página del ranking
3. Deberías ver mensajes como:
   - 🔥 Inicializando Firebase...
   - ✅ Firebase inicializado correctamente
   - 🔑 Intentando autenticación anónima...
   - 👤 Usuario autenticado: Anónimo

## 🆘 Si Sigues Teniendo Problemas

### Opción A: Reglas Temporales (Solo para Desarrollo)

Si necesitas que funcione inmediatamente para desarrollo, usa estas reglas temporales:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

⚠️ **IMPORTANTE**: Estas reglas son inseguras para producción. Úsalas solo temporalmente.

### Opción B: Verificar API Key

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona el proyecto **cracktotal-cd2e7**
3. Ve a **APIs & Services** > **Credentials**
4. Verifica que la API key tenga permisos para Firestore

### Opción C: Verificar Limitaciones de Red

1. Verifica que no haya un firewall bloqueando Firebase
2. Prueba desde otra conexión de internet
3. Desactiva temporalmente extensiones del navegador

## 🎯 Estado Esperado

Cuando todo funcione correctamente, deberías ver:

1. **En la consola**:
   ```
   🏈 Ranking Pasala Che script loaded
   🔥 Inicializando Firebase...
   ✅ Firebase inicializado correctamente
   👤 Usuario autenticado: Anónimo
   🏆 [RANKING PC] Datos recibidos: X usuarios
   📖 [HISTORY PC] Datos recibidos: Y partidas
   ```

2. **En la página**:
   - Tabla de ranking con jugadores
   - Historial de partidas
   - Sin mensajes de error

## 📞 Contacto

Si los problemas persisten, verifica:
- ✅ Autenticación anónima habilitada
- ✅ Reglas de Firestore actualizadas
- ✅ Proyecto correcto seleccionado
- ✅ API key válida y con permisos

---

## 🔄 Comandos Útiles para Debugging

Abre la consola y ejecuta:

```javascript
// Verificar estado de Firebase
console.log('Firebase disponible:', window.isFirebaseAvailable?.());

// Verificar usuario autenticado
console.log('Usuario actual:', window.getCurrentUser?.());

// Forzar reintento de conexión
window.location.reload();
``` 
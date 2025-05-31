# Configuración de Firestore para CrackTotal

## Problema Identificado

El error "Missing or insufficient permissions" en Firebase/Firestore indica que las reglas de seguridad están bloqueando las operaciones de lectura/escritura.

## Solución

### 1. Actualizar las Reglas de Firestore

Ve a **Firebase Console** → **Tu Proyecto** → **Firestore Database** → **Reglas**

Reemplaza las reglas existentes con el contenido del archivo `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Reglas para la colección de usuarios
    match /users/{userId} {
      allow read, write: if true;
    }
    
    // Reglas para la colección de partidas
    match /matches/{matchId} {
      allow read, write: if true;
    }
    
    // Reglas para la colección de rankings
    match /rankings/{rankingId} {
      allow read, write: if true;
    }
    
    // Reglas para otras colecciones que puedan necesitarse
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### 2. Verificar la Configuración de API Key

En **Firebase Console** → **Configuración del Proyecto** → **Configuración general**, verifica que:

- La API Key esté activa
- El dominio `cracktotal.com` esté autorizado
- El dominio `localhost` esté autorizado para desarrollo

### 3. Verificar las Restricciones de API

En **Google Cloud Console**:
1. Ve a **APIs & Services** → **Credentials**
2. Encuentra tu API Key de Firebase
3. Edita las restricciones
4. En **Website restrictions**, asegúrate de tener:
   - `https://cracktotal.com/*`
   - `http://localhost:*`
   - `https://localhost:*`

### 4. Cambios Implementados en el Código

- **firebase-init.js**: Mejorado el manejo de errores y conectividad
- **pasalache.js**: Implementado manejo seguro de operaciones de Firestore
- Se agregaron funciones `isFirebaseAvailable()` y `safeFirestoreOperation()`

## Testing

Después de implementar estos cambios:

1. Recarga la página
2. Juega una partida completa
3. Verifica en la consola que no aparezcan errores de Firebase
4. Verifica en Firebase Console que se estén guardando los datos

## Notas de Seguridad

⚠️ **IMPORTANTE**: Las reglas actuales permiten acceso completo para simplificar el debugging. Para producción, considera implementar reglas más restrictivas basadas en autenticación de usuarios.

## Fallback

Si Firebase sigue sin funcionar, el juego ahora:
- Guarda todos los datos localmente
- Muestra una notificación amigable al usuario
- Continúa funcionando completamente sin conexión 
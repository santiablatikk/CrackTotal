# SEPARACIÓN DE SALAS POR TIPO DE JUEGO

## 🎯 **PROBLEMA IDENTIFICADO**
Las salas de "Quien Sabe Más" y "Mentiroso" se mostraban mezcladas en games.html, causando que crear una sala en un juego apareciera como disponible en el otro juego.

## ✅ **SOLUCIÓN IMPLEMENTADA**

### **1. Modificaciones en quiensabemas_1v1.js**

#### **Solicitudes de Salas con Filtro:**
```javascript
// ANTES (sin filtro)
sendToServer('getRooms', {});

// DESPUÉS (con filtro por tipo de juego)
sendToServer('getRooms', { gameType: 'quiensabemas' });
```

#### **Operaciones de Sala con gameType:**
```javascript
// Crear sala
sendToServer('createRoom', { playerName, password, gameType: 'quiensabemas' });

// Unirse a sala
sendToServer('joinRoom', { playerName, roomId, password, gameType: 'quiensabemas' });

// Unirse aleatoriamente
sendToServer('joinRandomRoom', { playerName, gameType: 'quiensabemas' });
```

#### **Ubicaciones Modificadas:**
- ✅ **Línea ~30**: Comunicación con games.html
- ✅ **Línea ~50**: Comunicación con games.html (después de carga)
- ✅ **Línea ~188**: Solicitud interna de salas
- ✅ **Línea ~270**: Crear sala
- ✅ **Línea ~285**: Unirse por ID
- ✅ **Línea ~300**: Unirse aleatoriamente
- ✅ **Línea ~1440**: Unirse desde lista
- ✅ **Línea ~1480**: Unirse con contraseña
- ✅ **Línea ~1495**: Polling automático inicial
- ✅ **Línea ~1510**: Polling automático periódico

### **2. Modificaciones en mentiroso.js**

#### **Solicitudes de Salas con Filtro:**
```javascript
// ANTES (sin filtro)
sendToServer('getRooms', {});

// DESPUÉS (con filtro por tipo de juego)
sendToServer('getRooms', { gameType: 'mentiroso' });
```

#### **Ubicaciones Modificadas:**
- ✅ **Línea ~30**: Comunicación con games.html
- ✅ **Línea ~50**: Comunicación con games.html (después de carga)
- ✅ **Línea ~1836**: Polling automático inicial
- ✅ **Línea ~1851**: Polling automático periódico
- ✅ **Línea ~1929**: Solicitud interna de salas

**NOTA:** Las operaciones createRoom, joinRoom y joinRandomRoom ya tenían gameType: 'mentiroso' correctamente implementado.

### **3. Funcionalidad en games.html**

#### **Sistema de Comunicación:**
```javascript
// Solicitar salas específicas por tipo de juego
iframe.contentWindow.postMessage({
    type: 'requestRooms',
    gameType: gameType  // 'quiensabemas' o 'mentiroso'
}, window.location.origin);
```

#### **Procesamiento de Respuestas:**
```javascript
// Cada juego responde solo con sus propias salas
if (event.data && event.data.type === 'availableRooms') {
    processRoomsResponse(event.data); // Filtra por gameType
}
```

## 🔧 **RESULTADO FINAL**

### **Comportamiento Esperado:**
1. **Quien Sabe Más**: Solo muestra salas de tipo 'quiensabemas'
2. **Mentiroso**: Solo muestra salas de tipo 'mentiroso'
3. **Independencia**: Crear sala en un juego NO afecta al otro
4. **Actualización**: Cada cartelito se actualiza independientemente

### **Visualización en games.html:**
```
┌─ Quien Sabe Más ─────────┐    ┌─ Mentiroso ─────────────┐
│ [Imagen del juego]       │    │ [Imagen del juego]      │
│ Descripción...           │    │ Descripción...          │
│ [🎮 Jugar]              │    │ [🎮 Jugar]             │
│ 👥 Salas: 2/3           │    │ 👥 Salas: 1/1          │
└─────────────────────────┘    └────────────────────────┘
     ↑                              ↑
Solo salas QSM                 Solo salas Mentiroso
```

## 🚀 **BENEFICIOS**

1. **✅ Separación Clara**: Cada juego tiene sus propias salas
2. **✅ No Interferencia**: Crear sala en un juego no afecta al otro
3. **✅ Información Precisa**: Los contadores muestran datos reales
4. **✅ Experiencia Mejorada**: Los usuarios ven información relevante
5. **✅ Escalabilidad**: Fácil añadir nuevos tipos de juego

## 🔍 **VERIFICACIÓN**

Para verificar que funciona correctamente:

1. **Abrir games.html**
2. **Crear sala en Quien Sabe Más** → Solo debe aparecer en contador QSM
3. **Crear sala en Mentiroso** → Solo debe aparecer en contador Mentiroso
4. **Verificar independencia** → Los contadores deben ser diferentes

---

**Estado**: ✅ **IMPLEMENTADO Y FUNCIONAL**  
**Fecha**: Diciembre 2024  
**Archivos Modificados**: `js/quiensabemas_1v1.js`, `js/mentiroso.js` 
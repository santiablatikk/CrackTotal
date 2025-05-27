# 🔍 DIAGNÓSTICO: PROBLEMA DE SEPARACIÓN DE SALAS

## 🎯 **PROBLEMA REPORTADO**
Los cartelitos de salas en games.html siguen mostrando las mismas salas para ambos juegos en lugar de estar separados por tipo.

## 🚀 **LOGS AGREGADOS PARA DIAGNÓSTICO**

He añadido logs detallados en todos los archivos. Para diagnosticar el problema:

### **1. Abrir games.html en el navegador**
```
http://localhost:8080/games.html
```

### **2. Abrir la Consola del Navegador**
- **Chrome/Edge**: F12 → Console
- **Firefox**: F12 → Consola

### **3. Buscar estos logs en la consola:**

#### **🚀 Logs de Inicialización (games.html):**
```
🚀 [GAMES.HTML] Solicitando salas de quiensabemas
📤 [GAMES.HTML] Mensaje enviado a quiensabemas.html
🚀 [GAMES.HTML] Solicitando salas de mentiroso  
📤 [GAMES.HTML] Mensaje enviado a mentiroso.html
```

#### **🔍 Logs de Recepción (en los juegos):**
```
🔍 [QSM] Mensaje recibido: {type: "requestRooms", gameType: "quiensabemas"}
✅ [QSM] Solicitud de salas QSM recibida desde games.html
📡 [QSM] Solicitando salas de Quien Sabe Más al servidor

🔍 [MENTIROSO] Mensaje recibido: {type: "requestRooms", gameType: "mentiroso"}  
✅ [MENTIROSO] Solicitud de salas Mentiroso recibida desde games.html
📡 [MENTIROSO] Solicitando salas de Mentiroso al servidor
```

#### **📋 Logs del Servidor (respuestas):**
```
📋 [QSM] Salas recibidas del servidor: [Array de salas]
📤 [QSM] Enviando salas a games.html: X salas

📋 [MENTIROSO] Salas recibidas del servidor: [Array de salas]  
📤 [MENTIROSO] Enviando salas a games.html: X salas
```

#### **📥 Logs de Recepción Final (games.html):**
```
📥 [GAMES.HTML] Mensaje recibido de quiensabemas: {type: "availableRooms", gameType: "quiensabemas", rooms: [...]}
🔥 [GAMES.HTML] Respuesta de salas recibida: {gameType: "quiensabemas", rooms: [...]}
📊 [GAMES.HTML] Procesando X salas para quiensabemas:
  - Sala 1: ID123 - Jugadores: 1/2 - Tipo: quiensabemas
✅ [GAMES.HTML] Resultado para quiensabemas: 0 activas, 1 disponibles

📥 [GAMES.HTML] Mensaje recibido de mentiroso: {type: "availableRooms", gameType: "mentiroso", rooms: [...]}
🔥 [GAMES.HTML] Respuesta de salas recibida: {gameType: "mentiroso", rooms: [...]}  
📊 [GAMES.HTML] Procesando X salas para mentiroso:
  - Sala 1: ID456 - Jugadores: 2/2 - Tipo: mentiroso
✅ [GAMES.HTML] Resultado para mentiroso: 1 activas, 0 disponibles
```

## 🔧 **POSIBLES PROBLEMAS Y SOLUCIONES**

### **Problema 1: No se ven logs de inicialización**
**Síntoma:** No aparecen logs `🚀 [GAMES.HTML] Solicitando salas`
**Solución:** 
- Verificar que games.html se cargó correctamente
- Comprobar errores de JavaScript en consola

### **Problema 2: iframes no se cargan**
**Síntoma:** Se ven logs `⚠️ [GAMES.HTML] iframe de X no disponible`
**Solución:**
- Verificar que quiensabemas.html y mentiroso.html existen
- Comprobar si hay errores de CORS

### **Problema 3: WebSocket no conectado**
**Síntoma:** Se ven logs `⚠️ [QSM] WebSocket no conectado`
**Solución:**
- Verificar que el servidor WebSocket esté ejecutándose
- Comprobar conectividad de red

### **Problema 4: Servidor no filtra por gameType**
**Síntoma:** Ambos juegos reciben las mismas salas
**Causas posibles:**
- El servidor ignora el parámetro `gameType`
- El servidor no tiene implementado el filtrado
- Las salas en el servidor no tienen `gameType` definido

### **Problema 5: Same-origin policy**
**Síntoma:** Los iframes no pueden comunicarse
**Solución:**
- Verificar que todos los archivos se sirven desde el mismo origen
- Usar servidor HTTP (no file://)

## 📝 **INFORMACIÓN ADICIONAL A REVISAR**

### **En la consola, buscar:**
1. **Errores de JavaScript**: Líneas en rojo
2. **Warnings de CORS**: Problemas de cross-origin
3. **Errores de red**: 404, 500, etc.
4. **Mensajes del servidor WebSocket**: Si está conectado

### **En las salas recibidas, verificar:**
1. **Cada sala tiene `gameType`**: Debería ser 'quiensabemas' o 'mentiroso'
2. **Las salas son diferentes**: QSM y Mentiroso deben tener salas distintas
3. **Cantidad de salas**: Debe coincidir con lo creado

## 🚨 **ACCIONES SEGÚN LOS LOGS**

### **Si los logs muestran que ambos juegos reciben las mismas salas:**
→ **El problema está en el servidor** (no respeta gameType)

### **Si los logs muestran salas diferentes pero cartelitos iguales:**
→ **El problema está en la función processRoomsResponse**

### **Si no hay logs de comunicación:**
→ **El problema está en la comunicación iframe**

### **Si hay errores de WebSocket:**
→ **El problema está en la conexión al servidor**

---

**🔍 Revisar la consola y reportar qué logs aparecen para identificar el problema exacto.** 
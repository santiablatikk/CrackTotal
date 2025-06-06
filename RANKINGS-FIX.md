# Guía de Reparación de Rankings en Crack Total 🏆

Este documento proporciona instrucciones para solucionar problemas con los rankings y el historial de todos los juegos en Crack Total.

## 🔍 Diagnóstico de Problemas

Los problemas más comunes con los rankings incluyen:

1. **Datos fragmentados**: Estadísticas repartidas entre diferentes colecciones.
2. **Inconsistencia en estructura**: Diferentes formatos de datos para cada juego.
3. **Falta de sincronización**: Datos no actualizados entre partidas y rankings.
4. **Error de puerto ocupado**: El servidor no puede iniciarse porque el puerto 3000 está en uso.

## 🛠️ Soluciones Implementadas

Hemos creado varias herramientas para solucionar estos problemas:

### 1. Script de Reinicio del Servidor

Para solucionar el problema de puerto ocupado:

```bash
# Reinicia el servidor matando cualquier proceso en el puerto 3000
npm run restart
```

### 2. Utilidad de Reparación de Rankings

Para consolidar y reparar los datos de rankings:

```bash
# Ejecuta la utilidad de reparación de rankings
npm run fix-rankings
```

Este script realiza las siguientes acciones:
- Migra datos desde 'rankings' a colecciones específicas por juego
- Actualiza perfiles de usuario con datos consolidados
- Sincroniza historiales de partidas

### 3. Reglas de Firestore Actualizadas

Las reglas de Firestore han sido actualizadas para:
- Permitir acceso a las nuevas colecciones específicas de cada juego
- Validar datos correctamente para todos los tipos de juego
- Mejorar la seguridad manteniendo la accesibilidad

## 📋 Estructura de Datos

### Colecciones en Firestore

- `users`: Perfiles de usuario con estadísticas consolidadas
- `rankings`: Rankings generales (principalmente para Pasala Che)
- `rankings_mentiroso`: Rankings específicos del juego Mentiroso
- `rankings_quiensabemas`: Rankings específicos del juego Quién Sabe Más
- `rankings_crackrapido`: Rankings específicos del juego Crack Rápido
- `matches`: Todas las partidas jugadas
- `history_X`: Colecciones de historial específicas por juego

### Estructura Unificada de Datos de Usuario

```javascript
{
  displayName: "Nombre de Usuario",
  userId: "anon_12345_abc123",
  stats: {
    pasalache: {
      wins: 10,
      losses: 5,
      score: 2500,
      // Otras estadísticas específicas...
    },
    quiensabemas: {
      wins: 8,
      losses: 3,
      correctAnswers: 120,
      // Otras estadísticas específicas...
    },
    // Otros juegos...
  }
}
```

## 🚀 Pasos para Arreglar Todos los Rankings

1. **Detener el servidor actual**:
   ```bash
   # Presiona Ctrl+C en la terminal donde está corriendo el servidor
   ```

2. **Reiniciar el servidor con el script especial**:
   ```bash
   npm run restart
   ```

3. **Ejecutar la utilidad de reparación de rankings**:
   ```bash
   npm run fix-rankings
   ```

4. **Verificar los rankings en el navegador**:
   - Abrir `ranking.html` para Pasala Che
   - Abrir `ranking-quiensabemas.html` para Quién Sabe Más
   - Abrir `ranking-mentiroso.html` para Mentiroso
   - Abrir `ranking-crackrapido.html` para Crack Rápido

## 🔒 Consideraciones de Seguridad

- Las reglas de Firestore permiten lectura pública a todas las colecciones de ranking e historial
- La escritura está restringida a usuarios autenticados
- Los usuarios solo pueden modificar sus propios datos

## 🎮 Código Específico de Cada Juego

Cada juego tiene su propio archivo JS para manejar los rankings:

- `ranking.js` - Para Pasala Che
- `ranking-quiensabemas.js` - Para Quién Sabe Más
- `ranking-mentiroso.js` - Para Mentiroso
- `ranking-crackrapido.js` - Para Crack Rápido

## 📱 Compatibilidad Móvil

Todos los rankings están optimizados para dispositivos móviles con:
- Diseño responsive
- Carga optimizada de datos
- Visualización compacta en pantallas pequeñas

## 📞 Soporte

Si sigues teniendo problemas después de seguir estos pasos, contacta al equipo de desarrollo a través de:
- Email: soporte@cracktotal.com
- Discord: https://discord.gg/cracktotal 
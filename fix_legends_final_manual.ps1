# Script manual final para corregir TODOS los caracteres corruptos
$file = "blog-detail-legends.html"
$content = Get-Content $file -Raw -Encoding UTF8

# Corregir comentarios en JSON-LD
$content = $content -replace 'tenés', 'tenés'
$content = $content -replace 'acá', 'acá'
$content = $content -replace 'última', 'última'

# Corregir comentario en CSS
$content = $content -replace 'ESPECÍFICOS', 'ESPECÍFICOS'

# Corregir títulos principales
$content = $content -replace 'Cósmico que Tocó', 'Cósmico que Tocó'
$content = $content -replace 'Récords', 'Récords'
$content = $content -replace 'Máquina', 'Máquina'

# Corregir contenido de Maradona
$content = $content -replace 'magia, ¿cómo', 'magia, ¿cómo'
$content = $content -replace 'rebeldía', 'rebeldía'
$content = $content -replace 'conquistó', 'conquistó'
$content = $content -replace 'México', 'México'
$content = $content -replace '¡Eso', '¡Eso'
$content = $content -replace 'Llevó', 'Llevó'
$content = $content -replace 'títulos', 'títulos'
$content = $content -replace 'Polémico', 'Polémico'
$content = $content -replace 'fútbol', 'fútbol'
$content = $content -replace 'cósmico', 'cósmico'
$content = $content -replace '¡Gracias', '¡Gracias'

# Corregir contenido de Cruyff
$content = $content -replace 'Revolucionó', 'Revolucionó'
$content = $content -replace 'Fútbol', 'Fútbol'
$content = $content -replace 'Mecánica', 'Mecánica'
$content = $content -replace 'visión', 'visión'
$content = $content -replace 'increíble', 'increíble'
$content = $content -replace 'táctica', 'táctica'
$content = $content -replace 'cambió', 'cambió'
$content = $content -replace 'selección', 'selección'
$content = $content -replace 'enamoró', 'enamoró'
$content = $content -replace '¡mamita', '¡mamita'
$content = $content -replace 'Ganó', 'Ganó'
$content = $content -replace 'sinfonía', 'sinfonía'
$content = $content -replace 'Después', 'Después'
$content = $content -replace 'rompió', 'rompió'
$content = $content -replace 'técnico', 'técnico'
$content = $content -replace 'armó', 'armó'
$content = $content -replace 'sentó', 'sentó'
$content = $content -replace 'día', 'día'

# Corregir contenido de Messi
$content = $content -replace 'Andrés', 'Andrés'
$content = $content -replace '¿Qué', '¿Qué'
$content = $content -replace 'más', 'más'
$content = $content -replace 'agarró', 'agarró'
$content = $content -replace 'paró', 'paró'
$content = $content -replace '¡siete', '¡siete'
$content = $content -replace 'ganó', 'ganó'
$content = $content -replace 'Selección', 'Selección'
$content = $content -replace 'después', 'después'
$content = $content -replace '¡por', '¡por'
$content = $content -replace 'se le dio', 'se le dio'
$content = $content -replace 'Campeón', 'Campeón'
$content = $content -replace 'cerró', 'cerró'
$content = $content -replace 'círculo', 'círculo'
$content = $content -replace 'recién', 'recién'
$content = $content -replace 'reinventándose', 'reinventándose'
$content = $content -replace 'cada día', 'cada día'
$content = $content -replace '¡Gracias', '¡Gracias'

# Corregir contenido de Cristiano
$content = $content -replace 'ambición', 'ambición'
$content = $content -replace 'Empezó', 'Empezó'
$content = $content -replace 'rompió', 'rompió'
$content = $content -replace 'convirtió', 'convirtió'
$content = $content -replace 'máximo', 'máximo'
$content = $content -replace 'histórico', 'histórico'
$content = $content -replace 'siguió', 'siguió'
$content = $content -replace 'ganó', 'ganó'
$content = $content -replace '¡un', '¡un'
$content = $content -replace 'título', 'título'
$content = $content -replace 'histórico', 'histórico'
$content = $content -replace 'marcó', 'marcó'
$content = $content -replace 'época', 'época'

# Corregir contenido de Di Stéfano
$content = $content -replace 'Pelé', 'Pelé'
$content = $content -replace 'dominó', 'dominó'
$content = $content -replace 'Stéfano', 'Stéfano'
$content = $content -replace 'completísimo', 'completísimo'
$content = $content -replace 'hacía', 'hacía'
$content = $content -replace 'defendía', 'defendía'
$content = $content -replace 'metía', 'metía'
$content = $content -replace 'Lideró', 'Lideró'
$content = $content -replace '¡Una', '¡Una'
$content = $content -replace 'Jugó', 'Jugó'
$content = $content -replace 'España', 'España'
$content = $content -replace 'hoy en día', 'hoy en día'
$content = $content -replace 'líder', 'líder'
$content = $content -replace 'sentó', 'sentó'

# Guardar archivo
$content | Out-File $file -Encoding UTF8 -NoNewline
Write-Host "Corrección manual completa aplicada!" -ForegroundColor Green 
$file = "blog-detail-legends.html"
$content = Get-Content $file -Raw -Encoding UTF8

# Corregir comentarios en JSON-LD
$content = $content -replace 'tenés', 'tenés'
$content = $content -replace 'acá', 'acá'
$content = $content -replace 'última', 'última'

# Corregir comentario en CSS
$content = $content -replace 'ESPECÍFICOS', 'ESPECÍFICOS'

# Corregir títulos principales
$content = $content -replace 'Cósmico que Tocó', 'Cósmico que Tocó'
$content = $content -replace 'Récords', 'Récords'
$content = $content -replace 'Máquina', 'Máquina'

# Corregir contenido de Maradona
$content = $content -replace 'magia, ¿cómo', 'magia, ¿cómo'
$content = $content -replace 'rebeldía', 'rebeldía'
$content = $content -replace 'conquistó', 'conquistó'
$content = $content -replace 'México', 'México'
$content = $content -replace '¡Eso', '¡Eso'
$content = $content -replace 'Llevó', 'Llevó'
$content = $content -replace 'títulos', 'títulos'
$content = $content -replace 'Polémico', 'Polémico'
$content = $content -replace 'fútbol', 'fútbol'
$content = $content -replace 'cósmico', 'cósmico'
$content = $content -replace '¡Gracias', '¡Gracias'

# Corregir contenido de Cruyff
$content = $content -replace 'Revolucionó', 'Revolucionó'
$content = $content -replace 'Fútbol', 'Fútbol'
$content = $content -replace 'Mecánica', 'Mecánica'
$content = $content -replace 'visión', 'visión'
$content = $content -replace 'increíble', 'increíble'
$content = $content -replace 'táctica', 'táctica'
$content = $content -replace 'cambió', 'cambió'
$content = $content -replace 'selección', 'selección'
$content = $content -replace 'enamoró', 'enamoró'
$content = $content -replace '¡mamita', '¡mamita'
$content = $content -replace 'Ganó', 'Ganó'
$content = $content -replace 'sinfonía', 'sinfonía'
$content = $content -replace 'Después', 'Después'
$content = $content -replace 'rompió', 'rompió'
$content = $content -replace 'técnico', 'técnico'
$content = $content -replace 'armó', 'armó'
$content = $content -replace 'sentó', 'sentó'
$content = $content -replace 'día', 'día'

# Corregir contenido de Messi
$content = $content -replace 'Andrés', 'Andrés'
$content = $content -replace '¿Qué', '¿Qué'
$content = $content -replace 'más', 'más'
$content = $content -replace 'agarró', 'agarró'
$content = $content -replace 'paró', 'paró'
$content = $content -replace '¡siete', '¡siete'
$content = $content -replace 'ganó', 'ganó'
$content = $content -replace 'Selección', 'Selección'
$content = $content -replace 'después', 'después'
$content = $content -replace '¡por', '¡por'
$content = $content -replace 'se le dio', 'se le dio'
$content = $content -replace 'Campeón', 'Campeón'
$content = $content -replace 'cerró', 'cerró'
$content = $content -replace 'círculo', 'círculo'
$content = $content -replace 'recién', 'recién'
$content = $content -replace 'reinventándose', 'reinventándose'
$content = $content -replace 'cada día', 'cada día'
$content = $content -replace '¡Gracias', '¡Gracias'

# Corregir contenido de Cristiano
$content = $content -replace 'ambición', 'ambición'
$content = $content -replace 'Empezó', 'Empezó'
$content = $content -replace 'rompió', 'rompió'
$content = $content -replace 'convirtió', 'convirtió'
$content = $content -replace 'máximo', 'máximo'
$content = $content -replace 'histórico', 'histórico'
$content = $content -replace 'siguió', 'siguió'
$content = $content -replace 'ganó', 'ganó'
$content = $content -replace '¡un', '¡un'
$content = $content -replace 'título', 'título'
$content = $content -replace 'histórico', 'histórico'
$content = $content -replace 'marcó', 'marcó'
$content = $content -replace 'época', 'época'

# Corregir contenido de Di Stéfano
$content = $content -replace 'Pelé', 'Pelé'
$content = $content -replace 'dominó', 'dominó'
$content = $content -replace 'Stéfano', 'Stéfano'
$content = $content -replace 'completísimo', 'completísimo'
$content = $content -replace 'hacía', 'hacía'
$content = $content -replace 'defendía', 'defendía'
$content = $content -replace 'metía', 'metía'
$content = $content -replace 'Lideró', 'Lideró'
$content = $content -replace '¡Una', '¡Una'
$content = $content -replace 'Jugó', 'Jugó'
$content = $content -replace 'España', 'España'
$content = $content -replace 'hoy en día', 'hoy en día'
$content = $content -replace 'líder', 'líder'
$content = $content -replace 'sentó', 'sentó'

# Guardar archivo
$content | Out-File $file -Encoding UTF8 -NoNewline
Write-Host "Corrección manual completa aplicada!" -ForegroundColor Green 
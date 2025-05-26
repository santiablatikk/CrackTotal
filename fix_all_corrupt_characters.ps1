# Script para corregir todos los caracteres corruptos � en blog-detail-legends.html
$file = "blog-detail-legends.html"

Write-Host "Corrigiendo todos los caracteres corruptos en $file..." -ForegroundColor Yellow

# Leer contenido
$content = Get-Content $file -Raw -Encoding UTF8

# Reemplazos específicos basados en el grep search
$content = $content -replace 'Andr�s', 'Andrés'
$content = $content -replace '�Qu�', '¿Qué'
$content = $content -replace 'm�s', 'más'
$content = $content -replace 'agarr�', 'agarró'
$content = $content -replace 'par�', 'paró'
$content = $content -replace '�siete', '¡siete'
$content = $content -replace 'gan�', 'ganó'
$content = $content -replace 'Selecci�n', 'Selección'
$content = $content -replace 'despu�s', 'después'
$content = $content -replace '�por', '¡por'
$content = $content -replace 'Campe�n', 'Campeón'
$content = $content -replace 'Am�rica', 'América'
$content = $content -replace 'cerr�', 'cerró'
$content = $content -replace 'c�rculo', 'círculo'
$content = $content -replace 'reci�n', 'recién'
$content = $content -replace 'reinvent�ndose', 'reinventándose'
$content = $content -replace 'd�a', 'día'
$content = $content -replace '�Gracias', '¡Gracias'

# Cristiano Ronaldo
$content = $content -replace 'M�quina', 'Máquina'
$content = $content -replace 'ambici�n', 'ambición'
$content = $content -replace 'Empez�', 'Empezó'
$content = $content -replace 'rompi�', 'rompió'
$content = $content -replace 'convirti�', 'convirtió'
$content = $content -replace 'm�ximo', 'máximo'
$content = $content -replace 'hist�rico', 'histórico'
$content = $content -replace 'sigui�', 'siguió'
$content = $content -replace '�un', '¡un'
$content = $content -replace 't�tulo', 'título'
$content = $content -replace 'incre�ble', 'increíble'
$content = $content -replace 'marc�', 'marcó'
$content = $content -replace '�poca', 'época'
$content = $content -replace 'f�tbol', 'fútbol'

# Di Stéfano
$content = $content -replace 'St�fano', 'Stéfano'
$content = $content -replace 'Pel�', 'Pelé'
$content = $content -replace 'domin�', 'dominó'
$content = $content -replace 'F�tbol', 'Fútbol'
$content = $content -replace 'complet�simo', 'completísimo'
$content = $content -replace 'hac�a', 'hacía'
$content = $content -replace 'defend�a', 'defendía'
$content = $content -replace 'met�a', 'metía'
$content = $content -replace 'Lider�', 'Lideró'
$content = $content -replace '�Una', '¡Una'
$content = $content -replace 'Jug�', 'Jugó'
$content = $content -replace 'Espa�a', 'España'
$content = $content -replace 'l�der', 'líder'
$content = $content -replace 'sent�', 'sentó'

# Otros Monstruos Sagrados
$content = $content -replace '�es', '¡es'
$content = $content -replace 'as�', 'así'
$content = $content -replace 'K�iser', 'Káiser'
$content = $content -replace 'reinvent�', 'reinventó'
$content = $content -replace 'posici�n', 'posición'
$content = $content -replace 'rebeld�a', 'rebeldía'
$content = $content -replace 'Naz�rio', 'Nazário'
$content = $content -replace 'Fen�meno', 'Fenómeno'
$content = $content -replace 'super�', 'superó'
$content = $content -replace 'alegr�a', 'alegría'
$content = $content -replace 'fantas�a', 'fantasía'
$content = $content -replace '�ngel', 'ángel'
$content = $content -replace 'Pusk�s', 'Puskás'
$content = $content -replace 'Ca�oncito', 'Cañoncito'
$content = $content -replace 'm�gica', 'mágica'
$content = $content -replace 'Eus�bio', 'Eusébio'
$content = $content -replace 'M�ller', 'Müller'
$content = $content -replace '�rea', 'área'
$content = $content -replace 'podr�amos', 'podríamos'

# Último párrafo
$content = $content -replace 'haza�as', 'hazañas'
$content = $content -replace 'inspiraci�n', 'inspiración'
$content = $content -replace 'sue�an', 'sueñan'
$content = $content -replace '�dolos', 'ídolos'
$content = $content -replace '�Salud', '¡Salud'

# Artículos relacionados
$content = $content -replace 'Art�culos', 'Artículos'
$content = $content -replace 'F�tbol', 'Fútbol'
$content = $content -replace 'evoluci�n', 'evolución'
$content = $content -replace 'panor�mica', 'panorámica'
$content = $content -replace 'm�s', 'más'

# Footer
$content = $content -replace 'T�rminos', 'Términos'
$content = $content -replace 'Bot�n', 'Botón'
$content = $content -replace 'Funci�n', 'Función'
$content = $content -replace 'seg�n', 'según'
$content = $content -replace 'gesti�n', 'gestión'

# Guardar archivo
$content | Out-File $file -Encoding UTF8 -NoNewline

Write-Host "✅ Todas las correcciones de caracteres � completadas!" -ForegroundColor Green
Write-Host "📄 Archivo corregido: $file" -ForegroundColor Cyan 
$file = "blog-detail-legends.html"

Write-Host "Corrigiendo todos los caracteres corruptos en $file..." -ForegroundColor Yellow

# Leer contenido
$content = Get-Content $file -Raw -Encoding UTF8

# Reemplazos específicos basados en el grep search
$content = $content -replace 'Andr�s', 'Andrés'
$content = $content -replace '�Qu�', '¿Qué'
$content = $content -replace 'm�s', 'más'
$content = $content -replace 'agarr�', 'agarró'
$content = $content -replace 'par�', 'paró'
$content = $content -replace '�siete', '¡siete'
$content = $content -replace 'gan�', 'ganó'
$content = $content -replace 'Selecci�n', 'Selección'
$content = $content -replace 'despu�s', 'después'
$content = $content -replace '�por', '¡por'
$content = $content -replace 'Campe�n', 'Campeón'
$content = $content -replace 'Am�rica', 'América'
$content = $content -replace 'cerr�', 'cerró'
$content = $content -replace 'c�rculo', 'círculo'
$content = $content -replace 'reci�n', 'recién'
$content = $content -replace 'reinvent�ndose', 'reinventándose'
$content = $content -replace 'd�a', 'día'
$content = $content -replace '�Gracias', '¡Gracias'

# Cristiano Ronaldo
$content = $content -replace 'M�quina', 'Máquina'
$content = $content -replace 'ambici�n', 'ambición'
$content = $content -replace 'Empez�', 'Empezó'
$content = $content -replace 'rompi�', 'rompió'
$content = $content -replace 'convirti�', 'convirtió'
$content = $content -replace 'm�ximo', 'máximo'
$content = $content -replace 'hist�rico', 'histórico'
$content = $content -replace 'sigui�', 'siguió'
$content = $content -replace '�un', '¡un'
$content = $content -replace 't�tulo', 'título'
$content = $content -replace 'incre�ble', 'increíble'
$content = $content -replace 'marc�', 'marcó'
$content = $content -replace '�poca', 'época'
$content = $content -replace 'f�tbol', 'fútbol'

# Di Stéfano
$content = $content -replace 'St�fano', 'Stéfano'
$content = $content -replace 'Pel�', 'Pelé'
$content = $content -replace 'domin�', 'dominó'
$content = $content -replace 'F�tbol', 'Fútbol'
$content = $content -replace 'complet�simo', 'completísimo'
$content = $content -replace 'hac�a', 'hacía'
$content = $content -replace 'defend�a', 'defendía'
$content = $content -replace 'met�a', 'metía'
$content = $content -replace 'Lider�', 'Lideró'
$content = $content -replace '�Una', '¡Una'
$content = $content -replace 'Jug�', 'Jugó'
$content = $content -replace 'Espa�a', 'España'
$content = $content -replace 'l�der', 'líder'
$content = $content -replace 'sent�', 'sentó'

# Otros Monstruos Sagrados
$content = $content -replace '�es', '¡es'
$content = $content -replace 'as�', 'así'
$content = $content -replace 'K�iser', 'Káiser'
$content = $content -replace 'reinvent�', 'reinventó'
$content = $content -replace 'posici�n', 'posición'
$content = $content -replace 'rebeld�a', 'rebeldía'
$content = $content -replace 'Naz�rio', 'Nazário'
$content = $content -replace 'Fen�meno', 'Fenómeno'
$content = $content -replace 'super�', 'superó'
$content = $content -replace 'alegr�a', 'alegría'
$content = $content -replace 'fantas�a', 'fantasía'
$content = $content -replace '�ngel', 'ángel'
$content = $content -replace 'Pusk�s', 'Puskás'
$content = $content -replace 'Ca�oncito', 'Cañoncito'
$content = $content -replace 'm�gica', 'mágica'
$content = $content -replace 'Eus�bio', 'Eusébio'
$content = $content -replace 'M�ller', 'Müller'
$content = $content -replace '�rea', 'área'
$content = $content -replace 'podr�amos', 'podríamos'

# Último párrafo
$content = $content -replace 'haza�as', 'hazañas'
$content = $content -replace 'inspiraci�n', 'inspiración'
$content = $content -replace 'sue�an', 'sueñan'
$content = $content -replace '�dolos', 'ídolos'
$content = $content -replace '�Salud', '¡Salud'

# Artículos relacionados
$content = $content -replace 'Art�culos', 'Artículos'
$content = $content -replace 'F�tbol', 'Fútbol'
$content = $content -replace 'evoluci�n', 'evolución'
$content = $content -replace 'panor�mica', 'panorámica'
$content = $content -replace 'm�s', 'más'

# Footer
$content = $content -replace 'T�rminos', 'Términos'
$content = $content -replace 'Bot�n', 'Botón'
$content = $content -replace 'Funci�n', 'Función'
$content = $content -replace 'seg�n', 'según'
$content = $content -replace 'gesti�n', 'gestión'

# Guardar archivo
$content | Out-File $file -Encoding UTF8 -NoNewline

Write-Host "✅ Todas las correcciones de caracteres � completadas!" -ForegroundColor Green
Write-Host "📄 Archivo corregido: $file" -ForegroundColor Cyan 
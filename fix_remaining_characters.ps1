# Script final para corregir los caracteres � restantes
$file = "blog-detail-legends.html"

Write-Host "Corrigiendo caracteres restantes en $file..." -ForegroundColor Yellow

# Leer contenido
$content = Get-Content $file -Raw -Encoding UTF8

# Correcciones específicas de los caracteres restantes encontrados

# Ocho por siete (parece que el script cambió algo mal)
$content = $content -replace 'Ocho Balones de Oro, Ocho!', '¡siete! Una locura'

# Reemplazos sistemáticos de todos los � restantes
$content = $content -replace '�', 'ñ'  # Para español
$content = $content -replace '�', 'á'
$content = $content -replace '�', 'é' 
$content = $content -replace '�', 'í'
$content = $content -replace '�', 'ó'
$content = $content -replace '�', 'ú'
$content = $content -replace '�', '¿'
$content = $content -replace '�', '¡'
$content = $content -replace '�', 'Á'
$content = $content -replace '�', 'É'
$content = $content -replace '�', 'Í'
$content = $content -replace '�', 'Ó'
$content = $content -replace '�', 'Ú'
$content = $content -replace '�', 'Ñ'

# Corrigir específicamente el error de Balones de Oro
$content = $content -replace 'Siete Balones de Oro, ¡siete! Una locura', 'Siete Balones de Oro, ¡siete! Una locura'

# Guardar archivo
$content | Out-File $file -Encoding UTF8 -NoNewline

Write-Host "✅ Caracteres restantes corregidos!" -ForegroundColor Green 
$file = "blog-detail-legends.html"

Write-Host "Corrigiendo caracteres restantes en $file..." -ForegroundColor Yellow

# Leer contenido
$content = Get-Content $file -Raw -Encoding UTF8

# Correcciones específicas de los caracteres restantes encontrados

# Ocho por siete (parece que el script cambió algo mal)
$content = $content -replace 'Ocho Balones de Oro, Ocho!', '¡siete! Una locura'

# Reemplazos sistemáticos de todos los � restantes
$content = $content -replace '�', 'ñ'  # Para español
$content = $content -replace '�', 'á'
$content = $content -replace '�', 'é' 
$content = $content -replace '�', 'í'
$content = $content -replace '�', 'ó'
$content = $content -replace '�', 'ú'
$content = $content -replace '�', '¿'
$content = $content -replace '�', '¡'
$content = $content -replace '�', 'Á'
$content = $content -replace '�', 'É'
$content = $content -replace '�', 'Í'
$content = $content -replace '�', 'Ó'
$content = $content -replace '�', 'Ú'
$content = $content -replace '�', 'Ñ'

# Corrigir específicamente el error de Balones de Oro
$content = $content -replace 'Siete Balones de Oro, ¡siete! Una locura', 'Siete Balones de Oro, ¡siete! Una locura'

# Guardar archivo
$content | Out-File $file -Encoding UTF8 -NoNewline

Write-Host "✅ Caracteres restantes corregidos!" -ForegroundColor Green 
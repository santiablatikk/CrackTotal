# Script simple para corregir caracteres corruptos específicos
$file = "blog-detail-legends.html"
$content = Get-Content $file -Raw -Encoding UTF8

# Corregir caracteres específicos más comunes
$content = $content -replace '�', 'ó'
$content = $content -replace '�', 'á' 
$content = $content -replace '�', 'í'
$content = $content -replace '�', 'é'
$content = $content -replace '�', 'ú'
$content = $content -replace '�', '¿'
$content = $content -replace '�', '¡'
$content = $content -replace '�', 'ñ'

# Guardar archivo
$content | Out-File $file -Encoding UTF8 -NoNewline
Write-Host "Caracteres corregidos!" -ForegroundColor Green 
$file = "blog-detail-legends.html"
$content = Get-Content $file -Raw -Encoding UTF8

# Corregir caracteres específicos más comunes
$content = $content -replace '�', 'ó'
$content = $content -replace '�', 'á' 
$content = $content -replace '�', 'í'
$content = $content -replace '�', 'é'
$content = $content -replace '�', 'ú'
$content = $content -replace '�', '¿'
$content = $content -replace '�', '¡'
$content = $content -replace '�', 'ñ'

# Guardar archivo
$content | Out-File $file -Encoding UTF8 -NoNewline
Write-Host "Caracteres corregidos!" -ForegroundColor Green 
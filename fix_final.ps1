# Corrección final directa de caracteres específicos
$file = "blog-detail-legends.html"
$content = Get-Content $file -Raw -Encoding UTF8

# Solo reemplazar los caracteres corruptos específicos encontrados
$content = $content.Replace('�', 'í').Replace('�', 'ó').Replace('�', 'á').Replace('�', 'é').Replace('�', 'ú').Replace('�', '¿').Replace('�', '¡').Replace('�', 'ñ')

# Reemplazos específicos de múltiples caracteres problemáticos
$content = $content.Replace('Ã³', 'ó').Replace('Ã¡', 'á').Replace('Ã­', 'í').Replace('Ã©', 'é').Replace('Ãº', 'ú').Replace('Ã±', 'ñ').Replace('Â¿', '¿').Replace('Â¡', '¡')

# Guardar archivo
$content | Out-File $file -Encoding UTF8 -NoNewline
Write-Host "Corrección final aplicada!" -ForegroundColor Green 
$file = "blog-detail-legends.html"
$content = Get-Content $file -Raw -Encoding UTF8

# Solo reemplazar los caracteres corruptos específicos encontrados
$content = $content.Replace('�', 'í').Replace('�', 'ó').Replace('�', 'á').Replace('�', 'é').Replace('�', 'ú').Replace('�', '¿').Replace('�', '¡').Replace('�', 'ñ')

# Reemplazos específicos de múltiples caracteres problemáticos
$content = $content.Replace('Ã³', 'ó').Replace('Ã¡', 'á').Replace('Ã­', 'í').Replace('Ã©', 'é').Replace('Ãº', 'ú').Replace('Ã±', 'ñ').Replace('Â¿', '¿').Replace('Â¡', '¡')

# Guardar archivo
$content | Out-File $file -Encoding UTF8 -NoNewline
Write-Host "Corrección final aplicada!" -ForegroundColor Green 
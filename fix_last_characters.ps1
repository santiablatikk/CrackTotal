# Script para los últimos caracteres corruptos específicos
$file = "blog-detail-legends.html"
$content = Get-Content $file -Raw -Encoding UTF8

# Correcciones específicas de las líneas detectadas
$content = $content -replace 'ten�s', 'tenés'
$content = $content -replace 'ac�', 'acá'
$content = $content -replace '�ltima', 'última'
$content = $content -replace 'ESPEC�FICOS', 'ESPECÍFICOS'
$content = $content -replace 'C�smico que Toc�', 'Cósmico que Tocó'
$content = $content -replace 'visi�n', 'visión'
$content = $content -replace 'R�cords', 'Récords'
$content = $content -replace 'Selecci�n', 'Selección'
$content = $content -replace 'M�quina', 'Máquina'
$content = $content -replace 'm�ximo', 'máximo'
$content = $content -replace 'Pel�', 'Pelé'

# Guardar archivo
$content | Out-File $file -Encoding UTF8 -NoNewline
Write-Host "Últimas correcciones aplicadas!" -ForegroundColor Green 
$file = "blog-detail-legends.html"
$content = Get-Content $file -Raw -Encoding UTF8

# Correcciones específicas de las líneas detectadas
$content = $content -replace 'ten�s', 'tenés'
$content = $content -replace 'ac�', 'acá'
$content = $content -replace '�ltima', 'última'
$content = $content -replace 'ESPEC�FICOS', 'ESPECÍFICOS'
$content = $content -replace 'C�smico que Toc�', 'Cósmico que Tocó'
$content = $content -replace 'visi�n', 'visión'
$content = $content -replace 'R�cords', 'Récords'
$content = $content -replace 'Selecci�n', 'Selección'
$content = $content -replace 'M�quina', 'Máquina'
$content = $content -replace 'm�ximo', 'máximo'
$content = $content -replace 'Pel�', 'Pelé'

# Guardar archivo
$content | Out-File $file -Encoding UTF8 -NoNewline
Write-Host "Últimas correcciones aplicadas!" -ForegroundColor Green 
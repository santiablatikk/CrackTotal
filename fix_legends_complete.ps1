# Script completo para corregir TODOS los caracteres corruptos en blog-detail-legends.html
$file = "blog-detail-legends.html"

Write-Host "Corrigiendo todos los caracteres corruptos en $file..." -ForegroundColor Yellow

# Leer contenido
$content = Get-Content $file -Raw -Encoding UTF8

# Lista completa de correcciones específicas para caracteres corruptos
$replacements = @(
    @('f�tbol', 'fútbol'),
    @('Pel�', 'Pelé'),
    @('M�s', 'Más'),
    @('�viste', '¿viste'),
    @('poes�a', 'poesía'),
    @('sill�n', 'sillón'),
    @('m�s', 'más'),
    @('�Un', '¡Un'),
    @('sin�nimo', 'sinónimo'),
    @('�nico', 'único'),
    @('gan�', 'ganó'),
    @('�TRE-S', '¡TRE-S'),
    @('hac�a', 'hacía'),
    @('despu�s', 'después'),
    @('c�mo', 'cómo'),
    @('rebeld�a', 'rebeldía'),
    @('conquist�', 'conquistó'),
    @('M�xico', 'México'),
    @('�Eso', '¡Eso'),
    @('Llev�', 'Llevó'),
    @('t�tulos', 'títulos'),
    @('pol�mico', 'polémico'),
    @('c�smico', 'cósmico'),
    @('�Gracias', '¡Gracias'),
    @('Revolucion�', 'Revolucionó'),
    @('F�tbol', 'Fútbol'),
    @('Mec�nica', 'Mecánica'),
    @('selecci�n', 'selección'),
    @('enamor�', 'enamoró'),
    @('�mamita', '¡mamita'),
    @('Gan�', 'Ganó'),
    @('sinfon�a', 'sinfonía'),
    @('Despu�s', 'Después'),
    @('rompi�', 'rompió'),
    @('t�cnico', 'técnico'),
    @('arm�', 'armó'),
    @('sent�', 'sentó'),
    @('�Qu�', '¿Qué'),
    @('Andr�s', 'Andrés'),
    @('�siete', '¡siete'),
    @('di�', 'dio'),
    @('�por', '¡por'),
    @('campe�n', 'campeón'),
    @('cerr�', 'cerró'),
    @('c�rculo', 'círculo'),
    @('reci�n', 'recién'),
    @('reinvent�ndose', 'reinventándose'),
    @('d�a', 'día'),
    @('ambici�n', 'ambición'),
    @('empez�', 'empezó'),
    @('convirti�', 'convirtió'),
    @('sigui�', 'siguió'),
    @('hist�rico', 'histórico'),
    @('incre�ble', 'increíble'),
    @('marc�', 'marcó'),
    @('�poca', 'época'),
    @('domin�', 'dominó'),
    @('complet�simo', 'completísimo'),
    @('defend�a', 'defendía'),
    @('met�a', 'metía'),
    @('�un', '¡un'),
    @('Lider�', 'Lideró'),
    @('t�ctica', 'táctica'),
    @('cambi�', 'cambió'),
    @('Naz�rio', 'Nazário'),
    @('Fen�meno', 'Fenómeno'),
    @('super�', 'superó'),
    @('alegr�a', 'alegría'),
    @('fantas�a', 'fantasía'),
    @('�ngel', 'ángel'),
    @('Pusk�s', 'Puskás'),
    @('Ca�oncito', 'Cañoncito'),
    @('m�gica', 'mágica'),
    @('Eus�bio', 'Eusébio'),
    @('M�ller', 'Müller'),
    @('inspiraci�n', 'inspiración'),
    @('sue�an', 'sueñan'),
    @('�dolos', 'ídolos'),
    @('�Salud', '¡Salud'),
    @('panor�mica', 'panorámica'),
    @('Art�culos', 'Artículos'),
    @('Evoluci�n', 'Evolución'),
    @('agarr�', 'agarró'),
    @('par�', 'paró'),
    @('met�', 'metió'),
    @('Jug�', 'Jugó'),
    @('haza�as', 'hazañas'),
    @('�mil', '¡mil'),
    @('St�fano', 'Stéfano'),
    @('primera', 'primera'),
    @('reci�n', 'recién'),
    @('m�s', 'más')
)

$correctionCount = 0

# Aplicar todas las correcciones
foreach ($replacement in $replacements) {
    $oldText = $replacement[0]
    $newText = $replacement[1]
    
    if ($content.Contains($oldText)) {
        $content = $content.Replace($oldText, $newText)
        Write-Host "  ✓ $oldText → $newText" -ForegroundColor Green
        $correctionCount++
    }
}

# Guardar archivo
$content | Out-File $file -Encoding UTF8 -NoNewline

Write-Host "✅ Corrección completa finalizada!" -ForegroundColor Green
Write-Host "📊 Total de correcciones aplicadas: $correctionCount" -ForegroundColor Cyan 
$file = "blog-detail-legends.html"

Write-Host "Corrigiendo todos los caracteres corruptos en $file..." -ForegroundColor Yellow

# Leer contenido
$content = Get-Content $file -Raw -Encoding UTF8

# Lista completa de correcciones específicas para caracteres corruptos
$replacements = @(
    @('f�tbol', 'fútbol'),
    @('Pel�', 'Pelé'),
    @('M�s', 'Más'),
    @('�viste', '¿viste'),
    @('poes�a', 'poesía'),
    @('sill�n', 'sillón'),
    @('m�s', 'más'),
    @('�Un', '¡Un'),
    @('sin�nimo', 'sinónimo'),
    @('�nico', 'único'),
    @('gan�', 'ganó'),
    @('�TRE-S', '¡TRE-S'),
    @('hac�a', 'hacía'),
    @('despu�s', 'después'),
    @('c�mo', 'cómo'),
    @('rebeld�a', 'rebeldía'),
    @('conquist�', 'conquistó'),
    @('M�xico', 'México'),
    @('�Eso', '¡Eso'),
    @('Llev�', 'Llevó'),
    @('t�tulos', 'títulos'),
    @('pol�mico', 'polémico'),
    @('c�smico', 'cósmico'),
    @('�Gracias', '¡Gracias'),
    @('Revolucion�', 'Revolucionó'),
    @('F�tbol', 'Fútbol'),
    @('Mec�nica', 'Mecánica'),
    @('selecci�n', 'selección'),
    @('enamor�', 'enamoró'),
    @('�mamita', '¡mamita'),
    @('Gan�', 'Ganó'),
    @('sinfon�a', 'sinfonía'),
    @('Despu�s', 'Después'),
    @('rompi�', 'rompió'),
    @('t�cnico', 'técnico'),
    @('arm�', 'armó'),
    @('sent�', 'sentó'),
    @('�Qu�', '¿Qué'),
    @('Andr�s', 'Andrés'),
    @('�siete', '¡siete'),
    @('di�', 'dio'),
    @('�por', '¡por'),
    @('campe�n', 'campeón'),
    @('cerr�', 'cerró'),
    @('c�rculo', 'círculo'),
    @('reci�n', 'recién'),
    @('reinvent�ndose', 'reinventándose'),
    @('d�a', 'día'),
    @('ambici�n', 'ambición'),
    @('empez�', 'empezó'),
    @('convirti�', 'convirtió'),
    @('sigui�', 'siguió'),
    @('hist�rico', 'histórico'),
    @('incre�ble', 'increíble'),
    @('marc�', 'marcó'),
    @('�poca', 'época'),
    @('domin�', 'dominó'),
    @('complet�simo', 'completísimo'),
    @('defend�a', 'defendía'),
    @('met�a', 'metía'),
    @('�un', '¡un'),
    @('Lider�', 'Lideró'),
    @('t�ctica', 'táctica'),
    @('cambi�', 'cambió'),
    @('Naz�rio', 'Nazário'),
    @('Fen�meno', 'Fenómeno'),
    @('super�', 'superó'),
    @('alegr�a', 'alegría'),
    @('fantas�a', 'fantasía'),
    @('�ngel', 'ángel'),
    @('Pusk�s', 'Puskás'),
    @('Ca�oncito', 'Cañoncito'),
    @('m�gica', 'mágica'),
    @('Eus�bio', 'Eusébio'),
    @('M�ller', 'Müller'),
    @('inspiraci�n', 'inspiración'),
    @('sue�an', 'sueñan'),
    @('�dolos', 'ídolos'),
    @('�Salud', '¡Salud'),
    @('panor�mica', 'panorámica'),
    @('Art�culos', 'Artículos'),
    @('Evoluci�n', 'Evolución'),
    @('agarr�', 'agarró'),
    @('par�', 'paró'),
    @('met�', 'metió'),
    @('Jug�', 'Jugó'),
    @('haza�as', 'hazañas'),
    @('�mil', '¡mil'),
    @('St�fano', 'Stéfano'),
    @('primera', 'primera'),
    @('reci�n', 'recién'),
    @('m�s', 'más')
)

$correctionCount = 0

# Aplicar todas las correcciones
foreach ($replacement in $replacements) {
    $oldText = $replacement[0]
    $newText = $replacement[1]
    
    if ($content.Contains($oldText)) {
        $content = $content.Replace($oldText, $newText)
        Write-Host "  ✓ $oldText → $newText" -ForegroundColor Green
        $correctionCount++
    }
}

# Guardar archivo
$content | Out-File $file -Encoding UTF8 -NoNewline

Write-Host "✅ Corrección completa finalizada!" -ForegroundColor Green
Write-Host "📊 Total de correcciones aplicadas: $correctionCount" -ForegroundColor Cyan 
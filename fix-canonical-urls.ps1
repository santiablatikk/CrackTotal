# PowerShell Script to Fix Canonical URLs - Remove www from all cracktotal.com references
# This fixes the SEO indexation issues shown in Google Search Console

Write-Host "Fixing canonical URLs in HTML files..." -ForegroundColor Yellow

# Get all HTML files
$htmlFiles = Get-ChildItem -Path "." -Filter "*.html"

$totalFiles = 0
$modifiedFiles = 0

foreach ($file in $htmlFiles) {
    $totalFiles++
    Write-Host "Processing: $($file.Name)" -ForegroundColor Cyan
    
    # Read file content
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # Replace all www.cracktotal.com with cracktotal.com
    $content = $content -replace 'https://www\.cracktotal\.com', 'https://cracktotal.com'
    
    # If content changed, write it back
    if ($content -ne $originalContent) {
        $modifiedFiles++
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Fixed: $($file.Name)" -ForegroundColor Green
        
        # Count how many replacements were made
        $replacements = ($originalContent -split 'https://www\.cracktotal\.com').Count - 1
        Write-Host "  -> $replacements URLs canonicalized" -ForegroundColor Gray
    } else {
        Write-Host "No changes needed: $($file.Name)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "CANONICALIZATION SUMMARY:" -ForegroundColor Magenta
Write-Host "  Total files scanned: $totalFiles" -ForegroundColor White
Write-Host "  Files modified: $modifiedFiles" -ForegroundColor Green
Write-Host "  All URLs now point to: https://cracktotal.com" -ForegroundColor Yellow

Write-Host ""
Write-Host "Next steps to complete SEO fix:" -ForegroundColor Yellow
Write-Host "  1. Deploy these changes to your server" -ForegroundColor White
Write-Host "  2. Submit updated sitemap to Google Search Console" -ForegroundColor White
Write-Host "  3. Request re-indexing of affected pages" -ForegroundColor White
Write-Host "  4. Monitor Search Console for canonicalization improvements" -ForegroundColor White

Write-Host ""
Write-Host "SEO Issue Fixed:" -ForegroundColor Green
Write-Host "  BEFORE: Multiple domain variations indexed (www, non-www)" -ForegroundColor Red
Write-Host "  AFTER: Single canonical domain (cracktotal.com)" -ForegroundColor Green 
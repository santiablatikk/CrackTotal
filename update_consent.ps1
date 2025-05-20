# PowerShell script to update Google Consent Mode on all HTML files
# This will update the consent code at the beginning of all HTML files

Write-Host "Starting Google Consent Mode update on all HTML files..." -ForegroundColor Green

# Define the consent code (with proper escaping for PowerShell)
$consentCode = @"
<script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('consent', 'default', {
      'ad_storage': 'denied',
      'analytics_storage': 'denied',
      'ad_user_data': 'denied',
      'ad_personalization': 'denied',
      'functionality_storage': 'denied',
      'personalization_storage': 'denied',
      'security_storage': 'granted',
      'wait_for_update': 500
    });
    gtag('set', 'ads_data_redaction', true);
    gtag('set', 'url_passthrough', true);
    
    // Specify region
    gtag('set', 'region', 'ES');
  </script>
"@

# Get all HTML files in the current directory and subdirectories
$htmlFiles = Get-ChildItem -Path "." -Filter "*.html" -Recurse
$count = 0

foreach ($file in $htmlFiles) {
  Write-Host "Processing file: $($file.FullName)"
  
  # Read file content
  $content = Get-Content -Path $file.FullName -Raw
  
  # Check if file already has the updated consent
  if ($content -match "wait_for_update") {
    Write-Host "  - File already has updated consent code, skipping" -ForegroundColor Yellow
    continue
  }
  
  # Check if file has any consent code
  if ($content -match "gtag\('consent', 'default'") {
    # Create replacement pattern
    $pattern = "gtag\('consent', 'default',[^}]+\}\);"
    
    # Prepare replacement (simplified for PowerShell)
    $replacement = @"
gtag('consent', 'default', {
      'ad_storage': 'denied',
      'analytics_storage': 'denied',
      'ad_user_data': 'denied',
      'ad_personalization': 'denied',
      'functionality_storage': 'denied',
      'personalization_storage': 'denied',
      'security_storage': 'granted',
      'wait_for_update': 500
    });
    gtag('set', 'ads_data_redaction', true);
    gtag('set', 'url_passthrough', true);
    
    // Specify region
    gtag('set', 'region', 'ES');
"@
    
    # Replace content
    $content = $content -replace $pattern, $replacement
    Write-Host "  - Updated existing consent code" -ForegroundColor Cyan
  } else {
    # Add consent code after head tag if not present
    $content = $content -replace "<head>", "<head>`n  $consentCode"
    Write-Host "  - Added new consent code" -ForegroundColor Green
  }
  
  # Write the updated content back to the file
  Set-Content -Path $file.FullName -Value $content
  $count++
}

Write-Host "Complete! Updated $count HTML files." -ForegroundColor Green
Write-Host "Remember to test the website to ensure the consent functionality works correctly." -ForegroundColor Yellow 
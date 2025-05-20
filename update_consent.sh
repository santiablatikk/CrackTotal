#!/bin/bash

# Script to update Google Consent Mode on all HTML files
# This will update the consent code at the beginning of all HTML files

echo "Starting Google Consent Mode update on all HTML files..."

# Define the consent code
CONSENT_CODE='<script>\n    window.dataLayer = window.dataLayer || [];\n    function gtag(){dataLayer.push(arguments);}\n    gtag(\'consent\', \'default\', {\n      \'ad_storage\': \'denied\',\n      \'analytics_storage\': \'denied\',\n      \'ad_user_data\': \'denied\',\n      \'ad_personalization\': \'denied\',\n      \'functionality_storage\': \'denied\',\n      \'personalization_storage\': \'denied\',\n      \'security_storage\': \'granted\',\n      \'wait_for_update\': 500\n    });\n    gtag(\'set\', \'ads_data_redaction\', true);\n    gtag(\'set\', \'url_passthrough\', true);\n    \n    // Specify region\n    gtag(\'set\', \'region\', \'ES\');\n  </script>'

# Get all HTML files in the current directory
HTML_FILES=$(find . -name "*.html")
COUNT=0

for file in $HTML_FILES; do
  echo "Processing file: $file"
  
  # Check if file already has the updated consent
  if grep -q "wait_for_update" "$file"; then
    echo "  - File already has updated consent code, skipping"
    continue
  fi
  
  # Check if file has any consent code
  if grep -q "gtag('consent', 'default'" "$file"; then
    # Replace existing consent code
    sed -i "s/gtag('consent', 'default',.*});/gtag('consent', 'default', {\n      'ad_storage': 'denied',\n      'analytics_storage': 'denied',\n      'ad_user_data': 'denied',\n      'ad_personalization': 'denied',\n      'functionality_storage': 'denied',\n      'personalization_storage': 'denied',\n      'security_storage': 'granted',\n      'wait_for_update': 500\n    });\n    gtag('set', 'ads_data_redaction', true);\n    gtag('set', 'url_passthrough', true);\n    \n    \/\/ Specify region\n    gtag('set', 'region', 'ES');/" "$file"
    echo "  - Updated existing consent code"
  else
    # Add consent code after head tag if not present
    sed -i "/<head>/a\\
  $CONSENT_CODE" "$file"
    echo "  - Added new consent code"
  fi
  
  COUNT=$((COUNT+1))
done

echo "Complete! Updated $COUNT HTML files."
echo "Remember to test the website to ensure the consent functionality works correctly." 
/**
 * Cache Refresh Script
 * Forces a fresh page load by detecting if the page might be cached
 */

(function() {
  // Set a unique version in localStorage
  const VERSION = '1.1.0';
  const lastVersion = localStorage.getItem('app_version');
  
  // Check if this is a new version
  if (lastVersion !== VERSION) {
    console.log('New version detected:', VERSION, 'vs stored:', lastVersion);
    
    // Store the current version
    localStorage.setItem('app_version', VERSION);
    
    // Force a hard refresh if this was a cached page
    if (lastVersion) {
      console.log('Forcing refresh to ensure latest version');
      
      // Clear any potential application cache
      if (window.applicationCache && window.applicationCache.update) {
        window.applicationCache.update();
      }
      
      // Reload the page without cache
      window.location.reload(true);
    }
  }
})(); 
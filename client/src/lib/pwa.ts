// Global variables to store PWA-related state
let deferredPrompt: any = null;
let pwaInstalled = false;

// Register the service worker
export const registerServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
      });
      
      // Check if service worker was successfully registered
      if (registration.active) {
        console.log('Service worker already active');
      } else if (registration.installing) {
        console.log('Service worker installing');
      } else if (registration.waiting) {
        console.log('Service worker waiting');
      }

      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is available, notify user to refresh
              console.log('New service worker available');
              // You could show a toast notification here
            }
          });
        }
      });
    } catch (error) {
      console.error('Service worker registration failed:', error);
    }
  } else {
    console.log('Service workers not supported');
  }
};

// Check if the app can be installed and if it's already installed
export const checkInstallStatus = (): { isInstalled: boolean, canBeInstalled: boolean } => {
  // Check if app is already installed
  if (window.matchMedia('(display-mode: standalone)').matches) {
    pwaInstalled = true;
  }
  
  // Check if it can be installed (we have a saved prompt)
  return {
    isInstalled: pwaInstalled,
    canBeInstalled: deferredPrompt !== null,
  };
};

// Initialize the install prompt listener
export const initInstallPrompt = (): void => {
  // Listen for the beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome from automatically showing the prompt
    e.preventDefault();
    // Save the event to use it later
    deferredPrompt = e;
  });

  // Listen for the appinstalled event
  window.addEventListener('appinstalled', () => {
    // The app was successfully installed
    pwaInstalled = true;
    deferredPrompt = null;
    // You could log analytics here
    console.log('App was installed');
  });
};

// Show the install prompt to the user
export const showInstallPrompt = async (): Promise<boolean> => {
  if (!deferredPrompt) {
    return false;
  }

  // Show the install prompt
  deferredPrompt.prompt();
  
  // Wait for the user to respond to the prompt
  const choiceResult = await deferredPrompt.userChoice;
  
  // Clear the saved prompt
  deferredPrompt = null;
  
  // Return if the app was installed
  return choiceResult.outcome === 'accepted';
};
// PWA registration and utilities

export const registerServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });
      
      if (registration.installing) {
        console.log('Service worker installing');
      } else if (registration.waiting) {
        console.log('Service worker installed');
      } else if (registration.active) {
        console.log('Service worker active');
      }
    } catch (error) {
      console.error(`Service worker registration failed: ${error}`);
    }
  } else {
    console.log('Service workers are not supported by this browser');
  }
};

// Check if the app is installed or if it can be installed
export const checkInstallStatus = (): { isInstalled: boolean, canBeInstalled: boolean } => {
  // Check if the app is being used in standalone mode (installed)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  
  // Check for iOS full screen mode (Safari doesn't have matchMedia for standalone)
  // @ts-ignore - Safari specific property
  const isInFullScreen = 'standalone' in window.navigator && window.navigator.standalone === true;
  
  const isInstalled = isStandalone || isInFullScreen;
  
  // PWA can be installed if on a compatible browser and not already installed
  const canBeInstalled = 'serviceWorker' in navigator && !isInstalled;
  
  return { isInstalled, canBeInstalled };
};

// Add event listener for install prompt
let deferredPrompt: any = null;

export const initInstallPrompt = (): void => {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
  });
};

// Show the install prompt
export const showInstallPrompt = async (): Promise<boolean> => {
  if (!deferredPrompt) {
    return false;
  }
  
  // Show the install prompt
  deferredPrompt.prompt();
  
  // Wait for the user to respond to the prompt
  const { outcome } = await deferredPrompt.userChoice;
  
  // We no longer need the prompt regardless of outcome
  deferredPrompt = null;
  
  return outcome === 'accepted';
};
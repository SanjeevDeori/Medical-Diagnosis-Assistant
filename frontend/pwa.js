// PWA Installation and Service Worker Registration
// This file handles PWA functionality

let deferredPrompt;
let isInstalled = false;

// Check if app is already installed
window.addEventListener('DOMContentLoaded', () => {
    // Check if running as installed PWA
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
        isInstalled = true;
        console.log('✅ App is running as installed PWA');
    }
});

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/service-worker.js')
            .then((registration) => {
                console.log('✅ Service Worker registered successfully:', registration.scope);

                // Check for updates periodically
                setInterval(() => {
                    registration.update();
                }, 60000); // Check every minute

                // Listen for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    console.log('🔄 New Service Worker found, installing...');

                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New service worker available
                            showUpdateNotification();
                        }
                    });
                });
            })
            .catch((error) => {
                console.error('❌ Service Worker registration failed:', error);
            });

        // Handle controller change (new service worker activated)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('🔄 New Service Worker activated, reloading page...');
            window.location.reload();
        });
    });
}

// Show update notification
function showUpdateNotification() {
    const notification = document.createElement('div');
    notification.id = 'update-notification';
    notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #2563eb;
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 16px;
    animation: slideUp 0.3s ease-out;
  `;

    notification.innerHTML = `
    <span>🎉 New version available!</span>
    <button onclick="updateApp()" style="
      background: white;
      color: #2563eb;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
    ">Update Now</button>
    <button onclick="dismissUpdate()" style="
      background: transparent;
      color: white;
      border: 1px solid white;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
    ">Later</button>
  `;

    document.body.appendChild(notification);
}

// Update app
window.updateApp = function () {
    const notification = document.getElementById('update-notification');
    if (notification) {
        notification.remove();
    }

    // Tell service worker to skip waiting
    navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration && registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
    });
};

// Dismiss update notification
window.dismissUpdate = function () {
    const notification = document.getElementById('update-notification');
    if (notification) {
        notification.remove();
    }
};

// Handle PWA install prompt
window.addEventListener('beforeinstallprompt', (e) => {
    console.log('💾 Install prompt available');

    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();

    // Stash the event so it can be triggered later
    deferredPrompt = e;

    // Show custom install button
    showInstallButton();
});

// Show install button
function showInstallButton() {
    if (isInstalled) return;

    const installButton = document.createElement('button');
    installButton.id = 'pwa-install-button';
    installButton.innerHTML = '📱 Install App';
    installButton.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 50px;
    cursor: pointer;
    font-weight: 600;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;
    animation: slideUp 0.3s ease-out;
  `;

    installButton.addEventListener('mouseenter', () => {
        installButton.style.transform = 'translateY(-2px)';
        installButton.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.5)';
    });

    installButton.addEventListener('mouseleave', () => {
        installButton.style.transform = 'translateY(0)';
        installButton.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.4)';
    });

    installButton.addEventListener('click', installPWA);

    document.body.appendChild(installButton);
}

// Install PWA
async function installPWA() {
    if (!deferredPrompt) {
        console.log('❌ No install prompt available');
        return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    console.log(`User response to install prompt: ${outcome}`);

    if (outcome === 'accepted') {
        console.log('✅ User accepted the install prompt');

        // Remove install button
        const installButton = document.getElementById('pwa-install-button');
        if (installButton) {
            installButton.remove();
        }
    } else {
        console.log('❌ User dismissed the install prompt');
    }

    // Clear the deferredPrompt
    deferredPrompt = null;
}

// Handle app installed
window.addEventListener('appinstalled', () => {
    console.log('✅ PWA was installed successfully');
    isInstalled = true;

    // Remove install button if present
    const installButton = document.getElementById('pwa-install-button');
    if (installButton) {
        installButton.remove();
    }

    // Show success message
    showInstallSuccessMessage();
});

// Show install success message
function showInstallSuccessMessage() {
    const message = document.createElement('div');
    message.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #10b981;
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    animation: slideDown 0.3s ease-out;
  `;

    message.innerHTML = '✅ App installed successfully! You can now use it offline.';

    document.body.appendChild(message);

    setTimeout(() => {
        message.style.animation = 'slideUp 0.3s ease-out';
        setTimeout(() => message.remove(), 300);
    }, 3000);
}

// Check online/offline status
window.addEventListener('online', () => {
    console.log('🌐 Back online');
    showConnectionStatus('online');
});

window.addEventListener('offline', () => {
    console.log('📡 Offline mode');
    showConnectionStatus('offline');
});

// Show connection status
function showConnectionStatus(status) {
    const statusElement = document.getElementById('statusText');
    const statusDot = document.getElementById('statusDot');

    if (statusElement && statusDot) {
        if (status === 'offline') {
            statusDot.classList.add('offline');
            statusText.textContent = 'Offline Mode - Using cached data';
        } else {
            statusDot.classList.remove('offline');
            statusText.textContent = 'Online - Ready for diagnosis';
        }
    }
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slideUp {
    from {
      transform: translateY(100px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  @keyframes slideDown {
    from {
      transform: translateX(-50%) translateY(-100px);
      opacity: 0;
    }
    to {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);

console.log('✅ PWA script loaded');

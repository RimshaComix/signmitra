'use client';

import { useEffect } from 'react';

export default function PWARegister() {
  useEffect(() => {
    // Only register service workers in production client environments supporting navigator.serviceWorker
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('[SignMitra Engine] ServiceWorker active with scope:', registration.scope);

            // Listen for service worker lifecycle updates
            registration.onupdatefound = () => {
              const installingWorker = registration.installing;
              if (!installingWorker) return;

              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    console.log('[SignMitra Engine] New offline cache available; refresh to activate.');
                  } else {
                    console.log('[SignMitra Engine] Content cached for zero-latency offline use.');
                  }
                }
              };
            };
          })
          .catch((error) => {
            console.error('[SignMitra Engine] ServiceWorker setup failed:', error);
          });
      });
    }
  }, []);

  return null;
}
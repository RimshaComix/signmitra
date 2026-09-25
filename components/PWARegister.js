'use client';

import { useEffect } from 'react';

export default function PWARegister() {
  useEffect(() => {
    // Only execute if running in a client browser environment supporting service workers
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('[SignMitra Engine] ServiceWorker active with scope:', registration.scope);
        })
        .catch((error) => {
          console.error('[SignMitra Engine] ServiceWorker setup failed:', error);
        });
    }
  }, []);

  return null; // This component registers the thread background engine silently
}

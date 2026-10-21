'use client';

export function registerServiceWorker(): void {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then(registration => {
          console.log('PWA ServiceWorker registrato con successo: ', registration.scope);
        })
        .catch(err => {
          console.warn('Registrazione ServiceWorker fallita: ', err);
        });
    });
  }
}

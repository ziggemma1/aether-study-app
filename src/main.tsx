import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { inject } from '@vercel/analytics';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Initialize Vercel Analytics
inject();

/**
 * Kill switch for a service worker nobody meant to still be running.
 *
 * A past PWA experiment (commit 687ea92) registered /sw.js and was later
 * ripped out — but nothing ever called unregister(), and service worker
 * registrations outlive the code that created them: they stay active in a
 * browser indefinitely, independent of what the app's current source does.
 * That sw.js's fetch handler is cache-first with no revalidation
 * (`caches.match(req) ?? fetch(req)`, forever, same cache name every build),
 * so any browser that registered it back then has been serving itself the
 * `index.html` — and therefore the hashed JS bundle it points to — from
 * whenever it was first cached. Every later deploy was invisible to that
 * browser no matter how many times the server redeployed, because the
 * request for '/' never left the service worker's cache.
 *
 * public/sw.js has been deleted so new visitors never pick this up again.
 * This unregisters it (and drops its cache) for anyone who already has it,
 * unconditionally and on every load — cheap once nothing is left to remove.
 */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then((regs) => regs.forEach((reg) => reg.unregister()))
    .catch(() => {});
  if (window.caches) {
    caches.keys()
      .then((keys) => keys.forEach((key) => caches.delete(key)))
      .catch(() => {});
  }
}

createRoot(document.getElementById('root')!).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
);

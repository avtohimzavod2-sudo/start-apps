import React from 'react';
import ReactDOM from 'react-dom/client';
import { createSa } from '@sdk/sa.js';
import App from './App.jsx';

const api = import.meta.env.VITE_SA_API || 'http://localhost:8000';
const sa = createSa({ api });

// Инжектим розетки в глобал — шаблоны получают доступ через window.sa.
window.sa = sa;

// PWA-оживитель.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((e) => console.warn('SW:', e));
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App sa={sa} />
  </React.StrictMode>
);

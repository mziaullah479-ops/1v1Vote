import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

declare global {
  interface Window {
    __RUNTIME_CONFIG__?: {
      gaMeasurementId?: string;
    };
    dataLayer: unknown[][];
    gtag: (...args: unknown[]) => void;
  }
}

const measurementId =
  (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined) ||
  window.__RUNTIME_CONFIG__?.gaMeasurementId;

if (measurementId) {
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, { anonymize_ip: true });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

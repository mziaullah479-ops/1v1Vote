import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

declare global {
  interface Window {
    __RUNTIME_CONFIG__?: {
      gaMeasurementId?: string;
      gtmId?: string;
      adsenseClientId?: string;
      adsenseSlots?: Record<string, string | undefined>;
    };
    dataLayer: unknown[][];
    gtag: (...args: unknown[]) => void;
    adsbygoogle?: unknown[];
  }
}

const measurementId =
  (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined) ||
  window.__RUNTIME_CONFIG__?.gaMeasurementId;
const gtmId =
  (import.meta.env.VITE_GTM_CONTAINER_ID as string | undefined) ||
  window.__RUNTIME_CONFIG__?.gtmId;
const adsenseClientId =
  (import.meta.env.VITE_ADSENSE_CLIENT_ID as string | undefined) ||
  window.__RUNTIME_CONFIG__?.adsenseClientId;

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

if (gtmId) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`;
  document.head.appendChild(script);
}

if (adsenseClientId) {
  const script = document.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(adsenseClientId)}`;
  document.head.appendChild(script);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

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

function loadExternalScript(src: string, crossOrigin?: string) {
  const script = document.createElement('script');
  script.async = true;
  if (crossOrigin) script.crossOrigin = crossOrigin;
  script.src = src;
  document.head.appendChild(script);
}

function deferThirdPartyWork(work: () => void) {
  window.setTimeout(work, 2000);
}

if (measurementId) {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };
  window.gtag('js', new Date());
  // Route changes are tracked by App so SPA navigation does not lose page views.
  window.gtag('config', measurementId, { anonymize_ip: true, send_page_view: false });
  deferThirdPartyWork(() => {
    loadExternalScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`);
  });
}

if (gtmId) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  deferThirdPartyWork(() => {
    loadExternalScript(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`);
  });
}

if (adsenseClientId) {
  deferThirdPartyWork(() => {
    loadExternalScript(
      `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(adsenseClientId)}`,
      'anonymous',
    );
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

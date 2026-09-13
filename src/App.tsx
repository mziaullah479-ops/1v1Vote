import React, { useEffect } from 'react';
import { PeopleDashboard } from './components/PeopleDashboard';

function setMeta(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
}

export default function App() {
  useEffect(() => {
    const title = '1v1Vote - Live Public Figure Voting Dashboard';
    const description = 'Vote once every 24 hours for public figures, creators, scholars, athletes, and leaders. No login required.';
    const url = `${window.location.origin}/`;
    document.title = title;
    setMeta('name', 'description', description);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', url);
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonical) canonical.href = url;
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', { page_title: title, page_location: url, page_path: '/' });
    }
  }, []);

  return <PeopleDashboard />;
}

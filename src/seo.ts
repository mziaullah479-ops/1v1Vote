export function setMeta(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
}

export function trackEvent(name: string, params: Record<string, string | number | boolean> = {}) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', name, params);
  } else if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event: name, ...params });
  }
}

export function setPageSeo(title: string, description: string, path: string, image?: string) {
  const url = `${window.location.origin}${path}`;
  const socialImage = image || `${window.location.origin}/og-image.png`;
  document.title = title;
  setMeta('name', 'description', description);
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', description);
  setMeta('property', 'og:type', path.startsWith('/people/') ? 'profile' : 'website');
  setMeta('property', 'og:url', url);
  setMeta('property', 'og:image', socialImage);
  setMeta('property', 'og:image:alt', `${title} — 1v1Vote`);
  setMeta('name', 'twitter:title', title);
  setMeta('name', 'twitter:description', description);
  setMeta('name', 'twitter:image', socialImage);
  setMeta('name', 'twitter:image:alt', `${title} — 1v1Vote`);
  const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (canonical) canonical.href = url.replace(/\/$/, '') || `${window.location.origin}/`;
  const analyticsWindow = window as Window & { __lastPageViewKey?: string };
  const pageViewKey = `${path}|${title}`;
  if (analyticsWindow.__lastPageViewKey !== pageViewKey) {
    analyticsWindow.__lastPageViewKey = pageViewKey;
    trackEvent('page_view', { page_title: title, page_location: url, page_path: path });
  }
}

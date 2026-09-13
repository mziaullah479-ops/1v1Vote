export function setMeta(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
}

export function setPageSeo(title: string, description: string, path: string, image?: string) {
  const url = `${window.location.origin}${path}`;
  document.title = title;
  setMeta('name', 'description', description);
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', description);
  setMeta('property', 'og:url', url);
  setMeta('name', 'twitter:title', title);
  setMeta('name', 'twitter:description', description);
  if (image) {
    setMeta('property', 'og:image', image);
    setMeta('name', 'twitter:image', image);
  }
  const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (canonical) canonical.href = url;
  if (typeof window.gtag === 'function') window.gtag('event', 'page_view', { page_title: title, page_location: url, page_path: path });
}

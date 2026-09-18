const API_BASE = (import.meta.env.VITE_BASE_PATH ? import.meta.env.VITE_BACKEND_URL || '' : '').replace(/\/$/, '');

export function apiUrl(path: string) {
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

function adminCsrfToken() {
  return document.cookie.split('; ').find((part) => part.startsWith('v1_admin_csrf='))?.split('=').slice(1).join('=');
}

export function apiFetch(input: string | URL, init: RequestInit = {}) {
  const url = typeof input === 'string' && input.startsWith('/api/') ? apiUrl(input) : input.toString();
  const headers = new Headers(init.headers);
  const method = (init.method || 'GET').toUpperCase();
  if (url.includes('/api/admin/') && !['GET', 'HEAD', 'OPTIONS'].includes(method) && !url.endsWith('/api/admin/login') && !url.endsWith('/api/admin/logout')) {
    const token = adminCsrfToken();
    if (token) headers.set('X-CSRF-Token', token);
  }
  return globalThis.fetch(url, { ...init, headers });
}

const API_BASE = (import.meta.env.VITE_BASE_PATH ? import.meta.env.VITE_BACKEND_URL || '' : '').replace(/\/$/, '');

export function apiUrl(path: string) {
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

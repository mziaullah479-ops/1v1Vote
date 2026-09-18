import { apiUrl } from '../services/api';

export function imageVariant(url: string, width: number) {
  if (!url) return '';
  const safeWidth = Math.min(1600, Math.max(96, Math.round(width)));
  return apiUrl(`/api/image?url=${encodeURIComponent(url)}&width=${safeWidth}`);
}

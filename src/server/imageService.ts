import { Buffer } from 'node:buffer';

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_HTML_BYTES = 2 * 1024 * 1024;
const TIMEOUT_MS = 10000;

export interface RemoteImage {
  sourceUrl: string;
  contentType: string;
  body: Buffer;
}

export class ImageFetchError extends Error {}

function decodeEntities(value: string) {
  return value.replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/&lt;/gi, '<').replace(/&gt;/gi, '>');
}

function blockedHost(hostname: string) {
  const host = hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal') || host === '::1' || host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80:')) return true;
  const parts = host.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  return parts[0] === 0 || parts[0] === 10 || parts[0] === 127 || (parts[0] === 169 && parts[1] === 254) || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || (parts[0] === 192 && parts[1] === 168);
}

export function normalizeImageUrl(input: string) {
  const value = decodeEntities(input.trim()).replace(/^['"]|['"]$/g, '');
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ImageFetchError('The image URL is not valid.');
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || blockedHost(url.hostname)) throw new ImageFetchError('Only public HTTP or HTTPS image URLs are supported.');
  return url.toString();
}

function requestUrl(input: string, width: number) {
  const url = new URL(input);
  const size = Math.min(1600, Math.max(96, Math.round(width || 960)));
  if (url.hostname === 'upload.wikimedia.org' || url.hostname === 'thumb.wikimedia.org') {
    url.hostname = 'upload.wikimedia.org';
    return 'https://images.weserv.nl/?url=' + encodeURIComponent(url.toString()) + '&w=' + size + '&output=webp';
  } else if (url.hostname.endsWith('googleusercontent.com')) {
    url.pathname = url.pathname.replace(/=s\d+/i, '=s' + size);
    url.search = url.search.replace(/=s\d+/i, '=s' + size);
  } else if (url.hostname === 'images.unsplash.com') {
    url.searchParams.set('w', String(size));
    url.searchParams.set('q', '75');
  }
  return url.toString();
}

function attr(tag: string, name: string) {
  return tag.match(new RegExp('\\b' + name + '\\s*=\\s*["\']([^"\']+)["\']', 'i'))?.[1];
}

function absoluteUrl(value: string | undefined, base: string) {
  if (!value) return null;
  try {
    const url = new URL(decodeEntities(value), base);
    return ['http:', 'https:'].includes(url.protocol) && !blockedHost(url.hostname) ? url.toString() : null;
  } catch {
    return null;
  }
}

function pageImage(html: string, pageUrl: string) {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0];
    const key = (attr(tag, 'property') || attr(tag, 'name') || '').toLowerCase();
    if (['og:image', 'og:image:url', 'og:image:secure_url', 'twitter:image', 'twitter:image:src'].includes(key)) {
      const image = absoluteUrl(attr(tag, 'content'), pageUrl);
      if (image) return image;
    }
  }
  return null;
}

function contentType(header: string, body: Buffer) {
  const type = header.split(';')[0].trim().toLowerCase();
  if (type.startsWith('image/')) return type;
  if (body.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png';
  if (body.subarray(0, 3).equals(Buffer.from([255, 216, 255]))) return 'image/jpeg';
  if (body.subarray(0, 6).toString() === 'GIF89a' || body.subarray(0, 6).toString() === 'GIF87a') return 'image/gif';
  if (body.subarray(0, 4).toString() === 'RIFF' && body.subarray(8, 12).toString() === 'WEBP') return 'image/webp';
  if (/^\s*<svg[\s>]/i.test(body.subarray(0, 512).toString('utf8'))) return 'image/svg+xml';
  return '';
}

async function fetchImage(input: string, width: number, depth: number, visited: Set<string>): Promise<RemoteImage> {
  if (depth > 3) throw new ImageFetchError('The URL did not resolve to an image.');
  const normalized = normalizeImageUrl(input);
  const parsed = new URL(normalized);
  const embedded = parsed.searchParams.get('imgurl') || parsed.searchParams.get('mediaurl');
  if (embedded) return fetchImage(embedded, width, depth + 1, visited);
  const target = requestUrl(normalized, width);
  if (visited.has(target)) throw new ImageFetchError('The image URL redirected in a loop.');
  visited.add(target);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(target, { signal: controller.signal, redirect: 'manual', headers: { Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,text/html;q=0.8,*/*;q=0.5', 'User-Agent': '1v1Vote image resolver/1.0' } });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) throw new ImageFetchError('The image redirect did not include a destination.');
      return fetchImage(new URL(location, target).toString(), width, depth + 1, visited);
    }
    if (!response.ok) throw new ImageFetchError('The remote image returned ' + response.status + '.');
    const header = response.headers.get('content-type') || '';
    const declared = Number(response.headers.get('content-length') || 0);
    const limit = header.toLowerCase().includes('html') ? MAX_HTML_BYTES : MAX_BYTES;
    if (declared > limit) throw new ImageFetchError('The remote image is too large.');
    const body = Buffer.from(await response.arrayBuffer());
    if (body.length > limit) throw new ImageFetchError('The remote image is too large.');
    const type = contentType(header, body);
    if (type) return { sourceUrl: normalized, contentType: type, body };
    if (!header.toLowerCase().includes('html')) throw new ImageFetchError('The URL did not return an image.');
    const image = pageImage(body.toString('utf8'), target);
    if (!image) throw new ImageFetchError('No public image was found on that page.');
    return fetchImage(image, width, depth + 1, visited);
  } catch (error) {
    if (error instanceof ImageFetchError) throw error;
    throw new ImageFetchError('The image could not be loaded from that URL.');
  } finally {
    clearTimeout(timeout);
  }
}

export function fetchRemoteImage(input: string, width = 960) {
  return fetchImage(input, width, 0, new Set<string>());
}

export async function resolveImageSourceUrl(input: string) {
  return (await fetchRemoteImage(input, 1200)).sourceUrl;
}

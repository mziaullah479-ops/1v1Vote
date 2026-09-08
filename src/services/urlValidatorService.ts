import { Platform } from '../types';
import { fetchSocialProfile } from '../utils/socialDetector';

export interface UrlValidationResult {
  url: string;
  isValidUrl: boolean;
  status: 'idle' | 'validating' | 'valid' | 'invalid' | 'verified';
  errorMessage?: string;
  platform: Platform | 'Other';
  creatorName: string;
  handle: string;
  avatarUrl: string;
  followersCount: string;
  subscriberCountRaw: number;
  growthRate: string;
  isVerified: boolean;
  sslSecure: boolean;
  latencyMs: number;
  imageStatus: 'valid' | 'broken' | 'loading' | 'unchecked';
  checkedAt: string;
  summary: string;
}

/**
 * Pre-checks if an image can actually be loaded by browser.
 */
export function checkImagePreload(imageUrl: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!imageUrl || !imageUrl.startsWith('http')) {
      resolve(false);
      return;
    }
    const img = new Image();
    let finished = false;

    img.onload = () => {
      if (!finished) {
        finished = true;
        resolve(true);
      }
    };

    img.onerror = () => {
      if (!finished) {
        finished = true;
        resolve(false);
      }
    };

    // Safety timeout after 2.5s
    setTimeout(() => {
      if (!finished) {
        finished = true;
        resolve(true); // Don't block forever
      }
    }, 2500);

    img.src = imageUrl;
  });
}

/**
 * Validates a creator profile URL and fetches public metadata when available.
 */
export async function prefetchAndValidateCreatorUrl(
  inputUrl: string,
  nameHint?: string
): Promise<UrlValidationResult> {
  const startTime = performance.now();
  const trimmed = inputUrl.trim();

  // 1. Check if empty
  if (!trimmed) {
    return {
      url: '',
      isValidUrl: false,
      status: 'idle',
      platform: 'Other',
      creatorName: '',
      handle: '',
      avatarUrl: '',
      followersCount: '',
      subscriberCountRaw: 0,
      growthRate: '',
      isVerified: false,
      sslSecure: false,
      latencyMs: 0,
      imageStatus: 'unchecked',
      checkedAt: new Date().toLocaleTimeString(),
      summary: 'Waiting for profile URL...',
    };
  }

  // 2. Syntax validation
  let normalizedUrl = trimmed;
  let isHandleOnly = false;

  if (trimmed.startsWith('@')) {
    isHandleOnly = true;
    normalizedUrl = `https://youtube.com/${trimmed}`;
  } else if (!trimmed.includes('.') && !trimmed.includes('/')) {
    isHandleOnly = true;
    normalizedUrl = `https://youtube.com/@${trimmed}`;
  } else if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    normalizedUrl = `https://${trimmed}`;
  }

  let parsedUrl: URL | null = null;
  try {
    parsedUrl = new URL(normalizedUrl);
  } catch {
    return {
      url: trimmed,
      isValidUrl: false,
      status: 'invalid',
      errorMessage: 'Malformed URL: Must be a valid web address (e.g. https://youtube.com/@channel)',
      platform: 'Other',
      creatorName: nameHint || '',
      handle: '',
      avatarUrl: '',
      followersCount: '',
      subscriberCountRaw: 0,
      growthRate: '',
      isVerified: false,
      sslSecure: false,
      latencyMs: Math.round(performance.now() - startTime),
      imageStatus: 'broken',
      checkedAt: new Date().toLocaleTimeString(),
      summary: 'Invalid URL format',
    };
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  const pathname = parsedUrl.pathname;
  const sslSecure = parsedUrl.protocol === 'https:';

  // Check valid creator domain
  let detectedPlatform: Platform | 'Other' = 'Other';
  let cleanHandle = '';

  if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
    detectedPlatform = 'YouTube';
    const match = pathname.match(/@([\w.-]+)/) || pathname.match(/\/(?:c|user|channel)\/([\w.-]+)/);
    cleanHandle = match ? `@${match[1]}` : (pathname.replace('/', '') ? `@${pathname.replace('/', '')}` : '@channel');
  } else if (hostname.includes('tiktok.com')) {
    detectedPlatform = 'TikTok';
    const match = pathname.match(/@([\w.-]+)/);
    cleanHandle = match ? `@${match[1]}` : '@tiktoker';
  } else if (hostname.includes('instagram.com')) {
    detectedPlatform = 'Instagram';
    const parts = pathname.split('/').filter(Boolean);
    cleanHandle = parts[0] ? `@${parts[0]}` : '@instagram';
  } else if (hostname.includes('twitch.tv')) {
    detectedPlatform = 'Twitch';
    const parts = pathname.split('/').filter(Boolean);
    cleanHandle = parts[0] ? `@${parts[0]}` : '@streamer';
  } else {
    // Other web link or domain
    detectedPlatform = 'Other';
    cleanHandle = `@${hostname.replace('www.', '').split('.')[0]}`;
  }

  // Resolve metadata from the server scraper. Missing public stats remain unavailable.
  const cleanHandleValue = cleanHandle.replace('@', '');
  let resolvedName = nameHint || '';
  let resolvedAvatar = detectedPlatform === 'Other'
    ? ''
    : `https://unavatar.io/${detectedPlatform.toLowerCase()}/${encodeURIComponent(cleanHandleValue)}`;
  let resolvedFollowers = '';
  let resolvedRawSubs = 0;
  let resolvedGrowth = '';
  let verified = false;

  try {
    const metadata = await fetchSocialProfile(normalizedUrl, nameHint);
    if (detectedPlatform === 'Other') detectedPlatform = metadata.platform;
    cleanHandle = metadata.handle || cleanHandle;
    resolvedName = metadata.name || resolvedName || cleanHandle.replace('@', '');
    resolvedAvatar = metadata.avatarUrl || resolvedAvatar;
    resolvedFollowers = metadata.followersCount || '';
    resolvedRawSubs = typeof metadata.subscriberCountRaw === 'number' ? metadata.subscriberCountRaw : 0;
    resolvedGrowth = metadata.growthRate || '';
    verified = metadata.verified === true;
  } catch (error) {
    console.warn('Could not fetch public social metadata:', error);
    const rawName = nameHint || cleanHandle.replace('@', '');
    resolvedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
  }

  // 4. Pre-check image validity asynchronously
  let imageStatus: 'valid' | 'broken' | 'loading' = 'valid';
  try {
    const isImageAccessible = await checkImagePreload(resolvedAvatar);
    imageStatus = isImageAccessible ? 'valid' : 'broken';
  } catch {
    imageStatus = 'broken';
  }

  const latencyMs = Math.round(performance.now() - startTime);

  return {
    url: trimmed,
    isValidUrl: true,
    status: 'valid',
    platform: detectedPlatform,
    creatorName: resolvedName,
    handle: cleanHandle,
    avatarUrl: resolvedAvatar,
    followersCount: resolvedFollowers,
    subscriberCountRaw: resolvedRawSubs,
    growthRate: resolvedGrowth,
    isVerified: verified,
    sslSecure,
    latencyMs,
    imageStatus,
    checkedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    summary: `${detectedPlatform} profile detected: ${cleanHandle} • Public stats shown only when available`,
  };
}

/**
 * Sample pre-configured test URLs for instant admin verification
 */
export const SAMPLE_CREATOR_URLS = [
  {
    label: 'Ducky Bhai (YouTube)',
    url: 'https://youtube.com/@duckybhai',
    name: 'Ducky Bhai',
    region: 'Pakistan' as const,
  },
  {
    label: 'MrBeast Gaming (YouTube)',
    url: 'https://youtube.com/@mrbeastgaming',
    name: 'MrBeast Gaming',
    region: 'USA' as const,
  },
  {
    label: 'CarryMinati (YouTube)',
    url: 'https://youtube.com/@CarryMinati',
    name: 'CarryMinati',
    region: 'India' as const,
  },
  {
    label: 'Kai Cenat (Twitch)',
    url: 'https://twitch.tv/kaicenat',
    name: 'Kai Cenat',
    region: 'USA' as const,
  },
  {
    label: 'IShowSpeed (YouTube)',
    url: 'https://youtube.com/@IShowSpeed',
    name: 'IShowSpeed',
    region: 'USA' as const,
  },
];

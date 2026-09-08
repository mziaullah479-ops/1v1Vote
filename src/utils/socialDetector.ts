import { Platform } from '../types';

export interface DetectedSocialProfile {
  platform: Platform;
  handle: string;
  name: string;
  avatarUrl: string;
  channelLogoUrl: string;
  followersCount: string;
  subscriberCountRaw: number;
  growthRate: string;
  profileUrl: string;
  verified: boolean;
}

/**
 * Fast synchronous parser to determine platform, clean handle, and default avatar URL.
 * Counts stay empty until the server returns publicly available metadata.
 */
export function detectSocialProfile(url: string, creatorNameHint?: string): DetectedSocialProfile {
  const cleanUrl = url.trim();
  let platform: Platform = 'YouTube';
  let handle = '';

  try {
    const parsed = new URL(cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`);
    const host = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname;

    if (host.includes('youtube.com') || host.includes('youtu.be')) {
      platform = 'YouTube';
      const match = pathname.match(/@([\w.-]+)/) || pathname.match(/\/(?:c|user|channel)\/([\w.-]+)/);
      handle = match ? `@${match[1]}` : (pathname.replace('/', '') ? `@${pathname.replace('/', '')}` : '@channel');
    } else if (host.includes('tiktok.com')) {
      platform = 'TikTok';
      const match = pathname.match(/@([\w.-]+)/);
      handle = match ? `@${match[1]}` : '@tiktoker';
    } else if (host.includes('instagram.com')) {
      platform = 'Instagram';
      const segments = pathname.split('/').filter(Boolean);
      handle = segments[0] ? `@${segments[0]}` : '@instagrammer';
    } else if (host.includes('twitch.tv')) {
      platform = 'Twitch';
      const segments = pathname.split('/').filter(Boolean);
      handle = segments[0] ? `@${segments[0]}` : '@streamer';
    }
  } catch {
    if (cleanUrl.startsWith('@')) {
      handle = cleanUrl;
      platform = 'YouTube';
    } else {
      handle = `@${cleanUrl.replace(/[^a-zA-Z0-9_]/g, '')}`;
    }
  }

  const rawName = creatorNameHint || handle.replace('@', '');
  const formattedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
  const cleanHandle = handle.replace('@', '');

  let defaultAvatar = '';
  if (platform === 'YouTube') {
    defaultAvatar = `https://unavatar.io/youtube/${encodeURIComponent(handle)}`;
  } else if (platform === 'TikTok') {
    defaultAvatar = `https://unavatar.io/tiktok/${encodeURIComponent(cleanHandle)}`;
  } else if (platform === 'Instagram') {
    defaultAvatar = `https://unavatar.io/instagram/${encodeURIComponent(cleanHandle)}`;
  } else {
    defaultAvatar = `https://unavatar.io/twitch/${encodeURIComponent(cleanHandle)}`;
  }

  return {
    platform,
    handle,
    name: formattedName,
    avatarUrl: defaultAvatar,
    channelLogoUrl: defaultAvatar,
    followersCount: '',
    subscriberCountRaw: 0,
    growthRate: '',
    profileUrl: cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`,
    verified: false,
  };
}

/**
 * Real asynchronous detector: calls backend `/api/detect-social` to extract real-time
 * subscriber counts, channel titles, and high-res official channel avatars directly
 * from YouTube/TikTok/Instagram metadata.
 */
export async function fetchSocialProfile(
  url: string,
  creatorNameHint?: string
): Promise<DetectedSocialProfile> {
  const syncFallback = detectSocialProfile(url, creatorNameHint);
  if (!url.trim()) return syncFallback;

  try {
    const res = await fetch(`/api/detect-social?url=${encodeURIComponent(url)}&name=${encodeURIComponent(creatorNameHint || '')}`);
    if (!res.ok) {
      console.warn('API returned non-ok status for social detection:', res.status);
      return syncFallback;
    }

    const data = await res.json();
    if (data && data.avatarUrl) {
      return {
        platform: data.platform || syncFallback.platform,
        handle: data.handle || syncFallback.handle,
        name: data.name || syncFallback.name,
        avatarUrl: data.avatarUrl,
        channelLogoUrl: data.avatarUrl,
         followersCount: data.followersCount ?? syncFallback.followersCount,
         subscriberCountRaw: typeof data.subscriberCountRaw === 'number' ? data.subscriberCountRaw : syncFallback.subscriberCountRaw,
         growthRate: data.growthRate ?? syncFallback.growthRate,
         profileUrl: data.profileUrl || syncFallback.profileUrl,
         verified: data.verified ?? false,
      };
    }
  } catch (err) {
    console.error('Failed to query /api/detect-social, falling back to sync detector:', err);
  }

  return syncFallback;
}

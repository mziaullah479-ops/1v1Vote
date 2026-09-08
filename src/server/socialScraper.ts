export interface ScrapedSocialResult {
  platform: 'YouTube' | 'TikTok' | 'Instagram' | 'Twitch';
  handle: string;
  name: string;
  avatarUrl: string;
  followersCount: string;
  subscriberCountRaw: number;
  growthRate: string;
  profileUrl: string;
  verified: boolean;
}

const SUPPORTED_HOSTS = ['youtube.com', 'youtu.be', 'tiktok.com', 'instagram.com', 'twitch.tv'];
const SOCIAL_URL_ERROR = 'Only YouTube, TikTok, Instagram, and Twitch profile URLs are supported.';

function isSupportedHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/^www\./, '');
  return SUPPORTED_HOSTS.some((root) => host === root || host.endsWith(`.${root}`));
}

async function fetchWithTimeout(input: string, init: RequestInit = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    return await fetch(input, { ...init, signal: controller.signal, redirect: 'manual' });
  } finally {
    clearTimeout(timeout);
  }
}

export async function scrapeSocialProfile(inputUrl: string, nameHint?: string): Promise<ScrapedSocialResult> {
  let url = inputUrl.trim();
  let platform: 'YouTube' | 'TikTok' | 'Instagram' | 'Twitch' = 'YouTube';
  let handle = '';

  // If user entered just @handle or channel name
  if (url.startsWith('@')) {
    handle = url;
    url = `https://www.youtube.com/${url}`;
  } else if (!url.includes('.') && !url.includes('/')) {
    handle = `@${url}`;
    url = `https://www.youtube.com/@${url}`;
  }

  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    if (!['http:', 'https:'].includes(parsed.protocol) || !isSupportedHost(parsed.hostname)) {
      throw new Error(SOCIAL_URL_ERROR);
    }
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
      const seg = pathname.split('/').filter(Boolean);
      handle = seg[0] ? `@${seg[0]}` : '@instagram';
    } else if (host.includes('twitch.tv')) {
      platform = 'Twitch';
      const seg = pathname.split('/').filter(Boolean);
      handle = seg[0] ? `@${seg[0]}` : '@streamer';
    }
  } catch (error) {
    if (error instanceof Error && error.message === SOCIAL_URL_ERROR) {
      throw error;
    }
    handle = `@${url.replace(/[^a-zA-Z0-9_]/g, '')}`;
  }

  // YOUTUBE SCRAPING
  if (platform === 'YouTube') {
    const targetUrl = url.startsWith('http') ? url : `https://${url}`;
    try {
       const response = await fetchWithTimeout(targetUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      if (response.ok) {
        const html = await response.text();

        // 1. Channel Name
        const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/) || html.match(/<title>([^<]+)<\/title>/);
        let name = titleMatch ? titleMatch[1].replace(' - YouTube', '').trim() : (nameHint || handle.replace('@', ''));

        // 2. Real Channel Logo (Google User Content CDN)
        const imgMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
        let avatarUrl = imgMatch ? imgMatch[1] : '';
        if (avatarUrl && avatarUrl.includes('yt3.googleusercontent.com')) {
          // Request crystal clear high-res s900 avatar
          avatarUrl = avatarUrl.replace(/=s\d+-[^"]+/, '=s900-c-k-c0x00ffffff-no-rj');
        }
        if (!avatarUrl) {
          avatarUrl = `https://unavatar.io/youtube/${encodeURIComponent(handle)}`;
        }

        // 3. Real Subscribers
        const countMatch =
          html.match(/"interactionStatistic":\[\{"@type":"InteractionCounter","interactionType":\{"@type":"FollowAction"\},"userInteractionCount":"(\d+)"\}/) ||
          html.match(/"userInteractionCount":"(\d+)"/);
        const subTextMatch = html.match(/"subscriberCountText":\{[^}]*"simpleText":"([^"]+)"/);

        let rawSubs = countMatch ? parseInt(countMatch[1], 10) : 0;
        let formattedSubs = 'Unavailable';

        if (rawSubs >= 1000000) {
          formattedSubs = (rawSubs / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        } else if (rawSubs >= 1000) {
          formattedSubs = (rawSubs / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
        } else if (subTextMatch) {
          const matchNum = subTextMatch[1].match(/([\d.]+)\s*([MKmk]?)/);
          if (matchNum) {
            const val = parseFloat(matchNum[1]);
            const unit = matchNum[2].toUpperCase();
            rawSubs = unit === 'M' ? Math.floor(val * 1000000) : unit === 'K' ? Math.floor(val * 1000) : Math.floor(val);
            formattedSubs = rawSubs >= 1000000
              ? `${(rawSubs / 1000000).toFixed(1).replace(/\.0$/, '')}M`
              : rawSubs >= 1000
                ? `${(rawSubs / 1000).toFixed(1).replace(/\.0$/, '')}K`
                : String(rawSubs);
          }
        }

        return {
          platform,
          handle,
          name,
          avatarUrl,
          followersCount: formattedSubs,
          subscriberCountRaw: rawSubs,
          growthRate: '',
          profileUrl: targetUrl,
          verified: false,
        };
      }
    } catch (fetchErr) {
      console.error('YouTube scrape error:', fetchErr);
    }
  }

  // TIKTOK SCRAPING
  if (platform === 'TikTok') {
    const cleanHandle = handle.replace('@', '');
    try {
      const oembedRes = await fetchWithTimeout(`https://www.tiktok.com/oembed?url=https://www.tiktok.com/@${cleanHandle}`);
      if (oembedRes.ok) {
        const oData = await oembedRes.json();
        return {
          platform: 'TikTok',
          handle: `@${cleanHandle}`,
          name: oData.author_name || cleanHandle,
          avatarUrl: oData.thumbnail_url || `https://unavatar.io/tiktok/${cleanHandle}`,
          followersCount: '',
          subscriberCountRaw: 0,
          growthRate: '',
          profileUrl: `https://www.tiktok.com/@${cleanHandle}`,
          verified: false,
        };
      }
    } catch (err) {
      console.error('TikTok oEmbed error:', err);
    }

    return {
      platform: 'TikTok',
      handle: `@${cleanHandle}`,
      name: nameHint || cleanHandle,
      avatarUrl: `https://unavatar.io/tiktok/${cleanHandle}`,
      followersCount: '',
      subscriberCountRaw: 0,
      growthRate: '',
      profileUrl: `https://www.tiktok.com/@${cleanHandle}`,
      verified: false,
    };
  }

  // INSTAGRAM SCRAPING
  if (platform === 'Instagram') {
    const cleanHandle = handle.replace('@', '');
    return {
      platform: 'Instagram',
      handle: `@${cleanHandle}`,
      name: nameHint || cleanHandle,
      avatarUrl: `https://unavatar.io/instagram/${cleanHandle}`,
      followersCount: '',
      subscriberCountRaw: 0,
      growthRate: '',
      profileUrl: `https://www.instagram.com/${cleanHandle}/`,
      verified: false,
    };
  }

  // TWITCH SCRAPING
  if (platform === 'Twitch') {
    const cleanHandle = handle.replace('@', '');
    return {
      platform: 'Twitch',
      handle: `@${cleanHandle}`,
      name: nameHint || cleanHandle,
      avatarUrl: `https://unavatar.io/twitch/${cleanHandle}`,
      followersCount: '',
      subscriberCountRaw: 0,
      growthRate: '',
      profileUrl: `https://www.twitch.tv/${cleanHandle}`,
      verified: false,
    };
  }

  return {
    platform,
    handle,
    name: nameHint || handle.replace('@', ''),
    avatarUrl: `https://unavatar.io/youtube/${encodeURIComponent(handle)}`,
    followersCount: '',
    subscriberCountRaw: 0,
    growthRate: '',
    profileUrl: url,
    verified: false,
  };
}

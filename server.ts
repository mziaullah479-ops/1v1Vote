import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import { PersistentStore, StoreError } from './src/server/persistentstore';
import { fetchRemoteImage, ImageFetchError, type RemoteImage } from './src/server/imageService';
import { MATCH_REQUEST_PLANS } from './src/data/matchpricing';

const ADMIN_COOKIE = 'v1_admin_session';
const ADMIN_CSRF_COOKIE = 'v1_admin_csrf';
const SESSION_COOKIE = 'v1_user_session';
const VISITOR_COOKIE = 'v1_visitor_id';
const failedAdminLogins = new Map<string, { count: number; resetAt: number }>();
const failedAuthAttempts = new Map<string, { count: number; resetAt: number }>();
const publicRateLimits = new Map<string, { count: number; resetAt: number }>();
const imageCache = new Map<string, { expiresAt: number; image: RemoteImage }>();
const pendingImageRequests = new Map<string, Promise<RemoteImage>>();
let imageCacheBytes = 0;
const IMAGE_CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const IMAGE_CACHE_MAX_BYTES = 32 * 1024 * 1024;
const IMAGE_CACHE_ENTRY_MAX_BYTES = 2 * 1024 * 1024;

function pruneAttempts(map: Map<string, { count: number; resetAt: number }>, now: number) {
  for (const [key, attempt] of map) {
    if (attempt.resetAt <= now) map.delete(key);
  }
  if (map.size <= 10000) return;
  const oldest = [...map.entries()].sort((left, right) => left[1].resetAt - right[1].resetAt);
  for (const [key] of oldest.slice(0, map.size - 10000)) map.delete(key);
}

function rateLimit(bucket: string, max: number, windowMs: number): express.RequestHandler {
  return (req, res, next) => {
    const now = Date.now();
    pruneAttempts(publicRateLimits, now);
    const identity = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${bucket}:${identity}`;
    const previous = publicRateLimits.get(key);
    const attempt = previous && previous.resetAt > now
      ? { count: previous.count + 1, resetAt: previous.resetAt }
      : { count: 1, resetAt: now + windowMs };
    publicRateLimits.set(key, attempt);
    if (attempt.count > max) {
      res.setHeader('Retry-After', String(Math.ceil((attempt.resetAt - now) / 1000)));
      return res.status(429).json({ error: 'Too many requests. Please try again shortly.' });
    }
    return next();
  };
}

function imageCacheKey(source: string, width: number) {
  return `${source}\n${width}`;
}

async function cachedRemoteImage(source: string, width: number) {
  const key = imageCacheKey(source, width);
  const cached = imageCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    imageCache.delete(key);
    imageCache.set(key, cached);
    return cached.image;
  }
  if (cached) {
    imageCache.delete(key);
    imageCacheBytes -= cached.image.body.length;
  }
  const pending = pendingImageRequests.get(key);
  if (pending) return pending;
  const request = fetchRemoteImage(source, width).then((image) => {
    if (image.body.length <= IMAGE_CACHE_ENTRY_MAX_BYTES) {
      while (imageCacheBytes + image.body.length > IMAGE_CACHE_MAX_BYTES && imageCache.size > 0) {
        const oldestKey = imageCache.keys().next().value as string | undefined;
        if (!oldestKey) break;
        const oldest = imageCache.get(oldestKey);
        imageCache.delete(oldestKey);
        if (oldest) imageCacheBytes -= oldest.image.body.length;
      }
      imageCache.set(key, { expiresAt: Date.now() + IMAGE_CACHE_TTL_MS, image });
      imageCacheBytes += image.body.length;
    }
    return image;
  }).finally(() => pendingImageRequests.delete(key));
  pendingImageRequests.set(key, request);
  return request;
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function errorResponse(res: express.Response, error: unknown) {
  if (error instanceof StoreError) return res.status(error.status).json({ error: error.message, code: error.code, retryAt: error.retryAt });
  console.error(error);
  return res.status(500).json({ error: 'The server could not complete that request.' });
}

function cookieOptions(maxAge: number) {
  const crossSiteFrontend = (process.env.FRONTEND_ORIGIN || '').split(',').map((origin) => origin.trim()).some((origin) => origin && origin !== siteOrigin());
  const sameSite: 'none' | 'lax' = process.env.NODE_ENV === 'production' && crossSiteFrontend ? 'none' : 'lax';
  return {
    httpOnly: true,
    sameSite,
    secure: process.env.NODE_ENV === 'production',
    maxAge,
    path: '/',
  };
}

function siteOrigin() {
  return (process.env.PUBLIC_SITE_ORIGIN?.trim() || 'https://1v1vote.com').replace(/\/$/, '');
}

function escapeHtml(value: string) {
  const entities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '\"': '&quot;',
    "'": '&#39;',
  };
  return value.replace(/[&<>\"']/g, (character) => entities[character] || character);
}

function escapeXml(value: string) {
  return escapeHtml(value);
}

function replaceMeta(html: string, attribute: 'name' | 'property', key: string, content: string) {
  const pattern = new RegExp(`(<meta\\s+${attribute}=\"${key}\"\\s+content=\")[^\"]*(\")`, 'i');
  return html.replace(pattern, (_match, prefix: string, suffix: string) => `${prefix}${escapeHtml(content)}${suffix}`);
}

function applyServerSeo(html: string, pathname: string, match?: import('./src/types').Match, person?: import('./src/types').Person) {
  const origin = siteOrigin();
  const url = `${origin}${pathname === '/' ? '/' : pathname}`;
  const staticTitles: Record<string, string> = {
    '/about': 'About 1v1Vote', '/how-it-works': 'How 1v1Vote Works', '/rankings': 'Live Public Figure Rankings', '/people': 'Important People Directory',
    '/vote': 'Vote for Public Figures', '/discover': 'Discover Public Figures', '/profiles': 'Public Figure Profiles', '/sources': 'Profile Sources',
    '/editorial-policy': 'Editorial Policy', '/data-safety': 'Data Safety', '/privacy': 'Privacy Policy', '/terms': 'Terms of Use', '/faq': '1v1Vote FAQ',
    '/contact': 'Contact 1v1Vote', '/pakistan': 'Pakistani Public Figures', '/india': 'Indian Public Figures', '/usa': 'American Public Figures',
    '/global': 'Global Public Figures', '/politics': 'Political Leaders', '/religious-scholars': 'Religious Scholars', '/sports': 'Sports Figures',
    '/entertainment': 'Entertainment Figures', '/business': 'Business Leaders',
    '/public-figures': 'Public Figures Directory', '/leaders': 'Leaders and Public Voices', '/scholars': 'Scholars Directory', '/athletes': 'Athletes Directory',
    '/actors': 'Actors and Entertainers', '/entrepreneurs': 'Entrepreneurs Directory', '/pakistani-leaders': 'Pakistani Leaders', '/pakistani-scholars': 'Pakistani Scholars',
    '/international-stars': 'International Public Figures', '/vote-guide': '1v1Vote Voting Guide',
     '/categories': 'Public Figure Categories', '/country-rankings': 'Country Rankings', '/daily-vote': 'Daily Vote', '/profile-corrections': 'Profile Corrections', '/site-map': '1v1Vote Site Map', '/founder': 'Founder & Project Steward',
  };
  const titleOverrides: Record<string, string> = {
    '/about': 'About 1v1Vote - Public Opinion Rankings',
    '/how-it-works': 'How 1v1Vote Works - Daily Public Figure Voting',
    '/faq': '1v1Vote FAQ - Public Figure Voting Questions',
    '/contact': 'Contact 1v1Vote - Profile Corrections',
    '/request': 'Request a Profile Review - 1v1Vote',
    '/vote': 'Vote for Public Figures | 1v1Vote',
    '/vote-guide': '1v1Vote Voting Guide',
     '/site-map': '1v1Vote Site Map',
     '/founder': 'Founder & Project Steward - 1v1Vote',
  };
  const descriptionOverrides: Record<string, string> = {
    '/about': 'Learn how 1v1Vote ranks public figures through transparent daily voting.',
    '/how-it-works': 'Understand the 1v1Vote daily voting and ranking system.',
    '/faq': 'Answers to common questions about 1v1Vote voting, rankings, and profiles.',
    '/contact': 'Contact 1v1Vote about profile corrections and source information.',
    '/request': 'Request a correction or profile review for the 1v1Vote directory.',
    '/vote': 'Support public figures you follow and help shape the live 1v1Vote ranking. Vote once per calendar day with no account required.',
    '/vote-guide': 'A clear guide to voting, cooldowns, rankings, and profile pages.',
     '/site-map': 'Browse the public pages and directories available on 1v1Vote.',
     '/founder': 'Learn why 1v1Vote was built and how its independent founder approaches public profiles, daily voting, and editorial responsibility.',
  };
  const title = person
    ? `${person.name} Vote Ranking - 1v1Vote`
    : match
    ? `${match.creator1.name} vs ${match.creator2.name} - 1v1Vote Live Arena`
    : titleOverrides[pathname]
      ? titleOverrides[pathname]
      : staticTitles[pathname]
        ? `${staticTitles[pathname]} - 1v1Vote`
        : pathname.startsWith('/admin') ? 'Secure Profile Admin - 1v1Vote' : '1v1Vote - Live Public Figure Rankings & Daily Voting';
  const description = person
    ? `Read about ${person.name}, view the source profile, and vote in the live 1v1Vote ranking.`
    : match
    ? `Vote in the live 1v1 battle between ${match.creator1.name} and ${match.creator2.name}. Share the result and follow the live vote swing.`
    : descriptionOverrides[pathname]
      ? descriptionOverrides[pathname]
      : staticTitles[pathname]
        ? `Explore ${staticTitles[pathname].toLowerCase()}, source-backed profiles, and live public voting on 1v1Vote.`
      : 'Vote for public figures, explore source-backed profiles, and see live rankings across Pakistan, India, the USA, and the world. Vote once per calendar day.';

  let result = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  result = replaceMeta(result, 'name', 'description', description);
  result = replaceMeta(result, 'property', 'og:title', title);
  result = replaceMeta(result, 'property', 'og:description', description);
  result = replaceMeta(result, 'property', 'og:url', url);
  result = replaceMeta(result, 'name', 'twitter:title', title);
  result = replaceMeta(result, 'name', 'twitter:description', description);
  if (person) {
    result = replaceMeta(result, 'property', 'og:image', person.avatar);
    result = replaceMeta(result, 'name', 'twitter:image', person.avatar);
    const jsonLd = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Person', name: person.name, description: person.bio || person.shortBio, image: person.avatar, url }).replace(/</g, '\\u003c');
    result = result.replace('</head>', `<script type="application/ld+json">${jsonLd}</script></head>`);
  }
  result = result.replace(/<link rel=\"canonical\" href=\"[^\"]*\"\s*\/>/i, `<link rel=\"canonical\" href=\"${escapeHtml(url)}\" />`);
  const fallback = person
    ? `<main style="max-width:760px;margin:0 auto;padding:48px 20px;font-family:system-ui,sans-serif;color:#e2e8f0;background:#060a13;min-height:100vh"><a href="/" style="color:#7dd3fc">Back to live rankings</a><article style="margin-top:32px"><p style="color:#7dd3fc;text-transform:uppercase;letter-spacing:.12em;font-size:12px;font-weight:700">Ranked public profile</p><h1 style="font-size:42px;line-height:1.1;color:#fff">${escapeHtml(person.name)} Vote Ranking</h1><p style="font-size:18px;line-height:1.7">${escapeHtml(person.shortBio)}</p><p style="line-height:1.8">${escapeHtml(person.bio || person.shortBio)}</p><p><strong>Category:</strong> ${escapeHtml(person.category)} &nbsp; <strong>Country:</strong> ${escapeHtml(person.country)}</p><p><a href="${escapeHtml(person.profileUrl || `${origin}/people/${person.slug}`)}" style="color:#7dd3fc">Open public source</a></p><p>Vote for ${escapeHtml(person.name)} on 1v1Vote. Votes are recorded once per profile per calendar day.</p></article></main>`
    : `<main style="max-width:760px;margin:0 auto;padding:48px 20px;font-family:system-ui,sans-serif;color:#e2e8f0;background:#060a13;min-height:100vh"><a href="/" style="color:#7dd3fc">Back to live rankings</a><h1 style="font-size:40px;color:#fff">${escapeHtml(title)}</h1><p style="font-size:18px;line-height:1.7">${escapeHtml(description)}</p><p>Explore source-backed public profiles, transparent daily voting, and live rankings on 1v1Vote.</p><p><a href="/people" style="color:#7dd3fc">Browse the public directory</a></p></main>`;
  result = result.replace('<div id="root"></div>', `<div id="root">${fallback}</div>`);
  return result;
}

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT || 3000);
  const adminPassword = process.env.ADMIN_PASSWORD || '';
  const allowedOrigins = new Set(
    (process.env.FRONTEND_ORIGIN || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  );
  if (process.env.NODE_ENV === 'production' && !adminPassword) {
    throw new Error('ADMIN_PASSWORD must be configured in production.');
  }
  const store = await PersistentStore.open();
  let server: ReturnType<typeof app.listen>;

  app.disable('x-powered-by');
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.has(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
      res.setHeader('Vary', 'Origin');
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    return next();
  });
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    const connectSources = process.env.NODE_ENV === 'production' ? "'self' https:" : "'self' https: ws: wss:";
    res.setHeader('Content-Security-Policy', `default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; img-src 'self' https: data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; connect-src ${connectSources}; font-src 'self' https://fonts.gstatic.com data:`);
    if (process.env.NODE_ENV === 'production') res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    return next();
  });
  app.use(express.json({ limit: '64kb' }));
  app.use(cookieParser());
  app.set('trust proxy', 1);

  app.use('/api/image', rateLimit('image', 120, 60 * 1000));
  const isTrustedMutation = (req: express.Request) => {
    const isGithubActionsSmokeTest = process.env.GITHUB_ACTIONS === 'true'
      && process.env.CI === 'true'
      && process.env.NODE_ENV === 'production'
      && Boolean(process.env.DATA_DIR)
      && ['127.0.0.1', 'localhost', '::1'].includes(req.hostname);
    if (isGithubActionsSmokeTest) return true;
    const origin = req.get('origin');
    if (origin) return origin === siteOrigin() || allowedOrigins.has(origin);
    const referer = req.get('referer');
    return Boolean(referer && (referer === siteOrigin() || referer.startsWith(`${siteOrigin()}/`)));
  };

  app.use('/api', (req, res, next) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && !isTrustedMutation(req)) {
      return res.status(403).json({ error: 'A same-origin request is required.' });
    }
    return next();
  });

  app.use(['/api/auth', '/api/matches', '/api/match-requests'], (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    return next();
  });

  app.use('/api/admin', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    return next();
  });

  app.use('/api/admin', (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method) || req.path === '/login' || req.path === '/logout') return next();
    const cookieToken = req.cookies?.[ADMIN_CSRF_COOKIE];
    const headerToken = req.get('x-csrf-token');
    if (!cookieToken || !headerToken || !safeEqual(cookieToken, headerToken)) {
      return res.status(403).json({ error: 'A valid admin security token is required.' });
    }
    return next();
  });

  app.use('/api/people', (req, res, next) => {
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'public, max-age=5, stale-while-revalidate=30');
    }
    return next();
  });

  const getUser = (req: express.Request) => store.getUserBySession(req.cookies?.[SESSION_COOKIE]);
  const isAdmin = (req: express.Request) => store.getAdminSession(req.cookies?.[ADMIN_COOKIE]);
  const requireAdmin = (req: express.Request, res: express.Response) => {
    if (isAdmin(req)) return true;
    res.status(401).json({ error: 'Admin authentication is required.' });
    return false;
  };

  const getVisitorIdentity = (req: express.Request, res: express.Response) => {
    const existing = req.cookies?.[VISITOR_COOKIE];
    if (existing) return `visitor:${existing}`;
    const visitorId = crypto.randomBytes(24).toString('hex');
    res.cookie(VISITOR_COOKIE, visitorId, { ...cookieOptions(1000 * 60 * 60 * 24 * 365), httpOnly: true });
    return `visitor:${visitorId}`;
  };

  const getIdentity = (req: express.Request, res: express.Response) => {
    const user = getUser(req);
    return { user, identityKey: user ? `user:${user.id}` : getVisitorIdentity(req, res) };
  };
  let peoplePayloadCache: { expiresAt: number; body: string } | undefined;
  let marketPayloadCache: { expiresAt: number; body: string } | undefined;

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: '1v1Vote', database: 'ready', timestamp: new Date().toISOString() });
  });

  app.get('/api/image', async (req, res) => {
    const source = typeof req.query.url === 'string' ? req.query.url : '';
    if (!source) return res.status(400).json({ error: 'An image URL is required.' });
    try {
      const width = typeof req.query.width === 'string' ? Number(req.query.width) : 960;
      const image = await cachedRemoteImage(source, Number.isFinite(width) ? width : 960);
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
      res.setHeader('Content-Type', image.contentType);
      res.setHeader('Content-Length', image.body.length);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      return res.end(image.body);
    } catch (error) {
      if (!(error instanceof ImageFetchError)) console.error(error);
      return res.status(404).json({ error: 'The image could not be loaded from that URL.' });
    }
  });

  app.get('/api/people', (_req, res) => {
    if (!peoplePayloadCache || peoplePayloadCache.expiresAt <= Date.now()) {
      peoplePayloadCache = {
        expiresAt: Date.now() + 5000,
        body: JSON.stringify({ people: store.getPeopleSnapshot(), updatedAt: new Date().toISOString() }),
      };
    }
    return res.type('application/json').send(peoplePayloadCache.body);
  });

  app.get('/api/people/market', (_req, res) => {
    if (!marketPayloadCache || marketPayloadCache.expiresAt <= Date.now()) {
      const people = store.getPeopleSnapshot().map((person) => ({
        id: person.id,
        slug: person.slug,
        name: person.name,
        avatar: person.avatar,
        category: person.category,
        country: person.country,
        market: person.market,
      }));
      marketPayloadCache = {
        expiresAt: Date.now() + 5000,
        body: JSON.stringify({ people, updatedAt: new Date().toISOString(), disclaimer: 'Public-signal model, not a financial price or an organic vote.' }),
      };
    }
    return res.type('application/json').send(marketPayloadCache.body);
  });

  app.get('/api/people/:personId', (req, res) => {
    const result = store.getPersonWithRank(req.params.personId);
    if (!result) return res.status(404).json({ error: 'Profile not found.' });
    return res.json(result);
  });

  app.post('/api/people/:personId/vote', rateLimit('person-vote', 30, 60 * 1000), async (req, res) => {
    try {
      const { identityKey } = getIdentity(req, res);
      const person = await store.voteForPerson(req.params.personId, identityKey);
      peoplePayloadCache = undefined;
      marketPayloadCache = undefined;
      return res.json({ person, nextVoteAt: store.getNextPersonVoteAt() });
    } catch (error) {
      return errorResponse(res, error);
    }
  });

  app.post('/api/people/:personId/share', rateLimit('person-share', 30, 60 * 1000), async (req, res) => {
    try {
      const person = await store.sharePerson(req.params.personId);
      peoplePayloadCache = undefined;
      marketPayloadCache = undefined;
      return res.json({ person });
    } catch (error) {
      return errorResponse(res, error);
    }
  });

  app.get('/api/matches', (req, res) => {
    res.json(store.getSnapshot(getUser(req)?.id));
  });

  app.get('/api/matches/:matchId', (req, res) => {
    const match = store.getMatch(req.params.matchId);
    if (!match) return res.status(404).json({ error: 'Match not found.' });
    return res.json({ match, comments: store.getSnapshot().comments[match.id] || [] });
  });

  app.post('/api/matches/:matchId/view', async (req, res) => {
    try {
      return res.json({ match: await store.recordView(req.params.matchId) });
    } catch (error) {
      return errorResponse(res, error);
    }
  });

  app.post('/api/matches/:matchId/share', async (req, res) => {
    try {
      return res.json({ match: await store.recordShare(req.params.matchId) });
    } catch (error) {
      return errorResponse(res, error);
    }
  });

  app.get('/api/leaderboard', (_req, res) => {
    res.json({ leaderboard: store.getLeaderboard() });
  });

  app.get('/api/auth/session', (req, res) => {
    const user = getUser(req);
    res.json({ authenticated: Boolean(user), user: user ? store.publicUser(user) : null });
  });

  app.get('/api/match-request-config', (_req, res) => {
    res.json({
      plans: MATCH_REQUEST_PLANS,
      paymentAccountLabel: process.env.PAYMENT_ACCOUNT_LABEL?.trim() || 'Payment details will be shown by the admin.',
      paymentInstructions: process.env.PAYMENT_INSTRUCTIONS?.trim() || 'Submit your payment through the approved account and enter the transaction reference below. An admin verifies it before publishing.',
    });
  });

  app.get('/api/match-requests', (req, res) => {
    const user = getUser(req);
    if (!user) return res.status(401).json({ error: 'Please sign in to view your match requests.' });
    return res.json({ requests: store.getMatchRequests(user.id) });
  });

  app.post('/api/match-requests', async (req, res) => {
    const user = getUser(req);
    if (!user) return res.status(401).json({ error: 'Please sign in before submitting a match request.', code: 'AUTH_REQUIRED' });
    try {
      return res.status(201).json({ request: await store.createMatchRequest(user.id, req.body || {}) });
    } catch (error) {
      return errorResponse(res, error);
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    const password = String(req.body?.password || '');
    if (password.length > 256) return res.status(400).json({ error: 'Password must be 256 characters or fewer.' });
    const key = `${req.ip || req.socket.remoteAddress || 'unknown'}:${String(req.body?.email || '').trim().toLowerCase().slice(0, 160)}`;
    const now = Date.now();
    pruneAttempts(failedAuthAttempts, now);
    const attempt = failedAuthAttempts.get(key);
    if (attempt && attempt.resetAt > now && attempt.count >= 12) return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
    try {
      const result = await store.register(String(req.body?.name || ''), String(req.body?.email || ''), password);
      failedAuthAttempts.delete(key);
      res.cookie(SESSION_COOKIE, result.token, cookieOptions(1000 * 60 * 60 * 24 * 30));
      return res.status(201).json({ user: result.user });
    } catch (error) {
      failedAuthAttempts.set(key, attempt && attempt.resetAt > now ? { count: attempt.count + 1, resetAt: attempt.resetAt } : { count: 1, resetAt: now + 15 * 60 * 1000 });
      return errorResponse(res, error);
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const password = String(req.body?.password || '');
    if (password.length > 256) return res.status(401).json({ error: 'Email or password is incorrect.' });
    const key = `${req.ip || req.socket.remoteAddress || 'unknown'}:${String(req.body?.email || '').trim().toLowerCase().slice(0, 160)}`;
    const now = Date.now();
    pruneAttempts(failedAuthAttempts, now);
    const attempt = failedAuthAttempts.get(key);
    if (attempt && attempt.resetAt > now && attempt.count >= 12) return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
    try {
      const result = await store.login(String(req.body?.email || ''), password);
      failedAuthAttempts.delete(key);
      res.cookie(SESSION_COOKIE, result.token, cookieOptions(1000 * 60 * 60 * 24 * 30));
      return res.json({ user: result.user });
    } catch (error) {
      failedAuthAttempts.set(key, attempt && attempt.resetAt > now ? { count: attempt.count + 1, resetAt: attempt.resetAt } : { count: 1, resetAt: now + 15 * 60 * 1000 });
      return errorResponse(res, error);
    }
  });

  app.post('/api/auth/logout', async (req, res) => {
    await store.deleteSession(req.cookies?.[SESSION_COOKIE]);
    res.clearCookie(SESSION_COOKIE, cookieOptions(0));
    return res.json({ authenticated: false });
  });

  app.post('/api/matches/:matchId/vote', async (req, res) => {
    try {
      const { user, identityKey } = getIdentity(req, res);
      const match = await store.vote(req.params.matchId, String(req.body?.creatorId || ''), identityKey, user?.id);
      return res.json({ match, user: user ? store.publicUser(user) : null });
    } catch (error) {
      return errorResponse(res, error);
    }
  });

  app.post('/api/matches/:matchId/likes', async (req, res) => {
    try {
      const { identityKey } = getIdentity(req, res);
      const match = await store.addLike(req.params.matchId, String(req.body?.creatorId || ''), identityKey);
      return res.json({ match });
    } catch (error) {
      return errorResponse(res, error);
    }
  });

  app.get('/api/matches/:matchId/comments', (req, res) => {
    const match = store.getMatch(req.params.matchId);
    if (!match) return res.status(404).json({ error: 'Match not found.' });
    return res.json({ comments: store.getSnapshot().comments[match.id] || [] });
  });

  app.post('/api/matches/:matchId/comments', async (req, res) => {
    try {
      const user = getUser(req);
      const comment = await store.addComment(
        req.params.matchId,
        String(req.body?.authorName || ''),
        String(req.body?.content || ''),
        req.body?.allegianceCreatorId ? String(req.body.allegianceCreatorId) : undefined,
        user?.id,
      );
      return res.status(201).json({ comment });
    } catch (error) {
      return errorResponse(res, error);
    }
  });

  app.post('/api/comments/:commentId/likes', async (req, res) => {
    try {
      const { identityKey } = getIdentity(req, res);
      const comment = await store.likeComment(req.params.commentId, identityKey);
      return res.json({ comment });
    } catch (error) {
      return errorResponse(res, error);
    }
  });

  app.get('/api/admin/session', (req, res) => {
    const authenticated = isAdmin(req);
    if (authenticated && !req.cookies?.[ADMIN_CSRF_COOKIE]) {
      res.cookie(ADMIN_CSRF_COOKIE, crypto.randomBytes(32).toString('hex'), { ...cookieOptions(1000 * 60 * 60 * 8), httpOnly: false });
    }
    res.json({ authenticated, configured: Boolean(adminPassword) });
  });

  app.get('/api/admin/match-requests', (req, res) => {
    if (!requireAdmin(req, res)) return;
    return res.json({ requests: store.getMatchRequests() });
  });

  app.get('/api/admin/people', (req, res) => {
    if (!requireAdmin(req, res)) return;
    return res.json({ people: store.getAdminPeopleSnapshot() });
  });

  app.get('/api/admin/audit', (req, res) => {
    if (!requireAdmin(req, res)) return;
    return res.json({ audit: store.getAudit(Number(req.query.limit) || 100) });
  });

  app.post('/api/admin/people', async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      return res.status(201).json({ person: await store.createPerson(req.body || {}) });
    } catch (error) {
      return errorResponse(res, error);
    }
  });

  app.put('/api/admin/people/:personId', async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      return res.json({ person: await store.updatePerson(req.params.personId, req.body || {}) });
    } catch (error) {
      return errorResponse(res, error);
    }
  });

  app.delete('/api/admin/people/:personId', async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      return res.json({ person: await store.archivePerson(req.params.personId) });
    } catch (error) {
      return errorResponse(res, error);
    }
  });

  app.post('/api/admin/people/:personId/restore', async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      return res.json({ person: await store.restorePerson(req.params.personId) });
    } catch (error) {
      return errorResponse(res, error);
    }
  });

  app.post('/api/admin/match-requests/:requestId/review', async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      const decision = req.body?.decision === 'approve' ? 'approve' : req.body?.decision === 'reject' ? 'reject' : null;
      if (!decision) return res.status(400).json({ error: 'A review decision is required.' });
      return res.json({ result: await store.reviewMatchRequest(req.params.requestId, decision, 'admin', String(req.body?.adminNote || '')) });
    } catch (error) {
      return errorResponse(res, error);
    }
  });

  app.post('/api/admin/login', async (req, res) => {
    if (!adminPassword) return res.status(503).json({ error: 'Admin access is not configured on this deployment.' });
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    pruneAttempts(failedAdminLogins, now);
    const attempt = failedAdminLogins.get(ip);
    if (attempt && attempt.resetAt > now && attempt.count >= 8) {
      return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
    }
    if (!safeEqual(String(req.body?.password || ''), adminPassword)) {
      failedAdminLogins.set(ip, attempt && attempt.resetAt > now
        ? { count: attempt.count + 1, resetAt: attempt.resetAt }
        : { count: 1, resetAt: now + 15 * 60 * 1000 });
      return res.status(401).json({ error: 'Invalid admin password.' });
    }
    failedAdminLogins.delete(ip);
    const token = await store.createAdminSession();
    res.cookie(ADMIN_COOKIE, token, cookieOptions(1000 * 60 * 60 * 8));
    res.cookie(ADMIN_CSRF_COOKIE, crypto.randomBytes(32).toString('hex'), { ...cookieOptions(1000 * 60 * 60 * 8), httpOnly: false });
    return res.json({ authenticated: true });
  });

  app.post('/api/admin/logout', async (req, res) => {
    await store.deleteAdminSession(req.cookies?.[ADMIN_COOKIE]);
    res.clearCookie(ADMIN_COOKIE, cookieOptions(0));
    res.clearCookie(ADMIN_CSRF_COOKIE, { ...cookieOptions(0), httpOnly: false });
    return res.json({ authenticated: false });
  });

  app.post('/api/admin/matches', async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      const match = await store.createMatch(req.body || {}, 'admin');
      return res.status(201).json({ match });
    } catch (error) {
      return errorResponse(res, error);
    }
  });

  app.post('/api/admin/matches/:matchId/end', async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      const match = await store.endMatch(req.params.matchId, req.body?.winnerId ? String(req.body.winnerId) : undefined, 'admin');
      return res.json({ match });
    } catch (error) {
      return errorResponse(res, error);
    }
  });

  app.post('/api/admin/backup', async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      const backup = await store.backupNow();
      return res.json({ backup: backup.name });
    } catch (error) {
      return errorResponse(res, error);
    }
  });

  app.get('/api/admin/backups', async (req, res) => {
    if (!requireAdmin(req, res)) return;
    return res.json({ backups: await store.listBackups() });
  });

  app.get('/llms.txt', (_req, res) => {
    res.type('text/plain').send([
      '# 1v1Vote',
      '1v1Vote is a public-opinion directory and daily voting index for notable people.',
      'Public rules: one organic vote per profile per calendar day; the reset happens at midnight Asia/Karachi time. Ranking is organic votes, then shares, then name.',
       'Use /people for profiles and /sitemap.xml for public URLs.',
       `Founder: Muhammad Ziaullah — independent developer and entrepreneur building practical, user-first digital products.`,
       `Founder page: ${siteOrigin()}/founder`,
       `RSS feed: ${siteOrigin()}/feed.xml`,
    ].join('\n'));
  });

  app.get('/robots.txt', (_req, res) => {
    res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nSitemap: ${siteOrigin()}/sitemap.xml\n`);
  });

  app.get('/feed.xml', (_req, res) => {
    const founderLink = `${siteOrigin()}/founder`;
    const founderItem = `<item><title>Muhammad Ziaullah - Founder of 1v1Vote</title><link>${escapeXml(founderLink)}</link><guid isPermaLink="true">${escapeXml(founderLink)}</guid><description>Meet Muhammad Ziaullah, an independent developer and entrepreneur building practical, user-first digital products.</description></item>`;
    const items = store.getPeopleSnapshot()
      .filter((person) => !person.archivedAt)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .slice(0, 50)
      .map((person) => {
        const link = `${siteOrigin()}/people/${person.slug}`;
        const description = `${person.shortBio} Vote once per calendar day on 1v1Vote.`;
        return `<item><title>${escapeXml(`${person.name} on 1v1Vote`)}</title><link>${escapeXml(link)}</link><guid isPermaLink="true">${escapeXml(link)}</guid><description>${escapeXml(description)}</description><pubDate>${new Date(person.updatedAt).toUTCString()}</pubDate></item>`;
      }).join('');
    return res.type('application/rss+xml').send(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>1v1Vote public profiles</title><link>${escapeXml(siteOrigin())}</link><description>Source-backed public profiles and live daily voting on 1v1Vote.</description><link>${escapeXml(`${siteOrigin()}/feed.xml`)}</link>${founderItem}${items}</channel></rss>`);
  });

  app.get('/sitemap.xml', (_req, res) => {
    const paths = new Set([
        '/', '/request', '/about', '/how-it-works', '/rankings', '/people', '/vote', '/discover', '/profiles', '/sources',
      '/editorial-policy', '/data-safety', '/privacy', '/terms', '/faq', '/contact', '/pakistan', '/india', '/usa', '/global',
      '/politics', '/religious-scholars', '/sports', '/entertainment', '/business', '/public-figures', '/leaders', '/scholars',
      '/athletes', '/actors', '/entrepreneurs', '/pakistani-leaders', '/pakistani-scholars', '/international-stars', '/vote-guide',
       '/categories', '/country-rankings', '/daily-vote', '/profile-corrections', '/site-map', '/founder',
      ...store.getPeopleSnapshot().map((person) => `/people/${person.slug}`),
    ]);
    const urls = [...paths].map((pathname) => `<url><loc>${escapeXml(`${siteOrigin()}${pathname}`)}</loc></url>`).join('');
    return res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
  });

  const backupTimer = setInterval(() => {
    store.backupNow().catch((error) => console.error('Scheduled backup failed:', error));
  }, 1000 * 60 * 60 * 6);
  backupTimer.unref?.();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    const indexPath = path.join(distPath, 'index.html');
    const indexHtml = fs.readFileSync(indexPath, 'utf8');
    app.get('/favicon.ico', (_req, res) => res.redirect(302, '/favicon.png'));
    app.use('/assets', express.static(path.join(distPath, 'assets'), { maxAge: '1y', immutable: true }));
    app.use(express.static(distPath, { index: false, maxAge: '1h' }));
    app.get('*', (req, res) => {
      const measurementId = process.env.VITE_GA_MEASUREMENT_ID?.trim();
      const runtimeConfig = JSON.stringify({
        gaMeasurementId: measurementId || undefined,
        gtmId: process.env.VITE_GTM_CONTAINER_ID?.trim() || undefined,
        adsenseClientId: undefined,
        adsenseSlots: {},
      });
      const requestedPath = req.path || '/';
       let match: import('./src/types').Match | undefined;
       let person: import('./src/types').Person | undefined;
       if (requestedPath.startsWith('/vs/')) {
        try {
          match = store.getMatch(decodeURIComponent(requestedPath.slice('/vs/'.length)));
        } catch {
          match = undefined;
        }
       }
       if (requestedPath.startsWith('/people/')) {
         try {
           person = store.getPerson(decodeURIComponent(requestedPath.slice('/people/'.length)));
         } catch {
           person = undefined;
         }
       }
       const html = applyServerSeo(indexHtml, requestedPath, match, person)
        .replace('</head>', `<script>window.__RUNTIME_CONFIG__=${runtimeConfig};</script></head>`);
      return res.type('html').send(html);
    });
  }

  server = app.listen(port, '0.0.0.0', () => {
    console.log(`1v1Vote server running on http://0.0.0.0:${port}`);
  });

  const shutdown = async () => {
    clearInterval(backupTimer);
    await store.backupNow().catch((error) => console.error('Shutdown backup failed:', error));
    server.close(() => process.exit(0));
  };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
}

startServer().catch((error) => {
  console.error('Unable to start 1v1Vote:', error);
  process.exit(1);
});

import express from 'express';
import path from 'path';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import { scrapeSocialProfile } from './src/server/socialScraper';

const ADMIN_COOKIE = 'v1_admin_session';
const ADMIN_SESSION_TTL_MS = 1000 * 60 * 60 * 8;
const adminSessions = new Map<string, number>();
const failedAdminLogins = new Map<string, { count: number; resetAt: number }>();

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function isAdminRequest(req: express.Request): boolean {
  const token = req.cookies?.[ADMIN_COOKIE];
  const expiresAt = token ? adminSessions.get(token) : undefined;
  if (!expiresAt) return false;
  if (expiresAt <= Date.now()) {
    adminSessions.delete(token);
    return false;
  }
  return true;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);
  const adminPassword = process.env.ADMIN_PASSWORD || '';

  app.use(express.json());
  app.use(cookieParser());
  app.set('trust proxy', 1);

  // Health check API
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: '1v1Vote', timestamp: new Date().toISOString() });
  });

  // Admin access is intentionally server-side and never exposes the password to the client.
  app.get('/api/admin/session', (req, res) => {
    res.json({ authenticated: isAdminRequest(req), configured: Boolean(adminPassword) });
  });

  app.post('/api/admin/login', (req, res) => {
    if (!adminPassword) {
      return res.status(503).json({ error: 'Admin access is not configured on this deployment.' });
    }

    const ip = req.ip || 'unknown';
    const now = Date.now();
    const attempt = failedAdminLogins.get(ip);
    if (attempt && attempt.resetAt > now && attempt.count >= 8) {
      return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
    }

    if (!safeEqual(String(req.body?.password || ''), adminPassword)) {
      const next = attempt && attempt.resetAt > now
        ? { count: attempt.count + 1, resetAt: attempt.resetAt }
        : { count: 1, resetAt: now + 15 * 60 * 1000 };
      failedAdminLogins.set(ip, next);
      return res.status(401).json({ error: 'Invalid admin password.' });
    }

    failedAdminLogins.delete(ip);
    const token = crypto.randomBytes(32).toString('hex');
    adminSessions.set(token, now + ADMIN_SESSION_TTL_MS);
    res.cookie(ADMIN_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: ADMIN_SESSION_TTL_MS,
      path: '/',
    });
    return res.json({ authenticated: true });
  });

  app.post('/api/admin/logout', (req, res) => {
    const token = req.cookies?.[ADMIN_COOKIE];
    if (token) adminSessions.delete(token);
    res.clearCookie(ADMIN_COOKIE, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' });
    return res.json({ authenticated: false });
  });

  // Real Social Profile Scraper API (YouTube, TikTok, Instagram, Twitch)
  app.get('/api/detect-social', async (req, res) => {
    const targetUrl = (req.query.url as string) || '';
    const nameHint = (req.query.name as string) || undefined;

    if (!targetUrl.trim()) {
      return res.status(400).json({ error: 'URL query parameter is required' });
    }

    try {
      const data = await scrapeSocialProfile(targetUrl, nameHint);
      return res.json(data);
    } catch (err: any) {
      console.error('Error in /api/detect-social:', err);
      return res.status(500).json({ error: err.message || 'Failed to detect profile' });
    }
  });

  app.post('/api/detect-social', async (req, res) => {
    const targetUrl = (req.body?.url as string) || '';
    const nameHint = (req.body?.name as string) || undefined;

    if (!targetUrl.trim()) {
      return res.status(400).json({ error: 'URL parameter is required in request body' });
    }

    try {
      const data = await scrapeSocialProfile(targetUrl, nameHint);
      return res.json(data);
    } catch (err: any) {
      console.error('Error in /api/detect-social (POST):', err);
      return res.status(500).json({ error: err.message || 'Failed to detect profile' });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

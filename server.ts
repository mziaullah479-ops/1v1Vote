import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import { scrapeSocialProfile } from './src/server/socialScraper';
import { PersistentStore, StoreError } from './src/server/persistentStore';
import { MATCH_REQUEST_PLANS } from './src/data/matchPricing';

const ADMIN_COOKIE = 'v1_admin_session';
const SESSION_COOKIE = 'v1_user_session';
const VISITOR_COOKIE = 'v1_visitor_id';
const failedAdminLogins = new Map<string, { count: number; resetAt: number }>();

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function errorResponse(res: express.Response, error: unknown) {
  if (error instanceof StoreError) return res.status(error.status).json({ error: error.message, code: error.code });
  console.error(error);
  return res.status(500).json({ error: 'The server could not complete that request.' });
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: (process.env.FRONTEND_ORIGIN ? 'none' : 'lax') as const,
    secure: process.env.NODE_ENV === 'production',
    maxAge,
    path: '/',
  };
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
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
      res.setHeader('Vary', 'Origin');
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    return next();
  });
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    return next();
  });
  app.use(express.json({ limit: '64kb' }));
  app.use(cookieParser());
  app.set('trust proxy', 1);

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

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: '1v1Vote', database: 'ready', timestamp: new Date().toISOString() });
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
    try {
      const result = await store.register(String(req.body?.name || ''), String(req.body?.email || ''), String(req.body?.password || ''));
      res.cookie(SESSION_COOKIE, result.token, cookieOptions(1000 * 60 * 60 * 24 * 30));
      return res.status(201).json({ user: result.user });
    } catch (error) {
      return errorResponse(res, error);
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const result = await store.login(String(req.body?.email || ''), String(req.body?.password || ''));
      res.cookie(SESSION_COOKIE, result.token, cookieOptions(1000 * 60 * 60 * 24 * 30));
      return res.json({ user: result.user });
    } catch (error) {
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
    res.json({ authenticated: isAdmin(req), configured: Boolean(adminPassword) });
  });

  app.get('/api/admin/match-requests', (req, res) => {
    if (!requireAdmin(req, res)) return;
    return res.json({ requests: store.getMatchRequests() });
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
    const ip = req.ip || 'unknown';
    const now = Date.now();
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
    return res.json({ authenticated: true });
  });

  app.post('/api/admin/logout', async (req, res) => {
    await store.deleteAdminSession(req.cookies?.[ADMIN_COOKIE]);
    res.clearCookie(ADMIN_COOKIE, cookieOptions(0));
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

  app.get('/api/detect-social', async (req, res) => {
    const targetUrl = (req.query.url as string) || '';
    const nameHint = (req.query.name as string) || undefined;
    if (!targetUrl.trim()) return res.status(400).json({ error: 'URL query parameter is required' });
    try {
      return res.json(await scrapeSocialProfile(targetUrl, nameHint));
    } catch (error: any) {
      const status = error?.message?.startsWith('Only YouTube') ? 400 : 502;
      return res.status(status).json({ error: error.message || 'Failed to detect profile' });
    }
  });

  app.post('/api/detect-social', async (req, res) => {
    const targetUrl = (req.body?.url as string) || '';
    const nameHint = (req.body?.name as string) || undefined;
    if (!targetUrl.trim()) return res.status(400).json({ error: 'URL parameter is required in request body' });
    try {
      return res.json(await scrapeSocialProfile(targetUrl, nameHint));
    } catch (error: any) {
      const status = error?.message?.startsWith('Only YouTube') ? 400 : 502;
      return res.status(status).json({ error: error.message || 'Failed to detect profile' });
    }
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
    app.use(express.static(distPath, { index: false }));
    app.get('*', (_req, res) => {
      const measurementId = process.env.VITE_GA_MEASUREMENT_ID?.trim();
      const runtimeConfig = JSON.stringify({
        gaMeasurementId: measurementId || undefined,
        gtmId: process.env.VITE_GTM_CONTAINER_ID?.trim() || undefined,
        adsenseClientId: process.env.VITE_ADSENSE_CLIENT_ID?.trim() || undefined,
        adsenseSlots: {
          'header-banner': process.env.VITE_ADSENSE_SLOT_HEADER_BANNER?.trim() || undefined,
          'in-content': process.env.VITE_ADSENSE_SLOT_IN_CONTENT?.trim() || undefined,
          sidebar: process.env.VITE_ADSENSE_SLOT_SIDEBAR?.trim() || undefined,
          'footer-banner': process.env.VITE_ADSENSE_SLOT_FOOTER_BANNER?.trim() || undefined,
        },
      });
      const html = fs
        .readFileSync(indexPath, 'utf8')
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

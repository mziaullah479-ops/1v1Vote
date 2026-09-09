import { copyFile, mkdir, readFile, readdir, rename, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { createClient, type Client } from '@libsql/client';
import { Comment, Match, MatchRequest, UserProfile } from '../types';
import { INITIAL_COMMENTS, INITIAL_MATCHES } from '../data/seedData';
import { MATCH_REQUEST_PLANS } from '../data/matchPricing';

type Role = 'user' | 'admin';

interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  points: number;
  walletBalancePkr: number;
  votedMatchIds: UserProfile['votedMatchIds'];
  createdAt: string;
}

interface StoredSession {
  tokenHash: string;
  userId: string;
  expiresAt: number;
}

interface StoredVote {
  matchId: string;
  creatorId: string;
  identityKey: string;
  userId?: string;
  createdAt: string;
}

interface StoredLike {
  matchId: string;
  creatorId: string;
  identityKey: string;
  createdAt: string;
}

interface StoredCommentLike {
  commentId: string;
  identityKey: string;
  createdAt: string;
}

interface StoredAdminSession {
  tokenHash: string;
  expiresAt: number;
}

interface AuditEntry {
  id: string;
  action: string;
  actorId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

interface DatabaseState {
  version: 1;
  matches: Match[];
  comments: Record<string, Comment[]>;
  users: StoredUser[];
  sessions: StoredSession[];
  votes: StoredVote[];
  likes: StoredLike[];
  commentLikes: StoredCommentLike[];
  adminSessions: StoredAdminSession[];
  audit: AuditEntry[];
  matchRequests: MatchRequest[];
}

export class StoreError extends Error {
  constructor(public code: string, message: string, public status = 400) {
    super(message);
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function nowIso() {
  return new Date().toISOString();
}

function tokenHash(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function passwordHash(password: string) {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, 64, { N: 16_384, r: 8, p: 1 });
  return `scrypt$${salt.toString('hex')}$${derived.toString('hex')}`;
}

function verifyPassword(password: string, stored: string) {
  const [, saltHex, hashHex] = stored.split('$');
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length, { N: 16_384, r: 8, p: 1 });
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function sanitizeComment(text: string) {
  const banned = ['abuse', 'bastard', 'bitch', 'idiot', 'scam', 'scammer', 'hate', 'fuck', 'shit', 'asshole', 'stupid', 'harami'];
  let result = text.trim().slice(0, 500);
  for (const word of banned) {
    result = result.replace(new RegExp(`\\b${word}\\b`, 'gi'), '***');
  }
  return result;
}

const SOCIAL_HOSTS = ['youtube.com', 'tiktok.com', 'instagram.com', 'twitch.tv'];

function cleanSocialUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new StoreError('INVALID_PROFILE_URL', 'Each creator must have a valid social profile URL.');
  }
  const hostname = url.hostname.toLowerCase().replace(/^www\./, '');
  if (url.protocol !== 'https:' || !SOCIAL_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`))) {
    throw new StoreError('INVALID_PROFILE_URL', 'Only YouTube, TikTok, Instagram, and Twitch profile URLs are allowed.');
  }
  return url.toString();
}

function requestedCreator(input: unknown, fallbackColor: string): Match['creator1'] {
  const value = (input || {}) as Partial<Match['creator1']>;
  const name = String(value.name || '').trim().slice(0, 80);
  if (name.length < 2) throw new StoreError('INVALID_CREATOR', 'Both creator names are required.');
  const profileUrl = cleanSocialUrl(String(value.profileUrl || ''));
  const hostname = new URL(profileUrl).hostname.toLowerCase();
  const platform: Match['creator1']['platform'] = hostname.includes('tiktok')
    ? 'TikTok'
    : hostname.includes('instagram')
      ? 'Instagram'
      : hostname.includes('twitch')
        ? 'Twitch'
        : 'YouTube';
  const region = ['Pakistan', 'India', 'USA', 'Global'].includes(String(value.region))
    ? String(value.region) as Match['region']
    : 'Global';
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return {
    id: `requested-${randomUUID()}`,
    name,
    slug,
    avatar: `https://unavatar.io/${platform.toLowerCase()}/${encodeURIComponent(name)}`,
    subscribers: 'Pending verification',
    subscriberCountRaw: 0,
    platform,
    region,
    verified: false,
    handle: `@${slug}`,
    color: fallbackColor,
    profileUrl,
    followersCount: 'Pending verification',
    growthRate: 'Pending verification',
    growthTrend: 'neutral',
  };
}

function emptyState(): DatabaseState {
  return {
    version: 1,
    matches: clone(INITIAL_MATCHES),
    comments: clone(INITIAL_COMMENTS),
    users: [],
    sessions: [],
    votes: [],
    likes: [],
    commentLikes: [],
    adminSessions: [],
    audit: [],
    matchRequests: [],
  };
}

function normalizeState(input: Partial<DatabaseState>): DatabaseState {
  const seeded = emptyState();
  const storedMatches = Array.isArray(input.matches) ? input.matches : [];
  const mergedMatches = storedMatches.length
    ? [
        ...storedMatches,
        ...seeded.matches.filter((seed) => !storedMatches.some((match) => match.id === seed.id || match.slug === seed.slug)),
      ]
    : seeded.matches;
  return {
    version: 1,
    matches: mergedMatches.map((match) => ({ ...match, views: match.views || 0, shares: match.shares || 0 })),
    comments: input.comments && typeof input.comments === 'object' ? input.comments : seeded.comments,
    users: Array.isArray(input.users) ? input.users : [],
    sessions: Array.isArray(input.sessions) ? input.sessions : [],
    votes: Array.isArray(input.votes) ? input.votes : [],
    likes: Array.isArray(input.likes) ? input.likes : [],
    commentLikes: Array.isArray(input.commentLikes) ? input.commentLikes : [],
    adminSessions: Array.isArray(input.adminSessions) ? input.adminSessions : [],
    audit: Array.isArray(input.audit) ? input.audit : [],
    matchRequests: Array.isArray(input.matchRequests) ? input.matchRequests : [],
  };
}

export class PersistentStore {
  private state: DatabaseState;
  private writeQueue: Promise<void> = Promise.resolve();

  private constructor(
    private readonly dataDir: string,
    private readonly databasePath: string,
    private readonly backupDir: string,
    private readonly remoteDatabase: Client | undefined,
    state: DatabaseState,
  ) {
    this.state = state;
  }

  static async open(dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'data')) {
    const databasePath = path.join(dataDir, '1v1vote.json');
    const backupDir = process.env.BACKUP_DIR || path.join(dataDir, 'backups');
    await mkdir(dataDir, { recursive: true });
    await mkdir(backupDir, { recursive: true });

    let state = emptyState();
    let localState: DatabaseState | undefined;
    try {
      localState = normalizeState(JSON.parse(await readFile(databasePath, 'utf8')) as Partial<DatabaseState>);
    } catch (error: any) {
      if (error?.code !== 'ENOENT') {
        console.error('Database file could not be read. Starting from seed data.', error);
      }
    }

    const tursoUrl = process.env.TURSO_DATABASE_URL?.trim();
    const tursoToken = process.env.TURSO_AUTH_TOKEN?.trim();
    if (tursoUrl && !tursoToken) throw new Error('TURSO_AUTH_TOKEN must be configured with TURSO_DATABASE_URL.');
    if (tursoToken && !tursoUrl) throw new Error('TURSO_DATABASE_URL must be configured with TURSO_AUTH_TOKEN.');

    let remoteDatabase: Client | undefined;
    if (tursoUrl && tursoToken) {
      remoteDatabase = createClient({ url: tursoUrl, authToken: tursoToken });
      await remoteDatabase.execute(`
        CREATE TABLE IF NOT EXISTS app_state (
          id INTEGER PRIMARY KEY,
          state TEXT NOT NULL
        )
      `);
      const result = await remoteDatabase.execute('SELECT state FROM app_state WHERE id = 1');
      const remoteState = result.rows[0]?.state;
      if (remoteState) {
        state = normalizeState(JSON.parse(String(remoteState)) as Partial<DatabaseState>);
      } else {
        state = localState || state;
        await remoteDatabase.execute({
          sql: 'INSERT INTO app_state (id, state) VALUES (1, ?)',
          args: [JSON.stringify(state)],
        });
      }
    } else {
      state = localState || state;
    }

    const store = new PersistentStore(dataDir, databasePath, backupDir, remoteDatabase, state);
    await store.persist();
    return store;
  }

  private async persist() {
    const snapshot = JSON.stringify(this.state, null, 2);
    this.writeQueue = this.writeQueue.catch(() => undefined).then(async () => {
      if (this.remoteDatabase) {
        await this.remoteDatabase.execute({
          sql: `INSERT INTO app_state (id, state) VALUES (1, ?)
            ON CONFLICT(id) DO UPDATE SET state = excluded.state`,
          args: [snapshot],
        });
      }
      const temporaryPath = `${this.databasePath}.${process.pid}.tmp`;
      await writeFile(temporaryPath, snapshot, 'utf8');
      await rename(temporaryPath, this.databasePath);
    });
    return this.writeQueue;
  }

  private pruneExpiredSessions() {
    const current = Date.now();
    this.state.sessions = this.state.sessions.filter((session) => session.expiresAt > current);
    this.state.adminSessions = this.state.adminSessions.filter((session) => session.expiresAt > current);
  }

  private async audit(action: string, actorId?: string, metadata?: Record<string, unknown>) {
    this.state.audit.unshift({ id: randomUUID(), action, actorId, metadata, createdAt: nowIso() });
    this.state.audit = this.state.audit.slice(0, 500);
  }

  getSnapshot(userId?: string) {
    const active = this.state.matches.filter((match) => match.status === 'active');
    const user = userId ? this.state.users.find((item) => item.id === userId) : undefined;
    return {
      matches: clone(this.state.matches),
      comments: clone(this.state.comments),
      user: user ? this.publicUser(user) : null,
      stats: {
        totalVotes: this.state.matches.reduce((sum, match) => sum + match.votes1 + match.votes2, 0),
        totalMatches: this.state.matches.length,
        activeMatches: active.length,
        totalUsers: this.state.users.length,
        trendingMatchSlug: active[0]?.slug || this.state.matches[0]?.slug || '',
      },
    };
  }

  getMatch(idOrSlug: string) {
    return this.state.matches.find((match) => match.id === idOrSlug || match.slug === idOrSlug);
  }

  getMatchRequests(userId?: string) {
    const requests = userId
      ? this.state.matchRequests.filter((request) => request.userId === userId)
      : this.state.matchRequests;
    return clone(requests.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }

  async createMatchRequest(userId: string, input: Record<string, unknown>) {
    const user = this.state.users.find((item) => item.id === userId);
    if (!user) throw new StoreError('AUTH_REQUIRED', 'Please sign in before submitting a match request.', 401);
    const durationHours = Number(input.durationHours);
    const plan = MATCH_REQUEST_PLANS.find((item) => item.durationHours === durationHours);
    if (!plan) throw new StoreError('INVALID_PLAN', 'Please choose a valid match duration.');
    const startTime = new Date(String(input.startTime || '')).getTime();
    if (!Number.isFinite(startTime) || startTime < Date.now() + 1000 * 60 * 60 * 24) {
      throw new StoreError('INVALID_START_TIME', 'Scheduled matches must be submitted at least 24 hours in advance.');
    }
    const ownershipNote = String(input.ownershipNote || '').trim().slice(0, 600);
    if (ownershipNote.length < 20) throw new StoreError('OWNERSHIP_PROOF_REQUIRED', 'Please explain how you will prove ownership of both social accounts.');
    const paymentReference = String(input.paymentReference || '').trim().slice(0, 120);
    if (paymentReference.length < 4) throw new StoreError('PAYMENT_REFERENCE_REQUIRED', 'Please enter the payment transaction reference.');
    const creator1 = requestedCreator(input.creator1, '#38bdf8');
    const creator2 = requestedCreator(input.creator2, '#fb923c');
    if (creator1.profileUrl === creator2.profileUrl) throw new StoreError('DUPLICATE_PROFILE', 'The two creator profile URLs must be different.');
    const request: MatchRequest = {
      id: `request-${randomUUID()}`,
      userId,
      userName: user.name,
      createdAt: nowIso(),
      status: 'pending',
      paymentStatus: 'submitted',
      paymentReference,
      paymentAmountPkr: plan.amountPkr,
      durationHours: plan.durationHours,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(startTime + plan.durationHours * 60 * 60 * 1000).toISOString(),
      creator1,
      creator2,
      ownershipNote,
      category: creator1.platform,
      region: creator1.region === creator2.region ? creator1.region : 'Global',
      description: String(input.description || '').trim().slice(0, 500) || `${creator1.name} vs ${creator2.name} creator battle.`,
    };
    this.state.matchRequests.unshift(request);
    await this.audit('match.requested', userId, { requestId: request.id, amountPkr: request.paymentAmountPkr });
    await this.persist();
    return clone(request);
  }

  async reviewMatchRequest(requestId: string, decision: 'approve' | 'reject', adminId: string, adminNote = '') {
    const request = this.state.matchRequests.find((item) => item.id === requestId);
    if (!request) throw new StoreError('REQUEST_NOT_FOUND', 'Match request not found.', 404);
    if (request.status !== 'pending') throw new StoreError('REQUEST_ALREADY_REVIEWED', 'This match request has already been reviewed.', 409);
    request.status = decision === 'approve' ? 'approved' : 'rejected';
    request.paymentStatus = decision === 'approve' ? 'verified' : 'rejected';
    request.adminNote = adminNote.trim().slice(0, 600) || undefined;
    request.reviewedAt = nowIso();
    let match: Match | undefined;
    if (decision === 'approve') {
      match = await this.createMatch({
        creator1: { ...request.creator1, verified: true },
        creator2: { ...request.creator2, verified: true },
        startTime: request.startTime,
        endTime: request.endTime,
        category: request.category,
        region: request.region,
        description: request.description,
        isTrending: false,
      }, adminId);
      request.matchId = match.id;
    }
    await this.audit(`match.request.${decision}d`, adminId, { requestId: request.id, matchId: match?.id });
    await this.persist();
    return { request: clone(request), match: match ? clone(match) : undefined };
  }

  getUserBySession(token: string | undefined) {
    if (!token) return undefined;
    this.pruneExpiredSessions();
    const session = this.state.sessions.find((item) => item.tokenHash === tokenHash(token));
    return session ? this.state.users.find((user) => user.id === session.userId) : undefined;
  }

  getAdminSession(token: string | undefined) {
    if (!token) return false;
    this.pruneExpiredSessions();
    return this.state.adminSessions.some((session) => session.tokenHash === tokenHash(token));
  }

  publicUser(user: StoredUser): UserProfile & { role: Role } {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`,
      votedMatchIds: clone(user.votedMatchIds),
      points: user.points,
      role: user.role,
      walletBalancePkr: user.walletBalancePkr || 0,
    };
  }

  async register(name: string, email: string, password: string) {
    const cleanName = name.trim().slice(0, 40);
    const cleanEmail = email.trim().toLowerCase();
    if (cleanName.length < 2) throw new StoreError('INVALID_NAME', 'Please enter a display name.');
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) throw new StoreError('INVALID_EMAIL', 'Please enter a valid email address.');
    if (password.length < 8) throw new StoreError('WEAK_PASSWORD', 'Password must be at least 8 characters.');
    if (this.state.users.some((user) => user.email === cleanEmail)) {
      throw new StoreError('EMAIL_EXISTS', 'An account with this email already exists.', 409);
    }

    const user: StoredUser = {
      id: `user-${randomUUID()}`,
      name: cleanName,
      email: cleanEmail,
      passwordHash: passwordHash(password),
      role: 'user',
      points: 0,
      walletBalancePkr: 0,
      votedMatchIds: [],
      createdAt: nowIso(),
    };
    this.state.users.push(user);
    await this.audit('user.registered', user.id);
    await this.persist();
    return { user: this.publicUser(user), token: await this.createSession(user.id) };
  }

  async login(email: string, password: string) {
    const user = this.state.users.find((item) => item.email === email.trim().toLowerCase());
    if (!user || !verifyPassword(password, user.passwordHash)) {
      throw new StoreError('INVALID_LOGIN', 'Email or password is incorrect.', 401);
    }
    return { user: this.publicUser(user), token: await this.createSession(user.id) };
  }

  private async createSession(userId: string) {
    this.pruneExpiredSessions();
    const token = randomBytes(32).toString('hex');
    this.state.sessions.push({ tokenHash: tokenHash(token), userId, expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30 });
    await this.persist();
    return token;
  }

  async deleteSession(token: string | undefined) {
    if (!token) return;
    this.state.sessions = this.state.sessions.filter((session) => session.tokenHash !== tokenHash(token));
    await this.persist();
  }

  async createAdminSession() {
    this.pruneExpiredSessions();
    const token = randomBytes(32).toString('hex');
    this.state.adminSessions.push({ tokenHash: tokenHash(token), expiresAt: Date.now() + 1000 * 60 * 60 * 8 });
    await this.persist();
    return token;
  }

  async deleteAdminSession(token: string | undefined) {
    if (!token) return;
    this.state.adminSessions = this.state.adminSessions.filter((session) => session.tokenHash !== tokenHash(token));
    await this.persist();
  }

  async vote(matchId: string, creatorId: string, identityKey: string, userId?: string) {
    const match = this.getMatch(matchId);
    if (!match) throw new StoreError('MATCH_NOT_FOUND', 'Match not found.', 404);
    if (match.status !== 'active') throw new StoreError('MATCH_ENDED', 'This battle has already concluded.', 409);
    if (new Date(match.startTime).getTime() > Date.now()) throw new StoreError('MATCH_NOT_STARTED', 'Voting opens when the scheduled battle starts.', 409);
    if (new Date(match.endTime).getTime() <= Date.now()) {
      match.status = 'ended';
      await this.persist();
      throw new StoreError('MATCH_ENDED', 'This battle has already concluded.', 409);
    }
    if (![match.creator1.id, match.creator2.id].includes(creatorId)) {
      throw new StoreError('INVALID_CREATOR', 'Invalid creator selected.');
    }
    if (this.state.votes.some((vote) => vote.matchId === match.id && vote.identityKey === identityKey)) {
      throw new StoreError('ALREADY_VOTED', 'You already voted in this battle.', 409);
    }

    if (creatorId === match.creator1.id) match.votes1 += 1;
    else match.votes2 += 1;
    const total = match.votes1 + match.votes2;
    const p1 = Number(((match.votes1 / total) * 100).toFixed(2));
    match.historyPoints = [...(match.historyPoints || []), {
      timestamp: nowIso(),
      timeLabel: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      p1,
      p2: Number((100 - p1).toFixed(2)),
    }].slice(-24);
    this.state.votes.push({ matchId: match.id, creatorId, identityKey, userId, createdAt: nowIso() });
    if (userId) {
      const user = this.state.users.find((item) => item.id === userId);
      if (user) {
        user.points += 15;
        user.votedMatchIds.push({ matchId: match.id, creatorId, timestamp: nowIso() });
      }
    }
    await this.audit('vote.created', userId, { matchId: match.id, creatorId });
    await this.persist();
    return clone(match);
  }

  async addLike(matchId: string, creatorId: string, identityKey: string) {
    const match = this.getMatch(matchId);
    if (!match) throw new StoreError('MATCH_NOT_FOUND', 'Match not found.', 404);
    if (![match.creator1.id, match.creator2.id].includes(creatorId)) throw new StoreError('INVALID_CREATOR', 'Invalid creator selected.');
    if (this.state.likes.some((like) => like.matchId === match.id && like.creatorId === creatorId && like.identityKey === identityKey)) {
      return clone(match);
    }
    if (creatorId === match.creator1.id) match.likes1 += 1;
    else match.likes2 += 1;
    this.state.likes.push({ matchId: match.id, creatorId, identityKey, createdAt: nowIso() });
    await this.persist();
    return clone(match);
  }

  async recordView(matchId: string) {
    const match = this.getMatch(matchId);
    if (!match) throw new StoreError('MATCH_NOT_FOUND', 'Match not found.', 404);
    match.views = (match.views || 0) + 1;
    await this.persist();
    return clone(match);
  }

  async recordShare(matchId: string) {
    const match = this.getMatch(matchId);
    if (!match) throw new StoreError('MATCH_NOT_FOUND', 'Match not found.', 404);
    match.shares = (match.shares || 0) + 1;
    await this.persist();
    return clone(match);
  }

  async addComment(matchId: string, authorName: string, content: string, allegianceCreatorId: string | undefined, userId?: string) {
    const match = this.getMatch(matchId);
    if (!match) throw new StoreError('MATCH_NOT_FOUND', 'Match not found.', 404);
    const cleanContent = sanitizeComment(content);
    if (cleanContent.length < 2) throw new StoreError('EMPTY_COMMENT', 'Please write a comment.');
    if (allegianceCreatorId && ![match.creator1.id, match.creator2.id].includes(allegianceCreatorId)) {
      throw new StoreError('INVALID_ALLEGIANCE', 'Invalid creator allegiance.');
    }
    const user = userId ? this.state.users.find((item) => item.id === userId) : undefined;
    const name = (user?.name || authorName || 'Anonymous Fan').trim().slice(0, 40) || 'Anonymous Fan';
    const comment: Comment = {
      id: `comment-${randomUUID()}`,
      matchId: match.id,
      authorName: name,
      authorAvatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
      allegianceCreatorId,
      allegianceCreatorName: allegianceCreatorId === match.creator1.id ? match.creator1.name : allegianceCreatorId === match.creator2.id ? match.creator2.name : undefined,
      content: cleanContent,
      timestamp: 'Just now',
      likes: 0,
    };
    this.state.comments[match.id] = [comment, ...(this.state.comments[match.id] || [])].slice(0, 200);
    await this.audit('comment.created', userId, { matchId: match.id, commentId: comment.id });
    await this.persist();
    return clone(comment);
  }

  async likeComment(commentId: string, identityKey: string) {
    for (const list of Object.values(this.state.comments)) {
      const comment = list.find((item) => item.id === commentId);
      if (!comment) continue;
      if (this.state.commentLikes.some((like) => like.commentId === commentId && like.identityKey === identityKey)) return clone(comment);
      comment.likes += 1;
      this.state.commentLikes.push({ commentId, identityKey, createdAt: nowIso() });
      await this.persist();
      return clone(comment);
    }
    throw new StoreError('COMMENT_NOT_FOUND', 'Comment not found.', 404);
  }

  async createMatch(matchData: Partial<Match>, actorId?: string) {
    if (!matchData.creator1 || !matchData.creator2) throw new StoreError('INVALID_MATCH', 'Both creators are required.');
    const baseSlug = `${matchData.creator1.name}-vs-${matchData.creator2.name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const slug = this.state.matches.some((match) => match.slug === baseSlug) ? `${baseSlug}-${Date.now()}` : baseSlug;
    const match: Match = {
      id: `match-${randomUUID()}`,
      slug,
      title: `${matchData.creator1.name} vs ${matchData.creator2.name}`,
      creator1: matchData.creator1,
      creator2: matchData.creator2,
      votes1: 0,
      votes2: 0,
      likes1: 0,
      likes2: 0,
      views: 0,
      shares: 0,
      startTime: matchData.startTime || nowIso(),
      endTime: matchData.endTime || new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString(),
      status: 'active',
      isTrending: matchData.isTrending ?? false,
      category: matchData.category || 'YouTube',
      region: matchData.region || 'Global',
      description: matchData.description || 'Live head-to-head influencer battle! Vote for your favorite creator.',
      historyPoints: matchData.historyPoints || [{ timestamp: nowIso(), timeLabel: 'Start', p1: 50, p2: 50 }],
    };
    this.state.matches.unshift(match);
    await this.audit('match.created', actorId, { matchId: match.id });
    await this.persist();
    return clone(match);
  }

  async endMatch(matchId: string, winnerId?: string, actorId?: string) {
    const match = this.getMatch(matchId);
    if (!match) throw new StoreError('MATCH_NOT_FOUND', 'Match not found.', 404);
    if (winnerId && ![match.creator1.id, match.creator2.id].includes(winnerId)) throw new StoreError('INVALID_WINNER', 'Winner must belong to this battle.');
    match.status = 'ended';
    match.winnerId = winnerId || (match.votes1 >= match.votes2 ? match.creator1.id : match.creator2.id);
    await this.audit('match.ended', actorId, { matchId: match.id, winnerId: match.winnerId });
    await this.persist();
    return clone(match);
  }

  getLeaderboard() {
    return this.state.users
      .map((user) => ({ name: user.name, points: user.points, votes: user.votedMatchIds.length }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 20)
      .map((user, index) => ({ ...user, rank: index + 1, badge: index === 0 ? 'Grandmaster' : index < 3 ? 'Master' : 'Rising Fan' }));
  }

  async backupNow() {
    await this.persist();
    const name = `1v1vote-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const target = path.join(this.backupDir, name);
    if (this.remoteDatabase) {
      const result = await this.remoteDatabase.execute('SELECT state FROM app_state WHERE id = 1');
      const remoteState = result.rows[0]?.state;
      await writeFile(target, remoteState ? String(remoteState) : JSON.stringify(this.state, null, 2), 'utf8');
    } else {
      await copyFile(this.databasePath, target);
    }
    const files = (await readdir(this.backupDir)).filter((file) => file.startsWith('1v1vote-')).sort().reverse();
    await Promise.all(files.slice(14).map((file) => unlink(path.join(this.backupDir, file))));
    return { name, path: target };
  }

  async listBackups() {
    return (await readdir(this.backupDir)).filter((file) => file.startsWith('1v1vote-')).sort().reverse();
  }
}

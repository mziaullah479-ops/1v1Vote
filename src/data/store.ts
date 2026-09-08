import { Match, Comment, UserProfile, SiteStats, LiveVoteEvent } from '../types';
import { INITIAL_MATCHES, INITIAL_COMMENTS } from './seedData';

const MATCHES_STORAGE_KEY = 'vs_battle_matches_v3';
const VOTES_STORAGE_KEY = 'vs_battle_user_votes_v3';
const COMMENTS_STORAGE_KEY = 'vs_battle_comments_v3';
const USER_PROFILE_STORAGE_KEY = 'vs_battle_user_v3';

const REALTIME_CITIES = [
  'Lahore, PK', 'Karachi, PK', 'Islamabad, PK', 'New York, US', 'Los Angeles, US',
  'London, UK', 'Mumbai, IN', 'Delhi, IN', 'Dubai, UAE', 'Toronto, CA', 'Sydney, AU', 'Faisalabad, PK', 'Rawalpindi, PK'
];

function getRandomCity(): string {
  return REALTIME_CITIES[Math.floor(Math.random() * REALTIME_CITIES.length)];
}

// Simple device fingerprint based on userAgent, screen resolution, timezone
export function getDeviceFingerprint(): string {
  if (typeof window === 'undefined') return 'server-device';
  try {
    const raw = [
      navigator.userAgent,
      screen.width + 'x' + screen.height,
      screen.colorDepth,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      navigator.language,
    ].join('###');

    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0;
    }
    return 'fp_' + Math.abs(hash).toString(16);
  } catch {
    return 'fp_fallback_' + Math.random().toString(36).substring(2, 9);
  }
}

// Simple profanity filter
const BANNED_WORDS = [
  'abuse', 'bastard', 'bitch', 'idiot', 'scam', 'scammer', 'hate', 'f**k', 'fuck', 'shit', 'asshole', 'stupid', 'harami'
];

export function sanitizeComment(text: string): string {
  let clean = text;
  BANNED_WORDS.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    clean = clean.replace(regex, '***');
  });
  return clean;
}

export class MatchStore {
  private static matches: Match[] = [];
  private static comments: Record<string, Comment[]> = {};
  private static userVotes: Record<string, string> = {}; // matchId -> creatorId
  private static currentUser: UserProfile | null = null;
  private static listeners: Array<() => void> = [];
  private static recentVoteEvents: LiveVoteEvent[] = [];

  static init() {
    if (typeof window === 'undefined') return;

    try {
      const savedMatches = localStorage.getItem(MATCHES_STORAGE_KEY);
      if (savedMatches) {
        this.matches = JSON.parse(savedMatches);
      } else {
        this.matches = INITIAL_MATCHES;
        localStorage.setItem(MATCHES_STORAGE_KEY, JSON.stringify(this.matches));
      }

      // Ensure all matches have likes1 & likes2 initialized
      this.matches = this.matches.map((m) => ({
        ...m,
        likes1: typeof m.likes1 === 'number' ? m.likes1 : Math.round(m.votes1 * 0.25),
        likes2: typeof m.likes2 === 'number' ? m.likes2 : Math.round(m.votes2 * 0.25),
      }));

      const savedComments = localStorage.getItem(COMMENTS_STORAGE_KEY);
      if (savedComments) {
        this.comments = JSON.parse(savedComments);
      } else {
        this.comments = INITIAL_COMMENTS;
        localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(this.comments));
      }

      const savedVotes = localStorage.getItem(VOTES_STORAGE_KEY);
      if (savedVotes) {
        this.userVotes = JSON.parse(savedVotes);
      }

      const savedUser = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
      if (savedUser) {
        this.currentUser = JSON.parse(savedUser);
      }
    } catch {
      this.matches = INITIAL_MATCHES;
      this.comments = INITIAL_COMMENTS;
    }

    // Set up rapid, dynamic live simulated votes every 2.5s to keep the trading chart actively moving
    if (typeof window !== 'undefined') {
      setInterval(() => {
        this.simulateRealtimeVotes();
      }, 2500);
    }
  }

  static subscribe(fn: () => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private static notify() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(MATCHES_STORAGE_KEY, JSON.stringify(this.matches));
        localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(this.comments));
        localStorage.setItem(VOTES_STORAGE_KEY, JSON.stringify(this.userVotes));
      } catch (err) {
        console.error('Storage sync error', err);
      }
    }
    this.listeners.forEach((fn) => fn());
  }

  static getMatches(): Match[] {
    if (this.matches.length === 0) {
      this.init();
    }
    return this.matches;
  }

  static getMatchBySlug(slug: string): Match | undefined {
    return this.getMatches().find((m) => m.slug === slug);
  }

  static hasUserVoted(matchId: string): boolean {
    return !!this.userVotes[matchId];
  }

  static getUserVotedCreator(matchId: string): string | undefined {
    return this.userVotes[matchId];
  }

  static getRecentVoteEvents(matchId?: string): LiveVoteEvent[] {
    if (!matchId) return this.recentVoteEvents;
    return this.recentVoteEvents.filter((e) => e.matchId === matchId);
  }

  // ANY user can like as many times as they want (rapid fire / unlimited likes)
  static addLike(matchId: string, creatorId: string, count: number = 1): { success: boolean; likes1: number; likes2: number } {
    const match = this.matches.find((m) => m.id === matchId || m.slug === matchId);
    if (!match) {
      return { success: false, likes1: 0, likes2: 0 };
    }

    if (match.creator1.id === creatorId) {
      match.likes1 = (match.likes1 || 0) + count;
    } else if (match.creator2.id === creatorId) {
      match.likes2 = (match.likes2 || 0) + count;
    }

    this.notify();
    return { success: true, likes1: match.likes1, likes2: match.likes2 };
  }

  // Every single vote is impactful and physically shifts the live trading graph up & down!
  static vote(matchId: string, creatorId: string): { success: boolean; message: string; match?: Match; deltaP?: number } {
    const match = this.matches.find((m) => m.id === matchId || m.slug === matchId);
    if (!match) {
      return { success: false, message: 'Match not found.' };
    }

    if (match.status === 'ended') {
      return { success: false, message: 'This battle has already concluded.' };
    }

    const isFirstVote = !this.hasUserVoted(match.id);
    const isCreator1 = match.creator1.id === creatorId;
    const isCreator2 = match.creator2.id === creatorId;

    if (!isCreator1 && !isCreator2) {
      return { success: false, message: 'Invalid creator selected.' };
    }

    // Register the vote
    if (isCreator1) {
      match.votes1 += 1;
    } else {
      match.votes2 += 1;
    }

    // Calculate real-time trading momentum jump: each vote moves the curve visibly!
    const deltaSign = isCreator1 ? 1 : -1;
    const deltaMagnitude = +(1.25 + Math.random() * 1.4).toFixed(2);
    const deltaP = deltaSign * deltaMagnitude;

    // Get current percentages
    const total = match.votes1 + match.votes2;
    let baseP1 = total > 0 ? (match.votes1 / total) * 100 : 50;

    // Apply live trading tick to the latest point or append a new tick point
    if (!match.historyPoints || match.historyPoints.length === 0) {
      match.historyPoints = [
        { timestamp: new Date().toISOString(), timeLabel: 'Start', p1: 50, p2: 50 },
      ];
    }

    const now = new Date();
    const timeLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const lastPoint = match.historyPoints[match.historyPoints.length - 1];

    // Compute updated percentage with high-volatility trading swing (10% to 90% wide range)
    let newP1 = Math.min(88, Math.max(12, Number((lastPoint.p1 + deltaP).toFixed(2))));
    let newP2 = Number((100 - newP1).toFixed(2));

    // If last point was created very recently, nudge it; otherwise create a new tick point
    const lastTimestamp = new Date(lastPoint.timestamp).getTime();
    const timeSinceLastPoint = Date.now() - (isNaN(lastTimestamp) ? 0 : lastTimestamp);

    if (timeSinceLastPoint < 2500) {
      lastPoint.p1 = newP1;
      lastPoint.p2 = newP2;
      lastPoint.timeLabel = timeLabel;
    } else {
      match.historyPoints.push({
        timestamp: now.toISOString(),
        timeLabel,
        p1: newP1,
        p2: newP2,
      });
      // Keep up to 16 points for smooth scrolling window
      if (match.historyPoints.length > 16) {
        match.historyPoints.shift();
      }
    }

    // Add live tick event
    const creatorName = isCreator1 ? match.creator1.name : match.creator2.name;
    const city = getRandomCity();
    this.recentVoteEvents.unshift({
      id: 'vote-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      matchId: match.id,
      creatorId,
      creatorName,
      location: city,
      deltaP: Math.abs(deltaP),
      timestamp: Date.now(),
    });
    if (this.recentVoteEvents.length > 25) {
      this.recentVoteEvents.pop();
    }

    this.userVotes[match.id] = creatorId;

    if (this.currentUser) {
      this.currentUser.votedMatchIds.push({
        matchId: match.id,
        creatorId,
        timestamp: now.toISOString(),
      });
      this.currentUser.points = (this.currentUser.points || 0) + 15;
      localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(this.currentUser));
    }

    this.notify();

    const surgeMsg = isCreator1
      ? `+1 Vote for ${match.creator1.name}! Trend jumped +${Math.abs(deltaP)}% ▲`
      : `+1 Vote for ${match.creator2.name}! Trend jumped +${Math.abs(deltaP)}% ▲`;

    return {
      success: true,
      message: isFirstVote ? `Official Vote Registered! ${surgeMsg}` : `Power Boost Vote! ${surgeMsg}`,
      match,
      deltaP,
    };
  }

  static simulateRealtimeVotes() {
    let changed = false;
    this.matches.forEach((m) => {
      if (m.status === 'active') {
        const rand = Math.random();
        // 75% chance of live action every 2.5s
        if (rand > 0.25) {
          // Determine who gets the vote
          const bias1 = m.votes1 / (m.votes1 + m.votes2 || 1);
          const favorsCreator1 = Math.random() < bias1;
          const creator = favorsCreator1 ? m.creator1 : m.creator2;

          const voteAmount = Math.floor(Math.random() * 2) + 1;
          if (favorsCreator1) {
            m.votes1 += voteAmount;
          } else {
            m.votes2 += voteAmount;
          }

          const deltaSign = favorsCreator1 ? 1 : -1;
          // Volatile trading jump: 0.7% to 2.2% swing with occasional retracements
          const isPullback = Math.random() < 0.22; // 22% chance of natural market pullback
          const effectiveSign = isPullback ? -deltaSign : deltaSign;
          const deltaMagnitude = +(0.65 + Math.random() * 1.25).toFixed(2);
          const deltaP = effectiveSign * deltaMagnitude;

          const lastPoint = m.historyPoints[m.historyPoints.length - 1];
          if (lastPoint) {
            let nextP1 = Math.min(88, Math.max(12, Number((lastPoint.p1 + deltaP).toFixed(2))));
            let nextP2 = Number((100 - nextP1).toFixed(2));

            const now = new Date();
            const timeLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

            const lastTime = new Date(lastPoint.timestamp).getTime();
            if (Date.now() - lastTime < 3000) {
              lastPoint.p1 = nextP1;
              lastPoint.p2 = nextP2;
              lastPoint.timeLabel = timeLabel;
            } else {
              m.historyPoints.push({
                timestamp: now.toISOString(),
                timeLabel,
                p1: nextP1,
                p2: nextP2,
              });
              if (m.historyPoints.length > 16) {
                m.historyPoints.shift();
              }
            }
          }

          // Record live event
          this.recentVoteEvents.unshift({
            id: 'evt-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
            matchId: m.id,
            creatorId: creator.id,
            creatorName: creator.name,
            location: getRandomCity(),
            deltaP: Math.abs(deltaP),
            timestamp: Date.now(),
          });
          if (this.recentVoteEvents.length > 25) {
            this.recentVoteEvents.pop();
          }

          changed = true;
        }
      }
    });

    if (changed) {
      this.notify();
    }
  }

  static getComments(matchId: string): Comment[] {
    return this.comments[matchId] || [];
  }

  static addComment(matchId: string, authorName: string, content: string, allegianceCreatorId?: string): Comment {
    const cleanContent = sanitizeComment(content);
    const match = this.getMatchBySlug(matchId) || this.matches.find((m) => m.id === matchId);
    let allegianceName: string | undefined;

    if (match && allegianceCreatorId) {
      if (match.creator1.id === allegianceCreatorId) allegianceName = match.creator1.name;
      if (match.creator2.id === allegianceCreatorId) allegianceName = match.creator2.name;
    }

    const newComment: Comment = {
      id: 'cm-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      matchId,
      authorName: authorName.trim() || 'Anonymous Fan',
      authorAvatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(authorName || 'fan')}`,
      allegianceCreatorId,
      allegianceCreatorName: allegianceName,
      content: cleanContent,
      timestamp: 'Just now',
      likes: 1,
    };

    if (!this.comments[matchId]) {
      this.comments[matchId] = [];
    }
    this.comments[matchId].unshift(newComment);
    this.notify();
    return newComment;
  }

  static likeComment(matchId: string, commentId: string) {
    const list = this.comments[matchId];
    if (list) {
      const c = list.find((item) => item.id === commentId);
      if (c) {
        c.likes += 1;
        this.notify();
      }
    }
  }

  static createMatch(matchData: Partial<Match>): Match {
    const slug = `${matchData.creator1?.name || 'c1'}-vs-${matchData.creator2?.name || 'c2'}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const newMatch: Match = {
      id: 'match-' + Date.now(),
      slug,
      title: `${matchData.creator1?.name} vs ${matchData.creator2?.name}`,
      creator1: matchData.creator1!,
      creator2: matchData.creator2!,
      votes1: matchData.votes1 || 0,
      votes2: matchData.votes2 || 0,
      likes1: matchData.likes1 || 0,
      likes2: matchData.likes2 || 0,
      startTime: matchData.startTime || new Date().toISOString(),
      endTime: matchData.endTime || new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString(),
      status: 'active',
      isTrending: matchData.isTrending ?? true,
      category: matchData.category || 'YouTube',
      region: matchData.region || 'Global',
      description: matchData.description || 'Live head-to-head influencer battle! Vote for your favorite creator.',
      historyPoints: [
        {
          timestamp: new Date().toISOString(),
          timeLabel: 'Start',
          p1: 50.0,
          p2: 50.0,
        },
      ],
    };

    this.matches.unshift(newMatch);
    this.notify();
    return newMatch;
  }

  static endMatchManually(matchId: string, winnerId?: string) {
    const match = this.matches.find((m) => m.id === matchId);
    if (match) {
      match.status = 'ended';
      if (winnerId) {
        match.winnerId = winnerId;
      } else {
        match.winnerId = match.votes1 >= match.votes2 ? match.creator1.id : match.creator2.id;
      }
      this.notify();
    }
  }

  static getStats(): SiteStats {
    const all = this.getMatches();
    const totalVotes = all.reduce((sum, m) => sum + m.votes1 + m.votes2, 0);
    const active = all.filter((m) => m.status === 'active');
    const sorted = [...active].sort((a, b) => (b.votes1 + b.votes2) - (a.votes1 + a.votes2));

    return {
      totalVotes,
      totalMatches: all.length,
      activeMatches: active.length,
      totalUsers: Math.round(totalVotes / 2.3) + 1420,
      trendingMatchSlug: sorted[0]?.slug || 'ducky-bhai-vs-mrbeast-gaming',
    };
  }

  // Authentication & free accounts
  static getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  static login(name: string, email: string): UserProfile {
    const user: UserProfile = {
      id: 'usr-' + Date.now(),
      name: name.trim() || 'Creator Fan',
      email: email.trim() || 'fan@vsbattle.app',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || 'user')}`,
      votedMatchIds: Object.entries(this.userVotes).map(([matchId, creatorId]) => ({
        matchId,
        creatorId,
        timestamp: new Date().toISOString(),
      })),
      points: 120,
    };
    this.currentUser = user;
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(user));
    }
    this.notify();
    return user;
  }

  static logout() {
    this.currentUser = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(USER_PROFILE_STORAGE_KEY);
    }
    this.notify();
  }
}

// Auto init on import
if (typeof window !== 'undefined') {
  MatchStore.init();
}

export type Platform = 'YouTube' | 'TikTok' | 'Instagram' | 'Twitch';
export type Region = 'Pakistan' | 'India' | 'USA' | 'Global';
export type MatchRequestStatus = 'pending' | 'approved' | 'rejected';
export type PaymentStatus = 'submitted' | 'verified' | 'rejected';

export interface Creator {
  id: string;
  name: string;
  slug: string;
  avatar: string;
  subscribers: string;
  subscriberCountRaw: number;
  platform: Platform;
  region: Region;
  verified: boolean;
  handle?: string;
  color?: string;
  profileUrl?: string; // e.g. https://youtube.com/@DuckyBhai
  followersCount?: string; // Live follower / subscriber counter string
  growthRate?: string; // e.g. "+1,840 today"
  growthTrend?: 'up' | 'down' | 'neutral';
}

export interface ChartDataPoint {
  timestamp: string;
  timeLabel: string;
  p1: number; // percentage for creator 1 (0 - 100)
  p2: number; // percentage for creator 2 (0 - 100)
}

export interface Match {
  id: string;
  slug: string; // e.g. "ducky-bhai-vs-mrbeast-gaming"
  title: string;
  creator1: Creator;
  creator2: Creator;
  votes1: number;
  votes2: number;
  likes1: number;
  likes2: number;
  startTime: string;
  endTime: string;
  status: 'active' | 'ended';
  winnerId?: string;
  isTrending?: boolean;
  views?: number;
  shares?: number;
  category: Platform | 'All';
  region: Region;
  historyPoints: ChartDataPoint[];
  description?: string;
}

export interface Comment {
  id: string;
  matchId: string;
  authorName: string;
  authorAvatar: string;
  allegianceCreatorId?: string;
  allegianceCreatorName?: string;
  content: string;
  timestamp: string;
  likes: number;
}

export interface VotePayload {
  matchId: string;
  creatorId: string;
  fingerprint: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  votedMatchIds: { matchId: string; creatorId: string; timestamp: string }[];
  points: number;
  role?: 'user' | 'admin';
  walletBalancePkr?: number;
}

export interface MatchRequest {
  id: string;
  userId: string;
  userName: string;
  createdAt: string;
  status: MatchRequestStatus;
  paymentStatus: PaymentStatus;
  paymentReference: string;
  paymentAmountPkr: number;
  durationHours: number;
  startTime: string;
  endTime: string;
  creator1: Creator;
  creator2: Creator;
  ownershipNote: string;
  category: Platform;
  region: Region;
  description: string;
  adminNote?: string;
  reviewedAt?: string;
  matchId?: string;
}

export interface LiveVoteEvent {
  id: string;
  matchId: string;
  creatorId: string;
  creatorName: string;
  location: string;
  deltaP: number;
  timestamp: number;
}

export interface SiteStats {
  totalVotes: number;
  totalMatches: number;
  activeMatches: number;
  totalUsers: number;
  trendingMatchSlug: string;
}

import React, { useState } from 'react';
import { CheckCircle2, ThumbsUp, Check, Flame, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Match } from '../types';
import { MatchStore } from '../data/store';
import { SocialFollowerLiveBadge } from './SocialFollowerLiveBadge';
import { SentimentMeter } from './SentimentMeter';

interface MatchArenaProps {
  match: Match;
  hasVoted: boolean;
  votedCreatorId?: string;
  onVote: (creatorId: string) => void;
  onSelectCreatorDetail?: (creatorId: string) => void;
}

interface FloatingReaction {
  id: number;
  creatorId: string;
  x: number;
  y: number;
  emoji: string;
}

export const MatchArena: React.FC<MatchArenaProps> = ({
  match,
  hasVoted,
  votedCreatorId,
  onVote,
  onSelectCreatorDetail,
}) => {
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const [comboC1, setComboC1] = useState<number>(0);
  const [comboC2, setComboC2] = useState<number>(0);
  const [lastComboTimer1, setLastComboTimer1] = useState<NodeJS.Timeout | null>(null);
  const [lastComboTimer2, setLastComboTimer2] = useState<NodeJS.Timeout | null>(null);

  const handleVoteClick = (creatorId: string) => {
    // Trigger celebratory confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: creatorId === match.creator1.id ? ['#38bdf8', '#2563eb', '#60a5fa'] : ['#fb923c', '#ea580c', '#f97316'],
    });

    onVote(creatorId);
  };

  // Keep the reaction local while the backend confirms the shared count.
  const handleLikeClick = (creatorId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    const isC1 = creatorId === match.creator1.id;
    MatchStore.addLike(match.id, creatorId, 1);

    // Emoji reaction pool
    const emojis = ['❤️', '🔥', '⚡', '👍', '🌟'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

    const rect = event.currentTarget.getBoundingClientRect();
    const newReaction: FloatingReaction = {
      id: Date.now() + Math.random(),
      creatorId,
      x: rect.left + rect.width / 2 + (Math.random() - 0.5) * 40,
      y: rect.top,
      emoji: randomEmoji,
    };

    setFloatingReactions((prev) => [...prev.slice(-12), newReaction]);

    // Clean up reaction after animation
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
    }, 1000);

    // Combo streak logic
    if (isC1) {
      setComboC1((prev) => prev + 1);
      if (lastComboTimer1) clearTimeout(lastComboTimer1);
      const timer = setTimeout(() => setComboC1(0), 1600);
      setLastComboTimer1(timer);
    } else {
      setComboC2((prev) => prev + 1);
      if (lastComboTimer2) clearTimeout(lastComboTimer2);
      const timer = setTimeout(() => setComboC2(0), 1600);
      setLastComboTimer2(timer);
    }
  };

  const isVotedC1 = hasVoted && votedCreatorId === match.creator1.id;
  const isVotedC2 = hasVoted && votedCreatorId === match.creator2.id;

  // Like stats
  const likes1 = match.likes1 || 0;
  const likes2 = match.likes2 || 0;
  const totalLikes = likes1 + likes2;
  const likesRatio1 = totalLikes > 0 ? Math.round((likes1 / totalLikes) * 100) : 50;
  const likesRatio2 = totalLikes > 0 ? 100 - likesRatio1 : 50;

  // Vote stats
  const totalVotes = match.votes1 + match.votes2;
  const votesRatio1 = totalVotes > 0 ? ((match.votes1 / totalVotes) * 100).toFixed(1) : '50.0';
  const votesRatio2 = totalVotes > 0 ? ((match.votes2 / totalVotes) * 100).toFixed(1) : '50.0';

  return (
    <div className="relative w-full max-w-6xl mx-auto py-2 px-2 sm:px-4">
      {/* Dynamic clash background lighting effect */}
      <div className="absolute inset-0 pointer-events-none flex justify-between overflow-hidden opacity-40 -z-10">
        <div className="w-80 h-80 rounded-full bg-blue-600/25 blur-3xl -translate-x-12 -translate-y-12"></div>
        <div className="w-80 h-80 rounded-full bg-orange-600/25 blur-3xl translate-x-12 -translate-y-12"></div>
      </div>

      {/* Floating Reaction Emojis Container */}
      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
        {floatingReactions.map((r) => (
          <div
            key={r.id}
            className="absolute text-2xl font-bold animate-floatUp select-none"
            style={{
              left: `${r.x}px`,
              top: `${r.y}px`,
              animation: 'floatUp 1s ease-out forwards',
            }}
          >
            {r.emoji}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-center">
        {/* ===================== CREATOR 1 CARD (BLUE/CYAN) ===================== */}
        <div className="md:col-span-5 relative group">
          <div
            id={`creator-card-${match.creator1.slug}`}
            className="relative bg-gradient-to-b from-[#0a1329] to-[#070b16] rounded-3xl p-5 sm:p-7 border-2 border-sky-500/70 shadow-[0_0_40px_-5px_rgba(56,189,248,0.35)] transition-all duration-300 hover:shadow-[0_0_55px_-5px_rgba(56,189,248,0.5)]"
          >
            {/* Top Badges & Live Vote Ratio */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="bg-blue-600 text-white font-extrabold text-xs px-3 py-1 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.7)]">
                  #1 Leader
                </span>
                {match.isTrending && (
                  <span className="flex items-center gap-1 bg-[#0f2347] border border-sky-500/40 text-sky-400 font-semibold text-xs px-2.5 py-0.5 rounded-full">
                    <Flame className="w-3.5 h-3.5 text-sky-400 fill-sky-400" />
                    Hot
                  </span>
                )}
              </div>

              {/* Vote Split Badge */}
              <div className="text-right">
                <span className="text-xs text-slate-400 font-medium">Votes Share:</span>{' '}
                <span className="text-sm sm:text-base font-black text-sky-400 font-mono">{votesRatio1}%</span>
              </div>
            </div>

            {/* Avatar with Royal Crown & Platform badge */}
            <div className="flex flex-col items-center relative my-1">
              {/* Crown Icon Above Avatar */}
              <div className="text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.7)] animate-bounce mb-1">
                <svg className="w-7 h-7 fill-current text-sky-300" viewBox="0 0 24 24">
                  <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5m14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
                </svg>
              </div>

              {/* Profile Photo with Cyan Glowing Ring */}
              <div className="relative">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-tr from-sky-400 to-blue-600 shadow-[0_0_25px_rgba(56,189,248,0.6)]">
                  <img
                    src={match.creator1.avatar}
                    alt={match.creator1.name}
                    className="w-full h-full object-cover rounded-full bg-slate-900"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/micah/svg?seed=${match.creator1.slug}`;
                    }}
                  />
                </div>

                {/* Platform Badge */}
                <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg border-2 border-[#0a1329]">
                  {match.creator1.platform === 'TikTok' ? (
                    <span className="text-[10px] font-black">TT</span>
                  ) : match.creator1.platform === 'Instagram' ? (
                    <span className="text-[10px] font-black">IG</span>
                  ) : (
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  )}
                </div>
              </div>

              {/* Creator Name */}
              <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-3 text-center tracking-tight">
                {match.creator1.name}
              </h2>

              {/* Verified Platform & Country */}
              <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 fill-sky-400/20" />
                <span>{match.creator1.platform}</span>
                <span className="text-slate-500">•</span>
                <span>{match.creator1.region}</span>
              </div>

              {/* Subscribers & Live Social Follower Tracker */}
              <div className="w-full mt-3">
                <SocialFollowerLiveBadge creator={match.creator1} size="md" />
              </div>
            </div>

            {/* Likes & Hype Section (UNLIMITED LIKES) */}
            <div className="mt-4 p-2.5 rounded-2xl bg-[#091428] border border-sky-500/20 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-rose-500 text-lg">❤️</span>
                <div>
                  <div className="text-white font-extrabold text-sm leading-none font-mono">
                    {likes1.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400">Unlimited Fan Likes</div>
                </div>
              </div>

              {/* Rapid Like Button */}
              <button
                onClick={(e) => handleLikeClick(match.creator1.id, e)}
                className="relative flex items-center gap-1.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-full shadow-[0_0_15px_rgba(244,63,94,0.4)] active:scale-90 transition-all cursor-pointer"
                  title="Send one fan reaction"
              >
                <Heart className="w-3.5 h-3.5 fill-current" />
                <span>LIKE</span>
                {comboC1 > 1 && (
                  <span className="absolute -top-3 -right-2 bg-amber-400 text-black text-[10px] font-black px-1.5 py-0.2 rounded-full shadow animate-bounce">
                    x{comboC1}
                  </span>
                )}
              </button>
            </div>

            {/* Vote Action Button */}
            <div className="mt-4 flex flex-col items-center">
              <button
                id={`btn-vote-${match.creator1.id}`}
                onClick={() => handleVoteClick(match.creator1.id)}
                className={`w-full py-3 px-6 rounded-full font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
                  isVotedC1
                    ? 'bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_25px_rgba(37,99,235,0.6)] hover:shadow-[0_0_35px_rgba(56,189,248,0.75)] active:scale-[0.98]'
                }`}
              >
                {isVotedC1 ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Voted ✓</span>
                  </>
                ) : (
                  <>
                    <ThumbsUp className="w-4 h-4 fill-current" />
                    <span>VOTE FOR {match.creator1.name.toUpperCase()}</span>
                  </>
                )}
              </button>

              <div className="mt-2.5 grid grid-cols-2 gap-2 w-full text-[11px] text-slate-400 px-1">
                <span>Votes <strong className="text-white font-mono">{match.votes1.toLocaleString()}</strong></span>
                <span className="text-right">Share <strong className="text-sky-300 font-mono">{votesRatio1}%</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* ===================== CENTER VS BADGE & CLASH ===================== */}
        <div className="md:col-span-2 flex flex-col items-center justify-center text-center my-2 md:my-0 select-none">
          {/* Animated 3D VS Clash Emblem */}
          <div className="relative flex items-center justify-center">
            <div className="absolute w-28 h-28 rounded-full bg-gradient-to-r from-cyan-500/20 to-orange-500/20 blur-xl"></div>

            <div className="relative font-black italic tracking-tighter text-5xl sm:text-6xl flex items-center drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 via-sky-400 to-blue-600 drop-shadow-[0_0_15px_rgba(56,189,248,0.8)]">
                V
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-amber-300 via-orange-500 to-red-600 drop-shadow-[0_0_15px_rgba(249,115,22,0.8)] -ml-1">
                S
              </span>
            </div>
          </div>

          {/* Likes Comparison Meter */}
          <div className="w-full mt-3 px-2">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
              <span className="text-sky-400">{likesRatio1}% Likes</span>
              <span className="text-orange-400">{likesRatio2}% Likes</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-blue-600 transition-all duration-300"
                style={{ width: `${likesRatio1}%` }}
              ></div>
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-300"
                style={{ width: `${likesRatio2}%` }}
              ></div>
            </div>
          </div>

          <div className="mt-2 space-y-0.5">
            <p className="text-slate-300 text-[11px] font-semibold tracking-wide">
              Two Creators. One Crown.
            </p>
            <p className="text-cyan-400 font-bold text-[11px] tracking-wider uppercase drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]">
              You Decide!
            </p>
          </div>
        </div>

        {/* ===================== CREATOR 2 CARD (ORANGE/AMBER) ===================== */}
        <div className="md:col-span-5 relative group">
          <div
            id={`creator-card-${match.creator2.slug}`}
            className="relative bg-gradient-to-b from-[#1b110a] to-[#0b0805] rounded-3xl p-5 sm:p-7 border-2 border-orange-500/70 shadow-[0_0_40px_-5px_rgba(249,115,22,0.35)] transition-all duration-300 hover:shadow-[0_0_55px_-5px_rgba(249,115,22,0.5)]"
          >
            {/* Top Badges & Live Vote Ratio */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="text-left">
                <span className="text-xs text-slate-400 font-medium">Votes Share:</span>{' '}
                <span className="text-sm sm:text-base font-black text-orange-400 font-mono">{votesRatio2}%</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 bg-[#3a1d0d] border border-orange-500/40 text-orange-400 font-semibold text-xs px-2.5 py-0.5 rounded-full">
                  <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                  Challenger
                </span>
                <span className="bg-orange-600 text-white font-extrabold text-xs px-3 py-1 rounded-full shadow-[0_0_10px_rgba(234,88,12,0.7)]">
                  #2
                </span>
              </div>
            </div>

            {/* Avatar with Platform badge */}
            <div className="flex flex-col items-center relative my-1">
              <div className="h-7 mb-1"></div> {/* Spacer to match the crown on card 1 */}

              {/* Profile Photo */}
              <div className="relative">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-tr from-amber-400 to-orange-600 shadow-[0_0_25px_rgba(249,115,22,0.6)]">
                  <img
                    src={match.creator2.avatar}
                    alt={match.creator2.name}
                    className="w-full h-full object-cover rounded-full bg-slate-900"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/micah/svg?seed=${match.creator2.slug}`;
                    }}
                  />
                </div>

                {/* Platform Badge */}
                <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg border-2 border-[#1b110a]">
                  {match.creator2.platform === 'TikTok' ? (
                    <span className="text-[10px] font-black">TT</span>
                  ) : match.creator2.platform === 'Instagram' ? (
                    <span className="text-[10px] font-black">IG</span>
                  ) : (
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  )}
                </div>
              </div>

              {/* Creator Name */}
              <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-3 text-center tracking-tight">
                {match.creator2.name}
              </h2>

              {/* Verified Platform & Country */}
              <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 fill-sky-400/20" />
                <span>{match.creator2.platform}</span>
                <span className="text-slate-500">•</span>
                <span>{match.creator2.region}</span>
              </div>

              {/* Subscribers & Live Social Follower Tracker */}
              <div className="w-full mt-3">
                <SocialFollowerLiveBadge creator={match.creator2} size="md" />
              </div>
            </div>

            {/* Likes & Hype Section (UNLIMITED LIKES) */}
            <div className="mt-4 p-2.5 rounded-2xl bg-[#23140a] border border-orange-500/20 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-rose-500 text-lg">❤️</span>
                <div>
                  <div className="text-white font-extrabold text-sm leading-none font-mono">
                    {likes2.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400">Unlimited Fan Likes</div>
                </div>
              </div>

              {/* Rapid Like Button */}
              <button
                onClick={(e) => handleLikeClick(match.creator2.id, e)}
                className="relative flex items-center gap-1.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-full shadow-[0_0_15px_rgba(244,63,94,0.4)] active:scale-90 transition-all cursor-pointer"
                  title="Send one fan reaction"
              >
                <Heart className="w-3.5 h-3.5 fill-current" />
                <span>LIKE</span>
                {comboC2 > 1 && (
                  <span className="absolute -top-3 -right-2 bg-amber-400 text-black text-[10px] font-black px-1.5 py-0.2 rounded-full shadow animate-bounce">
                    x{comboC2}
                  </span>
                )}
              </button>
            </div>

            {/* Vote Action Button */}
            <div className="mt-4 flex flex-col items-center">
              <button
                id={`btn-vote-${match.creator2.id}`}
                onClick={() => handleVoteClick(match.creator2.id)}
                className={`w-full py-3 px-6 rounded-full font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
                  isVotedC2
                    ? 'bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                    : 'bg-orange-600 hover:bg-orange-500 text-white shadow-[0_0_25px_rgba(234,88,12,0.6)] hover:shadow-[0_0_35px_rgba(249,115,22,0.75)] active:scale-[0.98]'
                }`}
              >
                {isVotedC2 ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Voted ✓</span>
                  </>
                ) : (
                  <>
                    <ThumbsUp className="w-4 h-4 fill-current" />
                    <span>VOTE FOR {match.creator2.name.toUpperCase()}</span>
                  </>
                )}
              </button>

              <div className="mt-2.5 grid grid-cols-2 gap-2 w-full text-[11px] text-slate-400 px-1">
                <span>Votes <strong className="text-white font-mono">{match.votes2.toLocaleString()}</strong></span>
                <span className="text-right">Share <strong className="text-orange-300 font-mono">{votesRatio2}%</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Arena Real-time Sentiment & Voting Velocity Gauge Bar */}
      <div className="mt-4">
        <SentimentMeter match={match} variant="expanded" />
      </div>
    </div>
  );
};

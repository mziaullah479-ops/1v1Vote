import React from 'react';
import { Flame, Trophy, TrendingUp, Sparkles, ArrowRight, Activity, Users } from 'lucide-react';
import { Match } from '../types';

interface HomeHeroProps {
  featuredMatch?: Match | null;
  totalBattles: number;
  totalVotesCount: number;
  onSelectMatch: (match: Match) => void;
  onExploreClick: () => void;
}

export const HomeHero: React.FC<HomeHeroProps> = ({
  featuredMatch,
  totalBattles,
  totalVotesCount,
  onSelectMatch,
  onExploreClick,
}) => {
  return (
    <div className="home-hero-shell w-full max-w-6xl mx-auto px-3 sm:px-4 pt-4 pb-2">
      {/* Hero Container */}
      <div className="home-hero-card relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#0c152c] via-[#091022] to-[#070b16] border border-sky-500/30 p-6 sm:p-10 shadow-[0_0_50px_rgba(56,189,248,0.12)]">
        {/* Glow ambient spots */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none translate-y-1/2"></div>

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Top Badge: 1v1Vote Official Stadium */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0a1835] border border-sky-500/50 shadow-[0_0_20px_rgba(56,189,248,0.25)] text-xs font-extrabold text-sky-300 mb-4 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span className="tracking-wide uppercase">1v1Vote — Official Creator Arena</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight max-w-3xl leading-tight">
            Who Rules Social Media?{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-400 drop-shadow-[0_0_20px_rgba(56,189,248,0.3)]">
              You Decide.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mt-3.5 leading-relaxed font-medium">
            Vote in real-time battles between top YouTubers, TikTokers, and Instagram icons.
            Every single vote moves the live stock-trading trendlines. Select any battle below to enter the live arena!
          </p>

          {/* Quick Metrics Strip */}
          <div className="home-hero-metrics flex flex-wrap items-center justify-center gap-4 sm:gap-8 my-6 text-xs text-slate-400 bg-slate-900/60 border border-slate-800/80 px-5 py-2.5 rounded-2xl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-white font-bold text-sm">{totalBattles}</span>
              <span>Active Battles</span>
            </div>
            <div className="h-4 w-px bg-slate-800 hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-400" />
              <span className="text-white font-bold text-sm">{totalVotesCount.toLocaleString()}+</span>
              <span>Total Votes Cast</span>
            </div>
            <div className="h-4 w-px bg-slate-800 hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>Live Stock Charts</span>
            </div>
          </div>

          {/* Reserve the featured slot so backend data cannot shift the page. */}
          <div className="home-hero-featured-slot w-full max-w-xl mt-2 min-h-[126px] sm:min-h-[78px]">
            {featuredMatch && (
              <div className="home-hero-featured w-full bg-gradient-to-r from-sky-950/70 via-[#0a1428] to-orange-950/70 border border-slate-700/80 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex -space-x-3">
                  <img
                    src={featuredMatch.creator1.avatar}
                    alt={featuredMatch.creator1.name}
                    width={44}
                    height={44}
                    decoding="async"
                    className="w-11 h-11 rounded-full object-cover border-2 border-sky-400 shadow"
                  />
                  <img
                    src={featuredMatch.creator2.avatar}
                    alt={featuredMatch.creator2.name}
                    width={44}
                    height={44}
                    decoding="async"
                    className="w-11 h-11 rounded-full object-cover border-2 border-orange-400 shadow"
                  />
                </div>
                <div className="text-left min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-400">
                    <Flame className="w-3 h-3 fill-current text-sky-400" />
                    <span>#1 Trending Battle</span>
                  </div>
                  <div className="text-white font-bold text-sm truncate">
                    {featuredMatch.creator1.name} vs {featuredMatch.creator2.name}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => onSelectMatch(featuredMatch)}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold text-xs shadow-[0_0_15px_rgba(56,189,248,0.4)] active:scale-95 transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <span>Enter Arena</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={onExploreClick}
                  className="px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-xs active:scale-95 transition-all flex items-center justify-center gap-1 shrink-0 cursor-pointer"
                >
                  <span>All Battles</span>
                </button>
              </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Flame, Clock, Users, ArrowRight, Filter, Heart, Eye, Share2 } from 'lucide-react';
import { Match, Platform, Region } from '../types';
import { SocialFollowerLiveBadge } from './SocialFollowerLiveBadge';

interface ActiveMatchesGridProps {
  matches: Match[];
  onSelectMatch: (match: Match) => void;
  selectedSlug?: string;
}

export const ActiveMatchesGrid: React.FC<ActiveMatchesGridProps> = ({
  matches,
  onSelectMatch,
  selectedSlug,
}) => {
  const [platformFilter, setPlatformFilter] = useState<string>('All');
  const [regionFilter, setRegionFilter] = useState<string>('All');

  const filteredMatches = matches.filter((m) => {
    if (m.status !== 'active' || new Date(m.endTime).getTime() <= Date.now()) return false;
    if (platformFilter !== 'All' && m.creator1.platform !== platformFilter && m.creator2.platform !== platformFilter && m.category !== platformFilter) {
      return false;
    }
    if (regionFilter !== 'All' && m.region !== regionFilter && m.creator1.region !== regionFilter && m.creator2.region !== regionFilter) {
      return false;
    }
    return true;
  });

  const calculateTimeRemaining = (endTimeStr: string) => {
    const diff = new Date(endTimeStr).getTime() - Date.now();
    if (diff <= 0) return 'Ending soon';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  const isUpcoming = (match: Match) => new Date(match.startTime).getTime() > Date.now();

  return (
    <section id="active-matches-section" className="mobile-match-section w-full max-w-6xl mx-auto my-10 px-2 sm:px-4">
      {/* Section Header & Filters */}
      <div className="mobile-match-header flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1 text-sky-400 font-bold text-xs uppercase tracking-wider">
            <Flame className="w-4 h-4 fill-current text-sky-400" />
            <span>Active Influencer Arena</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Trending Head-to-Head Battles
          </h2>
        </div>

        {/* Filter Pills */}
        <div className="mobile-filter-bar flex flex-wrap items-center gap-2">
          {/* Platform Filter */}
          <div className="flex items-center gap-1 bg-[#0a1224] p-1 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-500 text-[10px] uppercase font-bold px-2 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Platform:
            </span>
            {['All', 'YouTube', 'TikTok', 'Instagram'].map((p) => (
              <button
                key={p}
                onClick={() => setPlatformFilter(p)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  platformFilter === p
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Region Filter */}
          <div className="flex items-center gap-1 bg-[#0a1224] p-1 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-500 text-[10px] uppercase font-bold px-2">
              Region:
            </span>
            {['All', 'Pakistan', 'India', 'USA', 'Global'].map((r) => (
              <button
                key={r}
                onClick={() => setRegionFilter(r)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  regionFilter === r
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Battles */}
      {filteredMatches.length === 0 ? (
        <div className="bg-[#09101d] border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-sm">
          No active matches found matching the selected platform or region filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMatches.map((m) => {
            const isCurrent = m.slug === selectedSlug;
            const total = m.votes1 + m.votes2;
            const p1 = total > 0 ? ((m.votes1 / total) * 100).toFixed(1) : '50.0';
            const p2 = total > 0 ? ((m.votes2 / total) * 100).toFixed(1) : '50.0';

            return (
              <div
                key={m.id}
                onClick={() => onSelectMatch(m)}
                className={`group relative bg-gradient-to-b from-[#091122] to-[#070c17] rounded-2xl p-5 border transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                  isCurrent
                    ? 'border-sky-500 shadow-[0_0_25px_rgba(56,189,248,0.35)] ring-1 ring-sky-400'
                    : 'border-slate-800 hover:border-slate-700 hover:shadow-xl hover:-translate-y-0.5'
                }`}
              >
                {/* Card Top: Badges */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`flex items-center gap-1 text-[11px] font-semibold ${isUpcoming(m) ? 'text-amber-300 bg-amber-950/60 border-amber-800/60' : 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60'} border px-2.5 py-0.5 rounded-full`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isUpcoming(m) ? 'bg-amber-300' : 'bg-emerald-400 animate-pulse'}`}></span>
                    {isUpcoming(m) ? 'SCHEDULED' : 'LIVE BATTLE'}
                  </span>

                  <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {isUpcoming(m) ? `Starts in ${calculateTimeRemaining(m.startTime)}` : calculateTimeRemaining(m.endTime)}
                  </span>
                </div>

                {/* Creators Clash Row */}
                <div className="flex items-center justify-between gap-3 my-2">
                  {/* Creator 1 */}
                  <div className="flex flex-col items-center text-center flex-1 min-w-0">
                    <div className="relative">
                      <img
                        src={m.creator1.avatar}
                        alt={m.creator1.name}
                        width={64}
                        height={64}
                        loading="lazy"
                        decoding="async"
                        className="w-16 h-16 rounded-full object-cover border-2 border-sky-500/80 p-0.5 bg-slate-900 shadow-md group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/micah/svg?seed=${m.creator1.slug}`;
                        }}
                      />
                      <span className="absolute -bottom-1 -right-1 bg-red-600 text-[9px] font-black text-white px-1.5 py-0.5 rounded-full">
                        {m.creator1.platform === 'TikTok' ? 'TT' : m.creator1.platform === 'Instagram' ? 'IG' : 'YT'}
                      </span>
                    </div>

                    <h4 className="text-white font-bold text-sm mt-2 truncate w-full">
                      {m.creator1.name}
                    </h4>
                    <span className="text-emerald-400 font-extrabold text-base">
                      {p1}%
                    </span>
                    <div className="mt-1">
                      <SocialFollowerLiveBadge creator={m.creator1} size="sm" showLink={false} />
                    </div>
                  </div>

                  {/* VS Badge */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className="font-black italic text-xl text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-orange-500">
                      VS
                    </div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 mt-1">
                      {m.region}
                    </span>
                  </div>

                  {/* Creator 2 */}
                  <div className="flex flex-col items-center text-center flex-1 min-w-0">
                    <div className="relative">
                      <img
                        src={m.creator2.avatar}
                        alt={m.creator2.name}
                        width={64}
                        height={64}
                        loading="lazy"
                        decoding="async"
                        className="w-16 h-16 rounded-full object-cover border-2 border-orange-500/80 p-0.5 bg-slate-900 shadow-md group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/micah/svg?seed=${m.creator2.slug}`;
                        }}
                      />
                      <span className="absolute -bottom-1 -right-1 bg-red-600 text-[9px] font-black text-white px-1.5 py-0.5 rounded-full">
                        {m.creator2.platform === 'TikTok' ? 'TT' : m.creator2.platform === 'Instagram' ? 'IG' : 'YT'}
                      </span>
                    </div>

                    <h4 className="text-white font-bold text-sm mt-2 truncate w-full">
                      {m.creator2.name}
                    </h4>
                    <span className="text-orange-400 font-extrabold text-base">
                      {p2}%
                    </span>
                    <div className="mt-1">
                      <SocialFollowerLiveBadge creator={m.creator2} size="sm" showLink={false} />
                    </div>
                  </div>
                </div>

                {/* Progress bar split */}
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex my-3">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${p1}%` }}
                  ></div>
                  <div
                    className="h-full bg-orange-500 transition-all duration-300"
                    style={{ width: `${p2}%` }}
                  ></div>
                </div>

                {/* Card Bottom CTA */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-500" />
                      {total.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3 text-slate-500" />
                      {(m.views || 0).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1 text-rose-400/90 font-medium">
                      <Heart className="w-3 h-3 fill-current text-rose-500" />
                      {((m.likes1 || 0) + (m.likes2 || 0)).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1 text-sky-300/80">
                      <Share2 className="w-3 h-3" />
                      {(m.shares || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="text-sky-400 group-hover:text-sky-300 font-bold flex items-center gap-1.5 transition-colors bg-sky-950/40 px-2.5 py-1 rounded-lg border border-sky-800/40">
                    <span className="text-[11px] sm:text-xs">Open Arena</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

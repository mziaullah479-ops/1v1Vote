import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Match } from '../types';

interface VoteShareCardsProps {
  match: Match;
}

export const VoteShareCards: React.FC<VoteShareCardsProps> = ({ match }) => {
  const totalVotes = match.votes1 + match.votes2;
  const p1 = totalVotes > 0 ? Number(((match.votes1 / totalVotes) * 100).toFixed(1)) : 50.0;
  const p2 = totalVotes > 0 ? Number(((match.votes2 / totalVotes) * 100).toFixed(1)) : 50.0;

  return (
    <div className="w-full max-w-6xl mx-auto my-4 px-2 sm:px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* ================= CREATOR 1 VOTE SHARE CARD ================= */}
        <div className="bg-[#081720]/90 rounded-2xl p-4 sm:p-5 border border-emerald-500/50 shadow-[0_0_25px_rgba(16,185,129,0.15)] flex items-center justify-between gap-4 transition-all hover:border-emerald-400">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            {/* Avatar thumbnail */}
            <div className="relative shrink-0">
              <div className="w-13 h-13 rounded-full p-0.5 bg-gradient-to-tr from-sky-400 to-emerald-400">
                <img
                  src={match.creator1.avatar}
                  alt={match.creator1.name}
                  className="w-12 h-12 rounded-full object-cover bg-slate-900"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/micah/svg?seed=${match.creator1.slug}`;
                  }}
                />
              </div>
            </div>

            {/* Info + Progress Bar */}
            <div className="min-w-0 flex-1">
              <h4 className="text-white font-bold text-base sm:text-lg truncate">
                {match.creator1.name}
              </h4>

              <div className="flex items-center gap-1 text-xs text-emerald-400 font-medium mb-2">
                <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-500/20" />
                <span>{match.creator1.subscribers} Subscribers</span>
              </div>

              {/* Progress track */}
              <div className="w-full h-2.5 bg-slate-800/90 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"
                  style={{ width: `${Math.min(100, p1)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Share Percentage */}
          <div className="text-right shrink-0">
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]">
              {p1}%
            </div>
            <div className="text-[11px] font-semibold text-slate-400 whitespace-nowrap">
              Current Vote Share
            </div>
          </div>
        </div>

        {/* ================= CREATOR 2 VOTE SHARE CARD ================= */}
        <div className="bg-[#1c110b]/90 rounded-2xl p-4 sm:p-5 border border-orange-500/50 shadow-[0_0_25px_rgba(249,115,22,0.15)] flex items-center justify-between gap-4 transition-all hover:border-orange-400">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            {/* Avatar thumbnail */}
            <div className="relative shrink-0">
              <div className="w-13 h-13 rounded-full p-0.5 bg-gradient-to-tr from-amber-400 to-orange-500">
                <img
                  src={match.creator2.avatar}
                  alt={match.creator2.name}
                  className="w-12 h-12 rounded-full object-cover bg-slate-900"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/micah/svg?seed=${match.creator2.slug}`;
                  }}
                />
              </div>
            </div>

            {/* Info + Progress Bar */}
            <div className="min-w-0 flex-1">
              <h4 className="text-white font-bold text-base sm:text-lg truncate">
                {match.creator2.name}
              </h4>

              <div className="flex items-center gap-1 text-xs text-orange-400 font-medium mb-2">
                <CheckCircle2 className="w-3.5 h-3.5 fill-orange-500/20" />
                <span>{match.creator2.subscribers} Subscribers</span>
              </div>

              {/* Progress track */}
              <div className="w-full h-2.5 bg-slate-800/90 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]"
                  style={{ width: `${Math.min(100, p2)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Share Percentage */}
          <div className="text-right shrink-0">
            <div className="text-2xl sm:text-3xl font-black text-orange-400 tracking-tight drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]">
              {p2}%
            </div>
            <div className="text-[11px] font-semibold text-slate-400 whitespace-nowrap">
              Current Vote Share
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

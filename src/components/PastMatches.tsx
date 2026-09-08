import React from 'react';
import { Trophy, CheckCircle, ArrowUpRight } from 'lucide-react';
import { Match } from '../types';

interface PastMatchesProps {
  matches: Match[];
  onSelectMatch: (match: Match) => void;
}

export const PastMatches: React.FC<PastMatchesProps> = ({ matches, onSelectMatch }) => {
  const endedMatches = matches.filter((m) => m.status === 'ended');

  if (endedMatches.length === 0) return null;

  return (
    <section className="w-full max-w-6xl mx-auto my-12 px-2 sm:px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Trophy className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>Hall of Fame</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Past Matches & Concluded Battles
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {endedMatches.map((m) => {
          const total = m.votes1 + m.votes2;
          const p1 = total > 0 ? ((m.votes1 / total) * 100).toFixed(1) : '50.0';
          const p2 = total > 0 ? ((m.votes2 / total) * 100).toFixed(1) : '50.0';
          const winnerIsC1 = m.winnerId ? m.winnerId === m.creator1.id : m.votes1 >= m.votes2;

          return (
            <div
              key={m.id}
              onClick={() => onSelectMatch(m)}
              className="bg-[#080e1b] rounded-2xl p-5 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-all hover:shadow-lg flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                <span className="bg-slate-800/80 text-slate-300 font-semibold px-2.5 py-0.5 rounded-full border border-slate-700">
                  Concluded Battle
                </span>
                <span>{total.toLocaleString()} Total Votes</span>
              </div>

              {/* Creator 1 vs Creator 2 with Winner Highlights */}
              <div className="grid grid-cols-2 gap-3 my-2">
                {/* Creator 1 */}
                <div
                  className={`p-3 rounded-xl border flex items-center gap-3 ${
                    winnerIsC1
                      ? 'bg-amber-950/20 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                      : 'bg-slate-900/40 border-slate-800'
                  }`}
                >
                  <div className="relative">
                    <img
                      src={m.creator1.avatar}
                      alt={m.creator1.name}
                      className="w-12 h-12 rounded-full object-cover bg-slate-800"
                    />
                    {winnerIsC1 && (
                      <div className="absolute -top-2 -right-2 bg-amber-400 text-slate-950 rounded-full p-1 shadow">
                        <Trophy className="w-3 h-3 fill-current" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <h4 className="text-white font-bold text-xs sm:text-sm truncate">
                        {m.creator1.name}
                      </h4>
                      {winnerIsC1 && <CheckCircle className="w-3 h-3 text-amber-400 shrink-0" />}
                    </div>
                    <div className="text-emerald-400 font-extrabold text-sm">{p1}%</div>
                    {winnerIsC1 && <span className="text-[10px] text-amber-400 font-bold uppercase">Winner</span>}
                  </div>
                </div>

                {/* Creator 2 */}
                <div
                  className={`p-3 rounded-xl border flex items-center gap-3 ${
                    !winnerIsC1
                      ? 'bg-amber-950/20 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                      : 'bg-slate-900/40 border-slate-800'
                  }`}
                >
                  <div className="relative">
                    <img
                      src={m.creator2.avatar}
                      alt={m.creator2.name}
                      className="w-12 h-12 rounded-full object-cover bg-slate-800"
                    />
                    {!winnerIsC1 && (
                      <div className="absolute -top-2 -right-2 bg-amber-400 text-slate-950 rounded-full p-1 shadow">
                        <Trophy className="w-3 h-3 fill-current" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <h4 className="text-white font-bold text-xs sm:text-sm truncate">
                        {m.creator2.name}
                      </h4>
                      {!winnerIsC1 && <CheckCircle className="w-3 h-3 text-amber-400 shrink-0" />}
                    </div>
                    <div className="text-orange-400 font-extrabold text-sm">{p2}%</div>
                    {!winnerIsC1 && <span className="text-[10px] text-amber-400 font-bold uppercase">Winner</span>}
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="truncate pr-2">{m.description}</span>
                <span className="text-sky-400 font-bold flex items-center gap-1 shrink-0">
                  View Timeline <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

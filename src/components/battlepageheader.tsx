import React from 'react';
import { ArrowLeft, Share2, Flame, ChevronDown, Check, Eye } from 'lucide-react';
import { Match } from '../types';

interface BattlePageHeaderProps {
  currentMatch: Match;
  allMatches: Match[];
  onBackToHome: () => void;
  onSelectMatch: (m: Match) => void;
  onShare: () => void;
}

export const BattlePageHeader: React.FC<BattlePageHeaderProps> = ({
  currentMatch,
  allMatches,
  onBackToHome,
  onSelectMatch,
  onShare,
}) => {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  const activeMatches = allMatches.filter((m) => m.status === 'active');

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 pt-4 pb-2">
      {/* Top action row */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0a1224]/90 border border-slate-800 rounded-2xl p-3 sm:px-5 shadow-lg">
        {/* Left: Back to All Battles Button */}
        <button
          onClick={onBackToHome}
          className="flex items-center gap-2 bg-[#0e1c36] hover:bg-[#13264b] text-sky-300 hover:text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border border-sky-500/30 shadow-[0_0_15px_rgba(56,189,248,0.2)] cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>← Back to All Battles (Home)</span>
        </button>

        {/* Center: Live Match Title & Switcher */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold text-white transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5 text-amber-400">
              <Flame className="w-4 h-4 fill-amber-400" />
              <span className="hidden sm:inline text-slate-400 font-normal">Clash:</span>
            </span>
            <span className="truncate max-w-[200px] sm:max-w-xs">{currentMatch.title}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-0 z-50 w-72 bg-[#091122] border border-slate-700 rounded-2xl shadow-2xl p-2 animate-fade-in">
              <div className="text-[10px] uppercase font-bold text-slate-400 px-3 py-1.5 border-b border-slate-800 mb-1">
                Switch Live Battle
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {activeMatches.map((m) => {
                  const isSelected = m.id === currentMatch.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        onSelectMatch(m);
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <span className="truncate pr-2">{m.title}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: Status & Share Button */}
        <div className="flex items-center gap-2">
          <span className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400 font-semibold">
            <Eye className="w-3.5 h-3.5 text-sky-400" />
            {(currentMatch.views || 0).toLocaleString()} views
          </span>
          <span className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            LIVE 1v1 ARENA
          </span>

          <button
            onClick={onShare}
            className="flex items-center gap-1.5 bg-[#0e172e] hover:bg-blue-600 hover:text-white text-slate-300 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
            title="Share this battle"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>
      </div>
    </div>
  );
};

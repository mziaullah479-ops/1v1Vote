import React from 'react';
import { ShieldCheck, Heart, Sparkles } from 'lucide-react';
import { AdSensePlaceholder } from './AdSensePlaceholder';

interface FooterProps {
  onSelectTab: (tab: 'home' | 'battles' | 'leaderboard' | 'about' | 'admin') => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTab }) => {
  return (
    <footer className="w-full bg-[#050811] border-t border-slate-800/80 pt-10 pb-12 mt-16 text-xs text-slate-400">
      {/* Footer Banner Ad Placement */}
      <AdSensePlaceholder slotType="footer-banner" />

      <div className="max-w-6xl mx-auto px-4 mt-8 flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-800/60 pb-8">
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <div className="flex items-center tracking-tight mb-1">
            <span className="bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-white font-black text-lg px-2 py-0.5 rounded-lg shadow-md italic tracking-tighter mr-1.5">
              1v1
            </span>
            <span className="text-white font-extrabold text-lg">Vote</span>
          </div>
          <p className="text-slate-400 text-xs max-w-sm">
            1v1Vote is the premier live creator matchup platform. Fans decide who dominates YouTube, TikTok, and Instagram across Pakistan, India, USA, and worldwide.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-6 font-semibold text-slate-300">
          <button onClick={() => onSelectTab('home')} className="hover:text-white transition-colors">
            Home Arena
          </button>
          <button onClick={() => onSelectTab('battles')} className="hover:text-white transition-colors">
            Active Battles
          </button>
          <button onClick={() => onSelectTab('leaderboard')} className="hover:text-white transition-colors">
            Top Voters
          </button>
          <button onClick={() => onSelectTab('about')} className="hover:text-white transition-colors">
            About Platform
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Device-fingerprint fraud prevention & rate-limiting enabled</span>
        </div>

        <div className="flex items-center gap-1">
          <span>Made for creator communities • Real-time influencer voting</span>
        </div>
      </div>
    </footer>
  );
};

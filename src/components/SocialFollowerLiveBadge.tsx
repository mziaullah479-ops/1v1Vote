import React from 'react';
import { ExternalLink, TrendingUp, Radio, Youtube, Instagram, Twitch } from 'lucide-react';
import { Creator, Platform } from '../types';

interface SocialFollowerLiveBadgeProps {
  creator: Creator;
  size?: 'sm' | 'md' | 'lg';
  showLink?: boolean;
}

export const SocialFollowerLiveBadge: React.FC<SocialFollowerLiveBadgeProps> = ({
  creator,
  size = 'md',
  showLink = true,
}) => {
  const getPlatformIcon = (platform: Platform) => {
    switch (platform) {
      case 'YouTube':
        return <Youtube className="w-3.5 h-3.5 text-red-500 fill-current" />;
      case 'Instagram':
        return <Instagram className="w-3.5 h-3.5 text-pink-500" />;
      case 'Twitch':
        return <Twitch className="w-3.5 h-3.5 text-purple-400" />;
      case 'TikTok':
        return (
          <svg className="w-3.5 h-3.5 fill-current text-teal-400" viewBox="0 0 24 24">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.17 1.17 2.11 2.34 2.37 1.05.23 2.19-.04 2.98-.77.62-.57.99-1.38 1.03-2.23.08-3.44.04-6.88.05-10.33V.02z" />
          </svg>
        );
      default:
        return <Radio className="w-3.5 h-3.5 text-sky-400" />;
    }
  };

  const followersDisplay = creator.followersCount || creator.subscribers || '1.0M';
  const growthRate = creator.growthRate || '+1.5k today';
  const url = creator.profileUrl || (creator.handle ? `https://youtube.com/${creator.handle}` : '#');

  if (size === 'sm') {
    return (
      <div className="inline-flex items-center gap-1.5 bg-[#091122]/90 border border-slate-800/80 px-2 py-0.5 rounded-md text-[10px]">
        {getPlatformIcon(creator.platform)}
        <span className="text-white font-bold">{followersDisplay}</span>
        <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
          <TrendingUp className="w-2.5 h-2.5" />
          {growthRate}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#0a1224]/85 border border-slate-800/90 hover:border-slate-700/80 transition-all rounded-xl p-2.5 sm:p-3 text-xs flex flex-col gap-1.5 shadow-sm">
      {/* Header: Platform & Live Ticker Dot */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
          {getPlatformIcon(creator.platform)}
          <span className="text-slate-200">{creator.platform}</span>
          {creator.handle && (
            <span className="text-slate-400 font-normal text-[11px] truncate max-w-[90px]">
              {creator.handle}
            </span>
          )}
        </div>

        {/* Live Pulse Indicator */}
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/50 text-[10px] text-emerald-300 font-bold shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>LIVE STATS</span>
        </div>
      </div>

      {/* Followers Counter & Growth Row */}
      <div className="flex items-baseline justify-between gap-2 pt-0.5">
        <div className="flex items-baseline gap-1.5">
          <span className="text-white font-black text-sm sm:text-base tracking-tight">
            {followersDisplay}
          </span>
          <span className="text-slate-400 text-[10px] uppercase font-medium">
            {creator.platform === 'YouTube' ? 'Subscribers' : 'Followers'}
          </span>
        </div>

        <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-900/40">
          <TrendingUp className="w-3 h-3 text-emerald-400" />
          <span>{growthRate}</span>
        </div>
      </div>

      {/* Official Profile Link */}
      {showLink && creator.profileUrl && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 font-medium transition-colors pt-0.5 group"
          title={`Visit official ${creator.name} ${creator.platform} page`}
        >
          <span>View Verified Profile</span>
          <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </a>
      )}
    </div>
  );
};

import React from 'react';

interface AdSensePlaceholderProps {
  slotType: 'header-banner' | 'in-content' | 'sidebar' | 'footer-banner';
  className?: string;
}

export const AdSensePlaceholder: React.FC<AdSensePlaceholderProps> = ({ slotType, className = '' }) => {
  const getSlotConfig = () => {
    switch (slotType) {
      case 'header-banner':
        return {
          title: 'Google AdSense • Top Leaderboard (728x90 / Responsive)',
          height: 'h-24 sm:h-28',
          label: 'Advertisement Space',
        };
      case 'in-content':
        return {
          title: 'Google AdSense • In-Article Billboard (970x250 / Fluid)',
          height: 'h-32 sm:h-44',
          label: 'Sponsored Content Slot',
        };
      case 'sidebar':
        return {
          title: 'Google AdSense • Half Page Sticky Unit (300x600)',
          height: 'h-72 sm:h-96',
          label: 'Sponsored Display',
        };
      case 'footer-banner':
        return {
          title: 'Google AdSense • Bottom Anchor Unit (728x90 / 320x50)',
          height: 'h-20 sm:h-24',
          label: 'Advertisement Banner',
        };
    }
  };

  const config = getSlotConfig();

  return (
    <div
      className={`w-full max-w-6xl mx-auto px-2 sm:px-4 my-4 ${className}`}
      data-adsense-ready="true"
      data-ad-slot={slotType}
    >
      <div
        className={`w-full ${config.height} rounded-2xl border-2 border-dashed border-slate-800/80 bg-[#070c18]/60 flex flex-col items-center justify-center text-center p-3 transition-colors hover:border-slate-700 select-none`}
      >
        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 bg-slate-900/90 px-2.5 py-0.5 rounded-full border border-slate-800 mb-1">
          {config.label}
        </span>
        <span className="text-xs font-semibold text-slate-400">
          {config.title}
        </span>
        <span className="text-[10px] text-slate-600 mt-0.5">
          Automated layout prepared for Google AdSense & Header Bidding integration
        </span>
      </div>
    </div>
  );
};

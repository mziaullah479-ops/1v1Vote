import React from 'react';
import { Zap, BarChart2, Trophy, Heart } from 'lucide-react';

export const FeatureBar: React.FC = () => {
  const features = [
    {
      icon: Zap,
      title: 'Real-Time Voting',
      desc: 'See live results as they happen',
      iconBg: 'bg-blue-900/40 text-blue-400 border border-blue-700/50',
    },
    {
      icon: BarChart2,
      title: 'Live Analytics',
      desc: 'Track trends & vote percentage',
      iconBg: 'bg-indigo-900/40 text-indigo-400 border border-indigo-700/50',
    },
    {
      icon: Trophy,
      title: 'Epic Battles',
      desc: 'Your favorite creators face off',
      iconBg: 'bg-amber-900/40 text-amber-400 border border-amber-700/50',
    },
    {
      icon: Heart,
      title: 'Support Your Creator',
      desc: 'One vote can change everything',
      iconBg: 'bg-rose-900/40 text-rose-400 border border-rose-700/50',
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto my-6 px-2 sm:px-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {features.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="bg-[#09101d] hover:bg-[#0c1527] border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3.5 transition-all duration-200"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${item.iconBg}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h5 className="text-white text-xs sm:text-sm font-bold truncate">
                  {item.title}
                </h5>
                <p className="text-slate-400 text-xs truncate mt-0.5">
                  {item.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

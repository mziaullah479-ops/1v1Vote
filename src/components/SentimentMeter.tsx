import React, { useState, useEffect, useRef } from 'react';
import { Gauge, Zap, TrendingUp, Flame } from 'lucide-react';
import { Match, LiveVoteEvent } from '../types';
import { MatchStore } from '../data/store';

interface SentimentMeterProps {
  match: Match;
  creatorId?: string;
  variant?: 'inline' | 'compact' | 'expanded';
  showLabel?: boolean;
}

export const SentimentMeter: React.FC<SentimentMeterProps> = ({
  match,
  creatorId,
  variant = 'inline',
  showLabel = true,
}) => {
  // Recent votes velocity calculation (votes per minute & sentiment bias 0-100 where 0 = full blue, 100 = full orange)
  const [velocityRate, setVelocityRate] = useState<number>(58); // votes / min
  const [sentimentScore, setSentimentScore] = useState<number>(50); // 0 (100% Blue) to 100 (100% Orange)
  const [isSpiking, setIsSpiking] = useState<boolean>(false);
  const [lastVoteCreator, setLastVoteCreator] = useState<'c1' | 'c2' | null>(null);

  const prevVotes1 = useRef(match.votes1);
  const prevVotes2 = useRef(match.votes2);
  const decayTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check if votes updated
    const d1 = match.votes1 - prevVotes1.current;
    const d2 = match.votes2 - prevVotes2.current;

    prevVotes1.current = match.votes1;
    prevVotes2.current = match.votes2;

    if (d1 > 0 || d2 > 0) {
      setIsSpiking(true);
      if (d1 > d2) {
        setLastVoteCreator('c1');
        setSentimentScore((prev) => Math.max(8, prev - 7));
        setVelocityRate((prev) => Math.min(240, prev + 18));
      } else {
        setLastVoteCreator('c2');
        setSentimentScore((prev) => Math.min(92, prev + 7));
        setVelocityRate((prev) => Math.min(240, prev + 18));
      }

      if (decayTimerRef.current) clearTimeout(decayTimerRef.current);
      decayTimerRef.current = setTimeout(() => {
        setIsSpiking(false);
      }, 800);
    }
  }, [match.votes1, match.votes2]);

  // Periodic velocity recalculation and gentle return to match ratio
  useEffect(() => {
    const interval = setInterval(() => {
      // Base ratio from match votes
      const total = match.votes1 + match.votes2 || 1;
      const targetScore = Math.round((match.votes2 / total) * 100);

      // Smooth drift towards target
      setSentimentScore((current) => {
        const step = (targetScore - current) * 0.1;
        return Number((current + step).toFixed(1));
      });

      // Gradually decay velocity rate back towards baseline (30-65 v/m)
      setVelocityRate((current) => {
        const baseline = 42 + (match.votes1 % 20);
        if (current > baseline) {
          return Math.max(baseline, Math.round(current * 0.92));
        }
        return baseline;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [match.votes1, match.votes2]);

  // Compute colors based on sentimentScore (0 = Blue, 100 = Orange)
  // When close to 0: vibrant Sky Blue / Cyan (#38bdf8)
  // When around 50: Purple / Indigo blend (#818cf8)
  // When close to 100: vibrant Orange / Amber (#fb923c)
  const isC1 = creatorId === match.creator1.id;
  const isC2 = creatorId === match.creator2.id;

  // Blue dominance = 100 - sentimentScore; Orange dominance = sentimentScore
  const blueDominance = Math.max(0, Math.min(100, 100 - sentimentScore));
  const orangeDominance = Math.max(0, Math.min(100, sentimentScore));

  const activeDominance = isC1
    ? blueDominance
    : isC2
    ? orangeDominance
    : Math.max(blueDominance, orangeDominance);

  // Dynamic gradient string depending on real-time sentiment
  // Uses color-changing gradients (blue to orange)
  const gradientStyle = {
    background: `linear-gradient(90deg, 
      #0284c7 0%, 
      #38bdf8 ${Math.max(10, 100 - sentimentScore)}%, 
      #f97316 ${Math.min(90, 100 - sentimentScore + 15)}%, 
      #ea580c 100%)`,
  };

  const statusLabel =
    sentimentScore < 45
      ? `${match.creator1.name} Surging`
      : sentimentScore > 55
      ? `${match.creator2.name} Surging`
      : 'Even Velocity';

  // Compact inline version specifically styled to sit right next to "Votes: 89,452"
  if (variant === 'inline') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border transition-all duration-300 ${
          isSpiking
            ? 'scale-105 border-amber-400/80 bg-slate-900/95 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
            : 'border-slate-800 bg-[#070e1c]/90'
        }`}
        title={`Voting Velocity: ${velocityRate} votes/min. Sentiment: ${Math.round(blueDominance)}% Blue vs ${Math.round(orangeDominance)}% Orange`}
      >
        {/* Dynamic Mini Pulse Icon */}
        <span className="relative flex h-2 w-2">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              sentimentScore < 50 ? 'bg-sky-400' : 'bg-orange-400'
            }`}
          ></span>
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              sentimentScore < 50 ? 'bg-sky-500' : 'bg-orange-500'
            }`}
          ></span>
        </span>

        {showLabel && (
          <span className="text-[10px] font-bold text-slate-300 tracking-tight flex items-center gap-1">
            <Gauge className="w-2.5 h-2.5 text-sky-400" />
            <span className="hidden sm:inline">Velocity:</span>
          </span>
        )}

        {/* Dynamic Color-Changing Gradient Meter Track */}
        <div className="relative w-16 sm:w-20 h-2 bg-slate-800/90 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
          {/* Background gradient from Blue (#38bdf8) to Orange (#fb923c) */}
          <div
            className="w-full h-full rounded-full transition-all duration-500"
            style={gradientStyle}
          />
          {/* Moving Needle / Velocity Indicator */}
          <div
            className="absolute top-0 bottom-0 w-1.5 bg-white rounded-full shadow-[0_0_6px_#ffffff] transition-all duration-300 transform -translate-x-1/2"
            style={{ left: `${sentimentScore}%` }}
          />
        </div>

        {/* Real-time Rate readout */}
        <span
          className={`text-[10px] font-mono font-extrabold ${
            sentimentScore < 45
              ? 'text-sky-400'
              : sentimentScore > 55
              ? 'text-orange-400'
              : 'text-slate-300'
          }`}
        >
          {velocityRate} v/m
        </span>
      </div>
    );
  }

  // Expanded detailed arena version
  return (
    <div
      className={`w-full bg-[#081020]/95 border rounded-2xl p-3 sm:p-4 transition-all duration-300 shadow-lg ${
        isSpiking
          ? 'border-sky-400/60 shadow-[0_0_20px_rgba(56,189,248,0.25)]'
          : 'border-slate-800/90'
      }`}
    >
      {/* Header Row: Title and Real-time Velocity Badge */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded-lg bg-blue-950/60 border border-blue-800/60 text-sky-400">
            <Gauge className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-white flex items-center gap-1.5">
              <span>Live Sentiment & Velocity Meter</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </h4>
            <p className="text-[10px] text-slate-400">Real-time vote momentum & speed</p>
          </div>
        </div>

        {/* Speed Ticker */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 px-2.5 py-1 rounded-full text-xs font-mono font-bold">
          <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
          <span className="text-white">{velocityRate}</span>
          <span className="text-[10px] text-slate-400 font-normal">votes/min</span>
        </div>
      </div>

      {/* Visual Color-Changing Gradient Gauge */}
      <div className="relative my-2">
        {/* Top Labels */}
        <div className="flex justify-between text-[10px] font-bold mb-1">
          <span className="text-sky-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
            {match.creator1.name} ({Math.round(blueDominance)}%)
          </span>
          <span className="text-slate-400 font-medium text-[9px] uppercase tracking-wider">
            {statusLabel}
          </span>
          <span className="text-orange-400 flex items-center gap-1">
            {match.creator2.name} ({Math.round(orangeDominance)}%)
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
          </span>
        </div>

        {/* Gradient Track: Blue to Orange */}
        <div className="relative h-3 sm:h-3.5 w-full rounded-full bg-slate-950 border border-slate-700/70 p-0.5 overflow-visible">
          <div
            className="w-full h-full rounded-full transition-all duration-300 shadow-inner"
            style={gradientStyle}
          />

          {/* Real-time Indicator Pin / Needle */}
          <div
            className="absolute -top-1 bottom-0 w-3 h-5 bg-white border-2 border-slate-900 rounded-full shadow-[0_0_10px_#ffffff] transition-all duration-300 transform -translate-x-1/2 cursor-pointer"
            style={{ left: `${sentimentScore}%` }}
            title={`Real-time needle: ${sentimentScore}%`}
          >
            <div className="w-1 h-1 bg-blue-600 rounded-full mx-auto mt-1.5"></div>
          </div>
        </div>

        {/* Hash Marks */}
        <div className="flex justify-between px-1 mt-1 text-[9px] text-slate-400 font-mono">
          <span>100% Blue</span>
          <span className="text-slate-400">| 50/50 Neutral |</span>
          <span>100% Orange</span>
        </div>
      </div>
    </div>
  );
};

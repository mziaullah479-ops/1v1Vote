import React, { useState, useEffect } from 'react';
import { Clock, BarChart2, Share2, TrendingUp, Zap, Radio, Sparkles } from 'lucide-react';
import { Match, LiveVoteEvent } from '../types';
import { MatchStore } from '../data/store';

interface StockTradingChartProps {
  match: Match;
  onOpenShareModal: () => void;
  onVote?: (creatorId: string) => void;
}

export const StockTradingChart: React.FC<StockTradingChartProps> = ({
  match,
  onOpenShareModal,
  onVote,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [lastSurge, setLastSurge] = useState<{ creatorName: string; deltaP: number; isUp: boolean } | null>(null);
  const [pulseC1, setPulseC1] = useState(false);
  const [pulseC2, setPulseC2] = useState(false);
  const [recentEvents, setRecentEvents] = useState<LiveVoteEvent[]>([]);

  // Time remaining calculator
  const calculateTimeRemaining = (endTimeStr: string) => {
    const diff = new Date(endTimeStr).getTime() - Date.now();
    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    }
    return `${hours}h ${minutes}m`;
  };

  const timeRemaining = calculateTimeRemaining(match.endTime);

  // Poll recent events
  useEffect(() => {
    const events = MatchStore.getRecentVoteEvents(match.id);
    setRecentEvents(events.slice(0, 4));

    if (events.length > 0) {
      const latest = events[0];
      const isC1 = latest.creatorId === match.creator1.id;
      setLastSurge({
        creatorName: latest.creatorName,
        deltaP: latest.deltaP,
        isUp: isC1,
      });

      if (isC1) {
        setPulseC1(true);
        setTimeout(() => setPulseC1(false), 700);
      } else {
        setPulseC2(true);
        setTimeout(() => setPulseC2(false), 700);
      }
    }
  }, [match.votes1, match.votes2, match.historyPoints]);

  // Calculate live current vote percentages from the latest tick
  const totalVotes = match.votes1 + match.votes2;
  const rawPoints = match.historyPoints && match.historyPoints.length > 0
    ? match.historyPoints
    : [
        { timestamp: '0', timeLabel: '12:00 AM', p1: 45, p2: 55 },
        { timestamp: '1', timeLabel: 'Live', p1: 50, p2: 50 },
      ];

  const latestPoint = rawPoints[rawPoints.length - 1];
  const p1Current = latestPoint ? Number(latestPoint.p1.toFixed(1)) : 50.0;
  const p2Current = latestPoint ? Number(latestPoint.p2.toFixed(1)) : 50.0;

  // SVG dimensions with increased vertical space for trading waves
  const svgWidth = 900;
  const svgHeight = 310;
  const paddingLeft = 55;
  const paddingRight = 145; // Extra room for the side callout tags
  const paddingTop = 32;
  const paddingBottom = 46;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  // Y-axis full scale: 0% to 100% with central parity benchmark at 50%
  // This guarantees ample vertical separation between lines (e.g. 68% vs 32% creates a 36% gap!)
  const minY = 0;
  const maxY = 100;

  const getYCoord = (val: number) => {
    const clamped = Math.max(minY, Math.min(maxY, val));
    const ratio = (clamped - minY) / (maxY - minY);
    return paddingTop + chartHeight - ratio * chartHeight;
  };

  const getXCoord = (index: number, total: number) => {
    if (total <= 1) return paddingLeft;
    return paddingLeft + (index / (total - 1)) * chartWidth;
  };

  // Build SVG path points
  const points1 = rawPoints.map((pt, i) => ({
    x: getXCoord(i, rawPoints.length),
    y: getYCoord(pt.p1),
  }));

  const points2 = rawPoints.map((pt, i) => ({
    x: getXCoord(i, rawPoints.length),
    y: getYCoord(pt.p2),
  }));

  // Create smooth bezier path
  const createLinePath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    return pts.reduce((acc, curr, i, arr) => {
      if (i === 0) return `M ${curr.x} ${curr.y}`;
      const prev = arr[i - 1];
      const cx1 = prev.x + (curr.x - prev.x) / 2;
      const cy1 = prev.y;
      const cx2 = prev.x + (curr.x - prev.x) / 2;
      const cy2 = curr.y;
      return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${curr.x} ${curr.y}`;
    }, '');
  };

  const linePath1 = createLinePath(points1);
  const linePath2 = createLinePath(points2);

  const lastPt1 = points1[points1.length - 1] || { x: paddingLeft + chartWidth, y: getYCoord(p1Current) };
  const lastPt2 = points2[points2.length - 1] || { x: paddingLeft + chartWidth, y: getYCoord(p2Current) };

  // Calculate dynamic vertical separation & anti-overlap for callout tags
  const verticalDistance = Math.abs(lastPt1.y - lastPt2.y);
  const isCrowded = verticalDistance < 42;
  const calloutOffset1 = isCrowded ? (lastPt1.y < lastPt2.y ? -28 : 6) : -18;
  const calloutOffset2 = isCrowded ? (lastPt2.y < lastPt1.y ? -28 : 6) : -18;

  // Trading analytics
  const allP1 = rawPoints.map((p) => p.p1);
  const highP1 = Math.max(...allP1).toFixed(1);
  const lowP1 = Math.min(...allP1).toFixed(1);
  const spreadGap = Math.abs(p1Current - p2Current).toFixed(1);

  // Y-axis markers: 0% to 100% with central parity at 50%
  const yTicks = [100, 80, 60, 50, 40, 20, 0];
  const activePoint = hoverIndex !== null ? rawPoints[hoverIndex] : null;

  const handleManualQuickVote = (creatorId: string) => {
    if (onVote) {
      onVote(creatorId);
    } else {
      MatchStore.vote(match.id, creatorId);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto my-6 px-2 sm:px-4">
      {/* ================= STATUS PILL BAR ================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        {/* LIVE Badge & Ticker Pulse */}
        <div className="flex items-center gap-2.5 bg-[#061814] border border-emerald-500/40 text-emerald-400 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide shadow-[0_0_15px_rgba(16,185,129,0.25)]">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
          </span>
          <span className="tracking-wider">LIVE TICKER</span>
          <span className="text-slate-500 text-[10px]">|</span>
          <span className="text-emerald-300/80 font-mono text-[11px]">Real-Time Flow</span>
        </div>

        {/* Center Countdown Pill */}
        <div className="flex items-center gap-3 bg-[#0d162a] border border-sky-500/30 rounded-full px-5 py-1.5 shadow-[0_0_25px_rgba(56,189,248,0.15)]">
          <Clock className="w-4 h-4 text-sky-400" />
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs font-semibold">Match ends in:</span>
            <span className="text-white text-sm sm:text-base font-black tracking-wider drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
              {timeRemaining}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenShareModal}
            className="flex items-center gap-1.5 bg-[#0c1322] hover:bg-slate-800 border border-slate-700/80 text-sky-400 hover:text-sky-300 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm active:scale-95"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Chart</span>
          </button>

          <div className="hidden sm:flex items-center gap-1.5 bg-[#0e172a] border border-slate-800 px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-300">
            <BarChart2 className="w-3.5 h-3.5 text-blue-400" />
            <span>1 Vote = Live Swing</span>
          </div>
        </div>
      </div>

      {/* ================= STOCK TRADING STYLE CHART CARD ================= */}
      <div className="bg-[#070e1c] rounded-3xl p-4 sm:p-7 border border-slate-800/90 shadow-[0_0_45px_rgba(0,0,0,0.6)] relative overflow-hidden">
        {/* Top Header with Indicators & Quick Test Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h3 className="text-white text-base sm:text-lg font-black tracking-tight">
                Live Stock-Trading Vote Chart
              </h3>
              <span className="bg-sky-500/20 text-sky-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-sky-500/30 animate-pulse">
                Dynamic Movement
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              ہر ایک ووٹ سے لائنیں اوپر نیچے حرکت کرتی ہیں (Every vote visibly shifts the lines)
            </p>
          </div>

          {/* Quick Vote Simulator buttons to let users directly see the lines jump */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-400 font-semibold hidden lg:inline">Test Impact:</span>
            <button
              onClick={() => handleManualQuickVote(match.creator1.id)}
              className="flex items-center gap-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 hover:text-white px-3 py-1 rounded-full text-xs font-bold transition-all shadow-[0_0_12px_rgba(16,185,129,0.2)] active:scale-95"
            >
              <Zap className="w-3 h-3 text-emerald-400" />
              <span>+1 {match.creator1.name.split(' ')[0]} (Push ▲)</span>
            </button>
            <button
              onClick={() => handleManualQuickVote(match.creator2.id)}
              className="flex items-center gap-1.5 bg-orange-950/80 hover:bg-orange-900 border border-orange-500/50 text-orange-300 hover:text-white px-3 py-1 rounded-full text-xs font-bold transition-all shadow-[0_0_12px_rgba(249,115,22,0.2)] active:scale-95"
            >
              <Zap className="w-3 h-3 text-orange-400" />
              <span>+1 {match.creator2.name.split(' ')[0]} (Push ▲)</span>
            </button>
          </div>
        </div>

        {/* Real-time Ticker Broadcast Stream */}
        <div className="mb-3 bg-[#0a1224] rounded-xl px-3.5 py-2 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 overflow-hidden">
            <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse shrink-0" />
            <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider shrink-0">
              Live Order Book:
            </span>
            {recentEvents.length > 0 ? (
              <span className="text-slate-200 font-medium truncate animate-fadeIn">
                <strong className={recentEvents[0].creatorId === match.creator1.id ? 'text-emerald-400' : 'text-orange-400'}>
                  {recentEvents[0].creatorName}
                </strong>{' '}
                received +1 vote from{' '}
                <span className="text-sky-300">{recentEvents[0].location}</span>{' '}
                <span className="text-emerald-400 font-bold">(+{recentEvents[0].deltaP}% surge)</span>
              </span>
            ) : (
              <span className="text-slate-400">Awaiting live votes from worldwide fans...</span>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]"></span>
              <span className="text-emerald-400">{match.creator1.name} ({p1Current}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.8)]"></span>
              <span className="text-orange-400">{match.creator2.name} ({p2Current}%)</span>
            </div>
          </div>
        </div>

        {/* SVG Chart Area */}
        <div className="relative w-full overflow-x-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent select-none pb-2">
          {/* Mobile swipe indicator */}
          <div className="sm:hidden text-center text-[10px] text-slate-400 mb-1 flex items-center justify-center gap-1">
            <span>← Swipe sideways to scroll live chart →</span>
          </div>
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto min-w-[580px] sm:min-w-[650px] transition-all duration-300"
          >
            <defs>
              {/* Creator 1 Area Gradient (Green / Cyan) */}
              <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>

              {/* Creator 2 Area Gradient (Orange / Red) */}
              <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
              </linearGradient>

              {/* Glow filters */}
              <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#10b981" floodOpacity="0.8" />
              </filter>
              <filter id="glow-orange" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#f97316" floodOpacity="0.8" />
              </filter>
            </defs>

            {/* Horizontal Grid lines and Y-axis percentage labels */}
            {yTicks.map((val) => {
              const y = getYCoord(val);
              return (
                <g key={val}>
                  <text
                    x={paddingLeft - 10}
                    y={y + 4}
                    textAnchor="end"
                    fill={val === 50 ? '#38bdf8' : '#64748b'}
                    fontSize={val === 50 ? '11' : '10'}
                    fontWeight={val === 50 ? '700' : '500'}
                  >
                    {val}%
                  </text>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={paddingLeft + chartWidth}
                    y2={y}
                    stroke={val === 50 ? '#1e3a8a' : '#1e293b'}
                    strokeWidth={val === 50 ? '1.5' : '1'}
                    strokeDasharray={val === 50 ? '5 3' : 'none'}
                  />
                </g>
              );
            })}

            {/* 50% Benchmark Parity Line Label */}
            <text
              x={paddingLeft + chartWidth - 6}
              y={getYCoord(50) - 6}
              textAnchor="end"
              fill="#38bdf8"
              fontSize="9"
              fontWeight="700"
              opacity="0.8"
            >
              50% PARITY AXIS
            </text>

            {/* Trading Volume Activity Histogram Bars at bottom of chart */}
            {rawPoints.map((pt, i) => {
              const x = getXCoord(i, rawPoints.length);
              const prevP1 = i > 0 ? rawPoints[i - 1].p1 : pt.p1;
              const delta = pt.p1 - prevP1;
              const isUp = delta >= 0;
              const barHeight = Math.min(26, Math.max(6, Math.abs(delta) * 7 + 8));
              const y = paddingTop + chartHeight - barHeight;
              return (
                <rect
                  key={`vol-${i}`}
                  x={x - 4}
                  y={y}
                  width="8"
                  height={barHeight}
                  rx="2"
                  fill={isUp ? '#10b981' : '#f97316'}
                  opacity="0.38"
                />
              );
            })}

            {/* Area under curves */}
            {points1.length > 1 && (
              <path
                d={`${linePath1} L ${lastPt1.x} ${getYCoord(0)} L ${points1[0].x} ${getYCoord(0)} Z`}
                fill="url(#grad1)"
                style={{ transition: 'd 0.4s ease-out' }}
              />
            )}
            {points2.length > 1 && (
              <path
                d={`${linePath2} L ${lastPt2.x} ${getYCoord(0)} L ${points2[0].x} ${getYCoord(0)} Z`}
                fill="url(#grad2)"
                style={{ transition: 'd 0.4s ease-out' }}
              />
            )}

            {/* Curve 2: Challenger (Orange/Red) with dynamic transition */}
            <path
              d={linePath2}
              fill="none"
              stroke="#f97316"
              strokeWidth="3"
              filter="url(#glow-orange)"
              strokeLinecap="round"
              style={{ transition: 'd 0.4s ease-out' }}
            />

            {/* Curve 1: Leader (Green/Cyan) with dynamic transition */}
            <path
              d={linePath1}
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              filter="url(#glow-green)"
              strokeLinecap="round"
              style={{ transition: 'd 0.4s ease-out' }}
            />

            {/* X-axis time labels */}
            {rawPoints.map((pt, i) => {
              const x = getXCoord(i, rawPoints.length);
              const y = paddingTop + chartHeight + 22;
              return (
                <g key={i}>
                  <text
                    x={x}
                    y={y}
                    textAnchor="middle"
                    fill={i === rawPoints.length - 1 ? '#38bdf8' : '#64748b'}
                    fontSize={i === rawPoints.length - 1 ? '11' : '10'}
                    fontWeight={i === rawPoints.length - 1 ? '700' : '500'}
                  >
                    {i === rawPoints.length - 1 ? '● Live' : pt.timeLabel}
                  </text>
                  <circle cx={x} cy={paddingTop + chartHeight} r="2" fill="#334155" />
                </g>
              );
            })}

            {/* ================= End Point 1 Node & Callout Badge (Green / Creator 1) ================= */}
            <g
              transform={`translate(${lastPt1.x}, ${lastPt1.y})`}
              style={{ transition: 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)' }}
            >
              {/* Radar pulse ring when vote lands */}
              <circle
                r={pulseC1 ? '18' : '10'}
                fill="none"
                stroke="#10b981"
                strokeWidth="1.5"
                opacity={pulseC1 ? '0.8' : '0.3'}
                className={pulseC1 ? 'animate-ping' : ''}
              />
              <circle r="6" fill="#10b981" stroke="#070e1c" strokeWidth="2" filter="url(#glow-green)" />
              <circle r="3" fill="#ffffff" />

              {/* Callout box with anti-collision vertical positioning */}
              <g transform={`translate(14, ${calloutOffset1})`}>
                <rect
                  x="0"
                  y="0"
                  width="112"
                  height="38"
                  rx="7"
                  fill="#092019"
                  stroke={pulseC1 ? '#34d399' : '#10b981'}
                  strokeWidth={pulseC1 ? '2.5' : '1.5'}
                  filter="url(#glow-green)"
                  className="transition-all duration-300"
                />
                <text x="8" y="15" fill="#a7f3d0" fontSize="10" fontWeight="700">
                  {match.creator1.name}
                </text>
                <text x="8" y="31" fill="#34d399" fontSize="14" fontWeight="900" className="font-mono">
                  {p1Current}%
                </text>
                {pulseC1 && (
                  <text x="76" y="30" fill="#a7f3d0" fontSize="10" fontWeight="800">
                    ▲ +1.3%
                  </text>
                )}
              </g>
            </g>

            {/* ================= End Point 2 Node & Callout Badge (Orange / Creator 2) ================= */}
            <g
              transform={`translate(${lastPt2.x}, ${lastPt2.y})`}
              style={{ transition: 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)' }}
            >
              {/* Radar pulse ring when vote lands */}
              <circle
                r={pulseC2 ? '18' : '10'}
                fill="none"
                stroke="#f97316"
                strokeWidth="1.5"
                opacity={pulseC2 ? '0.8' : '0.3'}
                className={pulseC2 ? 'animate-ping' : ''}
              />
              <circle r="6" fill="#f97316" stroke="#070e1c" strokeWidth="2" filter="url(#glow-orange)" />
              <circle r="3" fill="#ffffff" />

              {/* Callout box with anti-collision vertical positioning */}
              <g transform={`translate(14, ${calloutOffset2})`}>
                <rect
                  x="0"
                  y="0"
                  width="112"
                  height="38"
                  rx="7"
                  fill="#23140a"
                  stroke={pulseC2 ? '#fb923c' : '#f97316'}
                  strokeWidth={pulseC2 ? '2.5' : '1.5'}
                  filter="url(#glow-orange)"
                  className="transition-all duration-300"
                />
                <text x="8" y="15" fill="#fed7aa" fontSize="10" fontWeight="700">
                  {match.creator2.name}
                </text>
                <text x="8" y="31" fill="#fb923c" fontSize="14" fontWeight="900" className="font-mono">
                  {p2Current}%
                </text>
                {pulseC2 && (
                  <text x="76" y="30" fill="#fed7aa" fontSize="10" fontWeight="800">
                    ▲ +1.3%
                  </text>
                )}
              </g>
            </g>

            {/* Interactive hover trigger overlay */}
            {rawPoints.map((pt, i) => {
              const x = getXCoord(i, rawPoints.length);
              return (
                <rect
                  key={i}
                  x={x - 18}
                  y={paddingTop}
                  width="36"
                  height={chartHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoverIndex(i)}
                  onMouseLeave={() => setHoverIndex(null)}
                />
              );
            })}

            {/* Hover vertical line and tooltip */}
            {hoverIndex !== null && activePoint && (
              <g>
                <line
                  x1={getXCoord(hoverIndex, rawPoints.length)}
                  y1={paddingTop}
                  x2={getXCoord(hoverIndex, rawPoints.length)}
                  y2={paddingTop + chartHeight}
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
              </g>
            )}
          </svg>
        </div>

        {/* Bottom Status bar with Live Volatility and Hover details */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-800/80 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 bg-emerald-950/70 border border-emerald-500/30 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-emerald-300 font-bold text-[11px]">Dynamic Wave Mode</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-300">
              <span className="text-slate-400">Spread Gap:</span>
              <span className="font-mono font-bold text-sky-400">{spreadGap}%</span>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-300">
              <span className="text-slate-400">24h High / Low:</span>
              <span className="font-mono text-emerald-400 font-bold">{highP1}%</span>
              <span className="text-slate-500">/</span>
              <span className="font-mono text-rose-400 font-bold">{lowP1}%</span>
            </div>
          </div>

          {activePoint ? (
            <div className="text-xs text-slate-200 bg-slate-900/90 py-1 px-4 rounded-full border border-sky-500/40 shadow-sm">
              <span className="text-sky-300 font-bold">{activePoint.timeLabel}</span>: {match.creator1.name}{' '}
              <span className="text-emerald-400 font-bold">{activePoint.p1}%</span> vs {match.creator2.name}{' '}
              <span className="text-orange-400 font-bold">{activePoint.p2}%</span>
            </div>
          ) : (
            <div className="text-slate-400 text-[11px]">
              Total battle votes cast: <strong className="text-white font-mono">{totalVotes.toLocaleString()}</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

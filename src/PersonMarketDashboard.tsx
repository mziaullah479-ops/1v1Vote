import React, { useState } from 'react';
import { Activity, ArrowDownRight, ArrowUpRight, Info, Radio, ShieldCheck, TrendingUp } from 'lucide-react';
import { buildPersonMarket } from '../data/personMarket';
import { MarketPeriod, Person } from '../types';

const periods: Array<{ key: MarketPeriod; label: string }> = [
  { key: '1D', label: '1 Day' },
  { key: '1W', label: '1 Week' },
  { key: '1M', label: '1 Month' },
  { key: '1Y', label: '1 Year' },
  { key: '5Y', label: '5 Years' },
];

function formatPercent(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value);
}

function linePath(values: number[], width: number, height: number) {
  if (!values.length) return '';
  const padding = 18;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = Math.max(1, max - min);
  return values.map((value, index) => {
    const x = padding + (index / Math.max(1, values.length - 1)) * (width - padding * 2);
    const y = height - padding - ((value - min) / spread) * (height - padding * 2);
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
}

function Sparkline({ values, positive }: { values: number[]; positive: boolean }) {
  const path = linePath(values, 118, 38);
  return <svg viewBox="0 0 118 38" className="h-9 w-28" role="img" aria-label="Public signal trend"><path d={path} fill="none" stroke={positive ? '#34d399' : '#fb7185'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export const PersonMarketDashboard: React.FC<{ person: Person }> = ({ person }) => {
  const [period, setPeriod] = useState<MarketPeriod>('1D');
  const fallback = buildPersonMarket(person);
  const market = person.market || fallback;
  const points = market.history[period]?.length ? market.history[period] : fallback.history[period];
  const values = points.map((point) => point.value);
  const changeByPeriod: Record<MarketPeriod, number> = {
    '1D': market.change24h,
    '1W': market.change7d,
    '1M': market.change30d,
    '1Y': market.change1y,
    '5Y': market.change5y,
  };
  const change = changeByPeriod[period];
  const positive = change >= 0;
  const chartWidth = 900;
  const chartHeight = 280;
  const chartPath = linePath(values, chartWidth, chartHeight);
  const areaPath = values.length ? `${chartPath} L ${chartWidth - 18} ${chartHeight - 18} L 18 ${chartHeight - 18} Z` : '';

  return (
    <section className="mt-7 overflow-hidden rounded-[2rem] border border-emerald-400/20 bg-gradient-to-br from-[#0b1b1d] via-[#0b1221] to-[#080d18] shadow-2xl">
      <div className="border-b border-slate-800/80 p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300"><Radio className="h-4 w-4" /> Public market dashboard</div>
            <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">{person.name} signal trend</h2>
            <p className="mt-2 max-w-2xl text-xs leading-6 text-slate-400">An informational index from public source strength, visible reach where available, and separate 1v1Vote activity. It is not a currency price, financial advice, or an automatic vote.</p>
          </div>
          <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-right"><div className="text-[10px] font-black uppercase tracking-wider text-emerald-300">Signal index</div><div className="mt-1 text-3xl font-black text-white">{formatNumber(market.index)}</div><div className={`mt-1 text-xs font-black ${positive ? 'text-emerald-300' : 'text-rose-300'}`}>{formatPercent(change)} {period}</div></div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Market history range">
          {periods.map((item) => <button key={item.key} type="button" role="tab" aria-selected={period === item.key} onClick={() => setPeriod(item.key)} className={`rounded-xl border px-3 py-2 text-xs font-black transition ${period === item.key ? 'border-emerald-400 bg-emerald-400/15 text-emerald-200' : 'border-slate-700 bg-slate-950/50 text-slate-500 hover:text-white'}`}>{item.label}</button>)}
        </div>
      </div>

      <div className="grid gap-3 border-b border-slate-800/80 p-5 sm:grid-cols-2 sm:p-7 lg:grid-cols-6">
        {[
          ['Public signal', `${market.publicSignal}/100`, 'Source and reach model', <TrendingUp className="h-4 w-4 text-emerald-300" />],
          ['24h change', formatPercent(market.change24h), 'Selected public trend', market.change24h >= 0 ? <ArrowUpRight className="h-4 w-4 text-emerald-300" /> : <ArrowDownRight className="h-4 w-4 text-rose-300" />],
          ['7d change', formatPercent(market.change7d), 'Weekly direction', market.change7d >= 0 ? <ArrowUpRight className="h-4 w-4 text-emerald-300" /> : <ArrowDownRight className="h-4 w-4 text-rose-300" />],
          ['1y change', formatPercent(market.change1y), 'Long-term model', market.change1y >= 0 ? <ArrowUpRight className="h-4 w-4 text-emerald-300" /> : <ArrowDownRight className="h-4 w-4 text-rose-300" />],
          ['Community activity', formatNumber(market.activity24h), 'Votes + shares + views, separate', <Activity className="h-4 w-4 text-sky-300" />],
          ['Profile views', formatNumber(person.views || 0), 'Deduplicated public visits', <Radio className="h-4 w-4 text-sky-300" />],
          ['Social growth', typeof person.socialGrowth24h === 'number' ? formatPercent(person.socialGrowth24h) : 'Not checked', 'Fresh social snapshot', <TrendingUp className="h-4 w-4 text-amber-300" />],
        ].map(([label, value, caption, icon]) => <div key={String(label)} className="rounded-2xl border border-slate-800 bg-[#070d18] p-4"><div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-500"><span>{label}</span>{icon}</div><div className="mt-2 text-xl font-black text-white">{value}</div><div className="mt-1 text-[10px] text-slate-600">{caption}</div></div>)}
      </div>

      <div className="p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{period} history</div><div className="mt-1 flex items-center gap-2 text-sm font-bold text-white"><span className={`h-2 w-2 rounded-full ${positive ? 'bg-emerald-400' : 'bg-rose-400'}`} /> {positive ? 'Public signal moving up' : 'Public signal moving down'}</div></div><Sparkline values={values} positive={positive} /></div>
        <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-800 bg-[#060b15] p-2"><svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-64 min-w-[620px] w-full" role="img" aria-label={`${person.name} ${period} public signal chart`}><defs><linearGradient id={`market-fill-${person.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={positive ? '#34d399' : '#fb7185'} stopOpacity=".28" /><stop offset="100%" stopColor={positive ? '#34d399' : '#fb7185'} stopOpacity="0" /></linearGradient></defs><line x1="18" y1="70" x2="882" y2="70" stroke="#1e293b" strokeDasharray="4 5" /><line x1="18" y1="140" x2="882" y2="140" stroke="#1e293b" strokeDasharray="4 5" /><line x1="18" y1="210" x2="882" y2="210" stroke="#1e293b" strokeDasharray="4 5" /><path d={areaPath} fill={`url(#market-fill-${person.id})`} /><path d={chartPath} fill="none" stroke={positive ? '#34d399' : '#fb7185'} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /><text x="20" y="25" fill="#64748b" fontSize="11">public signal index</text>{points.filter((_, index) => index === 0 || index === points.length - 1).map((point) => <text key={point.timestamp} x={point === points[0] ? 20 : 875} y="265" textAnchor={point === points[0] ? 'start' : 'end'} fill="#64748b" fontSize="11">{point.label}</text>)}</svg></div>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-slate-500"><span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-emerald-300" /> Organic votes are never generated by this model.</span><span className="inline-flex items-center gap-1.5"><Info className="h-3.5 w-3.5 text-sky-300" /> History is a modelled baseline until recorded public snapshots accumulate.</span></div>
      </div>
    </section>
  );
};

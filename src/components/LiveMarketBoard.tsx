import React from 'react';
import { ArrowUpRight, BarChart3, Radio } from 'lucide-react';
import { buildPersonMarket } from '../data/personMarket';
import { Person } from '../types';
import { imageVariant } from '../utils/imageUrl';

function percent(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

function sparkPath(values: number[]) {
  if (!values.length) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = Math.max(1, max - min);
  return values.map((value, index) => {
    const x = 4 + (index / Math.max(1, values.length - 1)) * 92;
    const y = 31 - ((value - min) / spread) * 25;
    return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
}

export const LiveMarketBoard: React.FC<{ people: Person[] }> = ({ people }) => {
  const movers = [...people].sort((left, right) => (right.market?.change24h || 0) - (left.market?.change24h || 0)).slice(0, 10);
  if (!movers.length) return null;

  return <section className="mt-6 overflow-hidden rounded-[2rem] border border-emerald-400/20 bg-gradient-to-br from-[#0b1b1d] via-[#0b1221] to-[#080d18] p-4 shadow-2xl sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300"><Radio className="h-3.5 w-3.5 animate-pulse" /> Live public-signal market</div><h2 className="mt-2 text-2xl font-black text-white">Top 10 rising profiles</h2><p className="mt-1 max-w-2xl text-xs leading-6 text-slate-400">A separate public-information signal board for discovery while the audience grows. It never creates votes or changes the organic ranking.</p></div><div className="inline-flex items-center gap-2 rounded-full border border-sky-400/25 bg-sky-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-sky-200"><BarChart3 className="h-3.5 w-3.5" /> Auto-refreshing feed</div></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{movers.map((person, index) => { const market = person.market || buildPersonMarket(person); const fallback = buildPersonMarket(person); const values = market.history['1D']?.length ? market.history['1D'].map((point) => point.value) : fallback.history['1D'].map((point) => point.value); return <a key={person.id} href={`/people/${encodeURIComponent(person.slug)}`} className="group rounded-2xl border border-slate-800 bg-[#070d18]/90 p-3 transition hover:-translate-y-0.5 hover:border-emerald-400/40"><div className="flex items-center justify-between gap-2"><span className="text-lg font-black text-emerald-300">#{String(index + 1).padStart(2, '0')}</span><span className="inline-flex items-center gap-0.5 text-xs font-black text-emerald-300"><ArrowUpRight className="h-3.5 w-3.5" />{percent(market.change24h)}</span></div><div className="mt-3 flex items-center gap-2"><img src={imageVariant(person.avatar, 160)} alt="" width={38} height={38} loading="lazy" decoding="async" sizes="38px" className="h-9 w-9 rounded-xl object-cover" /><span className="min-w-0"><span className="block truncate text-xs font-black text-white group-hover:text-emerald-200">{person.name}</span><span className="mt-0.5 block truncate text-[10px] font-bold uppercase tracking-wider text-slate-600">{person.country} · signal {market.publicSignal}</span></span></div><svg viewBox="0 0 100 36" className="mt-3 h-9 w-full"><path d={sparkPath(values)} fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" /></svg></a>; })}</div></section>;
};

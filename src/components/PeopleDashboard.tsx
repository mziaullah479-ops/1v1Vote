import React, { useEffect, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Check, ChevronUp, Clock3, Link2, Radio, Search, Share2, Sparkles, Trophy, Users, Vote } from 'lucide-react';
import { INITIAL_PEOPLE } from '../data/seedData';
import { Person, PersonCategory, PersonCountry } from '../types';
import { SiteFooter } from './SiteFooter';
import { trackEvent } from '../seo';
import { imageVariant } from '../utils/imageUrl';
import { apiUrl } from '../services/api';

const COOLDOWN_KEY = '1v1vote-person-vote-cooldowns-v2';
const categories: Array<'All' | PersonCategory> = ['All', 'Politics', 'Religious Scholar', 'Creator', 'Sports', 'Entertainment', 'Business'];
const countries: Array<'All' | PersonCountry> = ['All', 'Pakistan', 'India', 'USA', 'Global'];

function sortPeople(people: Person[]) {
  return [...people].sort((left, right) => {
    if (right.votes !== left.votes) return right.votes - left.votes;
    if (right.shares !== left.shares) return right.shares - left.shares;
    return left.name.localeCompare(right.name);
  });
}

function formatCount(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

function readCooldowns(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(COOLDOWN_KEY) || '{}') as Record<string, string>;
  } catch {
    return {};
  }
}

function saveCooldowns(cooldowns: Record<string, string>) {
  try {
    localStorage.setItem(COOLDOWN_KEY, JSON.stringify(cooldowns));
  } catch {
    // Private browsing can disable local storage; the server remains authoritative.
  }
}

function remainingLabel(isoDate: string) {
  const remaining = Math.max(0, new Date(isoDate).getTime() - Date.now());
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

function personInitials(name: string) {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

interface PersonCardProps {
  person: Person;
  rank: number;
  cooldown?: string;
  onVote: (person: Person) => void;
  onShare: (person: Person) => void;
}

const PersonCard: React.FC<PersonCardProps> = ({ person, rank, cooldown, onVote, onShare }) => {
  const [imageError, setImageError] = useState(false);
  const isCoolingDown = Boolean(cooldown && new Date(cooldown).getTime() > Date.now());
  const isTopThree = rank <= 3;
  return (
    <article id={`person-${person.slug}`} data-testid={`card-person-${person.id}`} className={`person-card group relative overflow-hidden rounded-3xl border p-4 shadow-2xl transition duration-300 hover:-translate-y-1 sm:p-5 ${isTopThree ? 'border-sky-500/35' : 'border-slate-800/90'}`}>
      <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-sky-500/10 blur-3xl transition group-hover:bg-sky-400/20" />
      <div className="relative flex items-start justify-between gap-3">
        <div className={`rank-chip inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-black ${rank === 1 ? 'border-amber-400/60 bg-amber-400/15 text-amber-300' : rank === 2 ? 'border-slate-300/50 bg-slate-300/10 text-slate-200' : rank === 3 ? 'border-orange-400/50 bg-orange-400/10 text-orange-300' : 'border-slate-700 bg-slate-900 text-slate-400'}`}>
          {isTopThree && <Trophy className="h-4 w-4" aria-label="Top ranked" />}
          #{rank}
        </div>
        {person.market && <div className={`inline-flex max-w-[11rem] items-center gap-1 rounded-full border px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider ${person.market.change24h >= 0 ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : 'border-rose-400/30 bg-rose-400/10 text-rose-200'}`}>{person.market.change24h >= 0 ? <ArrowUpRight className="h-3 w-3 shrink-0" /> : <ArrowDownRight className="h-3 w-3 shrink-0" />} {person.market.change24h >= 0 ? '+' : ''}{person.market.change24h.toFixed(1)}% <span className="hidden sm:inline">public signal</span></div>}
      </div>

      <div className="relative mt-5 flex flex-col items-center text-center">
        <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-sky-400 bg-slate-900 shadow-lg shadow-sky-900/10 sm:h-28 sm:w-28">
          {!imageError && <img src={imageVariant(person.avatar, 240)} alt={person.name} width={112} height={112} loading="lazy" decoding="async" sizes="112px" className="relative z-10 h-full w-full object-cover" onError={() => setImageError(true)} />}
          <span className="absolute inset-0 flex items-center justify-center text-lg font-black text-sky-300">{personInitials(person.name)}</span>
        </div>
        <a href={`/people/${encodeURIComponent(person.slug)}`} className="mt-3 block max-w-full truncate text-lg font-black text-white hover:text-sky-300">{person.name}</a>
        <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
          <span className="text-sky-300">{person.category}</span>
          <span>•</span>
          <span>{person.country}</span>
          {person.verified && <Check className="h-3.5 w-3.5 text-emerald-400" aria-label="Verified profile" />}
        </div>
        {person.promotion && <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-200"><Sparkles className="h-3 w-3" /> {person.promotion.label}</div>}
      </div>

      <div className="relative mt-5 flex items-center justify-between gap-3 border-t border-slate-800/80 pt-4">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-400/10"><ChevronUp className="h-4 w-4 text-emerald-400" /></div>
          <div className="min-w-0"><div className="text-[10px] font-bold uppercase tracking-[0.13em] text-slate-500">Organic votes</div><div className="mt-0.5 text-2xl font-black tracking-tight text-white">{formatCount(person.votes)}</div></div>
          <span className="hidden text-[10px] font-bold text-slate-500 sm:inline">{formatCount(person.views || 0)} {person.views === 1 ? 'view' : 'views'}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
        <button type="button" onClick={() => onVote(person)} disabled={isCoolingDown} className={`flex min-h-11 max-w-[10rem] items-center justify-center gap-2 rounded-full px-3 text-[11px] font-black transition sm:px-4 ${isCoolingDown ? 'cursor-not-allowed border border-slate-700 bg-slate-900 text-slate-500' : 'bg-sky-400 text-slate-950 hover:bg-sky-300 active:scale-[0.98]'}`}>
          {isCoolingDown ? <Clock3 className="h-4 w-4" /> : <Vote className="h-4 w-4" />}
          <span className="truncate">{isCoolingDown ? `After midnight · ${remainingLabel(cooldown!)}` : 'Vote today'}</span>
        </button>
        <button type="button" onClick={() => onShare(person)} aria-label={`Share ${person.name}`} className="flex min-h-11 w-11 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-300 transition hover:border-sky-400 hover:text-sky-300">
          <Share2 className="h-4 w-4" />
        </button>
        </div>
      </div>
    </article>
  );
};

export const PeopleDashboard: React.FC = () => {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'All' | PersonCategory>('All');
  const [country, setCountry] = useState<'All' | PersonCountry>('All');
  const [cooldowns, setCooldowns] = useState<Record<string, string>>(() => readCooldowns());
  const [toast, setToast] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [liveError, setLiveError] = useState(false);

  const loadPeople = async (signal?: AbortSignal) => {
    try {
      const response = await fetch(apiUrl('/api/people'), { cache: 'default', signal });
      if (!response.ok) throw new Error('Unable to load profiles');
      const payload = await response.json() as { people: Person[] };
      setPeople(sortPeople(payload.people));
      setLastUpdated(new Date());
      setLiveError(false);
    } catch {
      if (signal?.aborted) return;
      setPeople(sortPeople(INITIAL_PEOPLE));
      setLiveError(true);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    let activeController: AbortController | undefined;
    const refreshWhenVisible = () => {
      if (document.visibilityState !== 'visible') {
        activeController?.abort();
        activeController = undefined;
        return;
      }
      activeController?.abort();
      activeController = new AbortController();
      void loadPeople(activeController.signal);
    };
    // Load once even when the tab starts hidden; visibility only controls refreshes.
    void loadPeople();
    const interval = window.setInterval(refreshWhenVisible, 30000);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      activeController?.abort();
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, []);

  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get('person');
    if (!slug || !people.length) return;
    window.setTimeout(() => document.getElementById(`person-${slug}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 250);
  }, [people.length]);

  useEffect(() => {
    const timer = window.setInterval(() => setCooldowns((current) => ({ ...current })), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 3200);
  };

  const handleVote = async (person: Person) => {
    try {
      const response = await fetch(apiUrl(`/api/people/${encodeURIComponent(person.id)}/vote`), { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' } });
      const payload = await response.json() as { person?: Person; nextVoteAt?: string; error?: string; retryAt?: string };
      if (!response.ok) {
        if (payload.retryAt) {
          const next = { ...cooldowns, [person.id]: payload.retryAt };
          setCooldowns(next);
          saveCooldowns(next);
        }
        showToast(payload.error || 'Vote could not be registered.');
        return;
      }
      if (payload.person && payload.nextVoteAt) {
        const next = { ...cooldowns, [person.id]: payload.nextVoteAt };
        setCooldowns(next);
        saveCooldowns(next);
        setPeople((current) => sortPeople(current.map((item) => item.id === payload.person!.id ? payload.person! : item)));
        trackEvent('vote_submitted', { profile_category: person.category, profile_country: person.country });
      }
      showToast(`Vote registered for ${person.name}. You can vote for this profile again after midnight.`);
    } catch {
      showToast('The live voting service is temporarily unavailable.');
    }
  };

  const handleShare = async (person: Person) => {
    const shareUrl = `${window.location.origin}/people/${encodeURIComponent(person.slug)}`;
    void fetch(apiUrl(`/api/people/${encodeURIComponent(person.id)}/share`), { method: 'POST', credentials: 'include' }).catch(() => undefined);
    try {
      if (navigator.share) {
        trackEvent('profile_shared', { profile_category: person.category, profile_country: person.country });
        await navigator.share({ title: `${person.name} on 1v1Vote`, text: `Vote for ${person.name} on 1v1Vote.`, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        trackEvent('profile_shared', { profile_category: person.category, profile_country: person.country });
        showToast('Profile link copied.');
      }
    } catch {
      // The share sheet can be dismissed without an error message.
    }
  };

  const rankById = new Map(people.map((person, index) => [person.id, index + 1]));
  const visiblePeople = people.filter((person) => {
    const query = search.trim().toLowerCase();
    const rankQuery = query.match(/(?:rank|number|#)?\s*(\d+)/)?.[1];
    const rank = rankById.get(person.id) || 0;
    const matchesRank = Boolean(rankQuery && Number(rankQuery) === rank);
    const matchesSearch = !query || (rankQuery ? matchesRank : `${person.name} ${person.shortBio} ${person.bio || ''} ${person.category} ${person.country}`.toLowerCase().includes(query));
    return matchesSearch && (category === 'All' || person.category === category) && (country === 'All' || person.country === country);
  });
  return (
    <div className="people-dashboard min-h-screen bg-[#060a13] text-slate-100">
      {toast && <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-2xl border border-sky-400/50 bg-[#0c1a36] px-4 py-3 text-center text-xs font-bold text-sky-100 shadow-2xl">{toast}</div>}

      <header className="border-b border-slate-800/80 bg-[#070c17]/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="brand-mark flex h-10 w-10 items-center justify-center rounded-2xl text-slate-950"><Radio className="relative z-10 h-5 w-5" /></div>
            <div><div className="brand-wordmark text-lg font-black text-white">1v1Vote</div><div className="brand-kicker text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">The public signal index</div></div>
          </div>
          <nav className="hidden items-center gap-1 rounded-full border border-slate-800/80 bg-slate-950/30 p-1 md:flex" aria-label="Primary navigation"><a href="/rankings" className="rounded-full px-3 py-2 text-[11px] font-black text-slate-400 transition hover:bg-sky-400/10 hover:text-sky-300">Live rankings</a><a href="/people" className="rounded-full px-3 py-2 text-[11px] font-black text-slate-400 transition hover:bg-emerald-400/10 hover:text-emerald-300">Directory</a><a href="/ai" className="rounded-full px-3 py-2 text-[11px] font-black text-slate-400 transition hover:bg-violet-400/10 hover:text-violet-300">AI guide</a><a href="/promote" className="rounded-full px-3 py-2 text-[11px] font-black text-slate-400 transition hover:bg-amber-400/10 hover:text-amber-300">Promote</a></nav>
          <div className="hidden items-center gap-2 text-xs font-semibold text-slate-400 sm:flex"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Live rankings update automatically</div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
        <section className="home-hero-card relative overflow-hidden rounded-[2rem] border border-sky-500/20 bg-gradient-to-br from-[#0d1b36] via-[#0a1223] to-[#0a0e19] px-5 py-8 shadow-2xl shadow-sky-950/20 sm:px-10 sm:py-11">
          <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />
          <div className="relative">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-sky-300"><Sparkles className="h-3.5 w-3.5" /> Live index</div>
              <h1 className="text-3xl font-black leading-tight tracking-tight text-white sm:text-5xl">Who is the public backing?</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">One vote per profile, every day. Browse source-backed people from Pakistan, India, the USA, and beyond, then watch the ranking move.</p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a href="#directory" className="inline-flex min-h-10 items-center rounded-xl bg-sky-400 px-4 text-xs font-black text-slate-950 transition hover:bg-sky-300">Browse the index</a>
                <a href="/how-it-works" className="inline-flex min-h-10 items-center rounded-xl border border-slate-700 bg-slate-950/20 px-4 text-xs font-black text-slate-200 transition hover:border-sky-400/60 hover:text-sky-200">See how voting works</a>
              </div>
            </div>
          </div>
        </section>

          <section id="directory" className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
           <div><div className="brand-kicker text-[10px] font-bold uppercase tracking-[0.2em] text-sky-300">The live directory</div><h2 className="mt-1 text-2xl font-black text-white">Where public attention is landing</h2><p className="mt-1 text-xs text-slate-500">Search the index, choose a region, and make your daily signal count.</p></div>
          <div className="relative w-full lg:max-w-xs"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search person, country or rank" className="min-h-11 w-full rounded-xl border border-slate-800 bg-[#0b1221] pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-sky-500/70" /></div>
        </section>

        <div className="mt-5 flex items-center gap-3 overflow-x-auto pb-1 [scrollbar-width:none]"><span className="shrink-0 text-[10px] font-black uppercase tracking-wider text-slate-600">Regions</span>
          {countries.map((item) => <button key={item} type="button" onClick={() => setCountry(item)} className={`shrink-0 rounded-full border px-3 py-2 text-[11px] font-bold transition ${country === item ? 'border-sky-400 bg-sky-400/15 text-sky-200' : 'border-slate-800 bg-[#0b1221] text-slate-500 hover:text-slate-300'}`}>{item === 'All' ? 'All regions' : item}</button>)}
        </div>
        <div className="mt-2 flex items-center gap-3 overflow-x-auto pb-1 [scrollbar-width:none]"><span className="shrink-0 text-[10px] font-black uppercase tracking-wider text-slate-600">Categories</span>
          {categories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={`shrink-0 rounded-full border px-3 py-2 text-[11px] font-bold transition ${category === item ? 'border-amber-400 bg-amber-400/15 text-amber-200' : 'border-slate-800 bg-[#0b1221] text-slate-500 hover:text-slate-300'}`}>{item}</button>)}
        </div>

         <div className="mt-7 flex flex-col gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600 sm:flex-row sm:items-center sm:justify-between"><span>{visiblePeople.length} profiles shown</span><span className="flex items-center gap-2">{liveError ? <><span className="text-amber-300">Showing the last known directory</span><button type="button" onClick={() => { setLoading(true); void loadPeople(); }} className="rounded-full border border-amber-400/30 px-2.5 py-1 text-[10px] font-black tracking-wider text-amber-200 transition hover:border-amber-300 hover:text-amber-100">Retry feed</button></> : lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Connecting to live feed'}</span></div>

        {loading ? <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-64 animate-pulse rounded-3xl border border-slate-800 bg-[#0b1221]" />)}</div> : visiblePeople.length ? <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visiblePeople.map((person) => <PersonCard key={person.id} person={person} rank={people.findIndex((item) => item.id === person.id) + 1} cooldown={cooldowns[person.id]} onVote={handleVote} onShare={handleShare} />)}</div> : <div className="mt-3 rounded-3xl border border-dashed border-slate-800 px-5 py-14 text-center text-sm text-slate-500">No profiles match this search or filter.</div>}

         <div className="mt-8 flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-800/80 bg-[#0b1221]/70 px-4 py-4 text-center text-[11px] text-slate-500 sm:flex-row sm:text-left"><div className="flex items-center gap-2"><Users className="h-4 w-4 text-sky-400" /> No account required. Vote once for each profile per calendar day.</div><div className="flex items-center gap-2"><Link2 className="h-3.5 w-3.5" /> Share any profile with its link.</div></div>
      </main>
      <SiteFooter />
    </div>
  );
};

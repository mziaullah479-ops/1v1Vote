import React, { useEffect, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Check, ChevronUp, Clock3, ExternalLink, Link2, Radio, Search, Share2, Sparkles, Trophy, Users, Vote } from 'lucide-react';
import { INITIAL_PEOPLE } from '../data/seedData';
import { Person, PersonCategory, PersonCountry } from '../types';
import { SiteFooter } from './SiteFooter';
import { LiveMarketBoard } from './LiveMarketBoard';
import { trackEvent } from '../seo';

const COOLDOWN_KEY = '1v1vote-person-vote-cooldowns-v1';
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
    <article id={`person-${person.slug}`} className={`person-card group relative overflow-hidden rounded-3xl border bg-[#0b1221]/90 p-4 shadow-2xl transition duration-300 hover:-translate-y-1 ${isTopThree ? 'border-sky-500/35' : 'border-slate-800/90'}`}>
      <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-sky-500/10 blur-3xl transition group-hover:bg-sky-400/20" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border text-sm font-black ${rank === 1 ? 'border-amber-400/60 bg-amber-400/15 text-amber-300' : rank === 2 ? 'border-slate-300/50 bg-slate-300/10 text-slate-200' : rank === 3 ? 'border-orange-400/50 bg-orange-400/10 text-orange-300' : 'border-slate-700 bg-slate-900 text-slate-400'}`}>
            #{rank}
          </div>
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-slate-700 bg-slate-900">
            {!imageError && <img src={person.avatar} alt={person.name} width={56} height={56} loading="lazy" decoding="async" className="relative z-10 h-full w-full object-cover" onError={() => setImageError(true)} />}
            <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-sky-300">{personInitials(person.name)}</span>
          </div>
          <div className="min-w-0">
            <a href={`/people/${encodeURIComponent(person.slug)}`} className="block truncate text-base font-black text-white hover:text-sky-300">{person.name}</a>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
              <span className="text-sky-300">{person.category}</span>
              <span>•</span>
              <span>{person.country}</span>
              {person.verified && <Check className="h-3.5 w-3.5 text-emerald-400" aria-label="Verified profile" />}
            </div>
          </div>
        </div>
        {rank <= 3 && <Trophy className="h-5 w-5 shrink-0 text-amber-300" aria-label="Top ranked" />}
      </div>

      <p className="relative mt-4 min-h-10 line-clamp-3 text-xs leading-relaxed text-slate-400">{person.bio || person.shortBio}</p>
      {person.promotion && <div className="relative mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-200"><Sparkles className="h-3 w-3" /> {person.promotion.label}</div>}
      {person.market && <div className={`relative mt-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${person.market.change24h >= 0 ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : 'border-rose-400/30 bg-rose-400/10 text-rose-200'}`}>{person.market.change24h >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />} {person.market.change24h >= 0 ? '+' : ''}{person.market.change24h.toFixed(1)}% public signal / 24h</div>}

      <div className="relative mt-4 flex items-end justify-between border-t border-slate-800/80 pt-3">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
            <ChevronUp className="h-3.5 w-3.5 text-emerald-400" /> Organic votes
          </div>
          <div className="mt-1 flex items-end gap-2"><span className="text-2xl font-black tracking-tight text-white">{formatCount(person.votes)}</span><span className="text-[10px] font-bold text-slate-500">{formatCount(person.views || 0)} {person.views === 1 ? 'view' : 'views'}</span></div>
        </div>
        <div className="flex items-end gap-3">
          {person.followersCount && <span className="text-right text-[10px] font-bold text-slate-500">{person.followersCount}<br />followers</span>}
          {person.profileUrl && <a href={person.profileUrl} target="_blank" rel="noreferrer" aria-label={`Open source profile for ${person.name}`} className="text-slate-500 transition hover:text-sky-300"><ExternalLink className="h-4 w-4" /></a>}
        </div>
      </div>

      <div className="relative mt-4 grid grid-cols-[1fr_auto] gap-2">
        <button type="button" onClick={() => onVote(person)} disabled={isCoolingDown} className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-xs font-black transition ${isCoolingDown ? 'cursor-not-allowed border border-slate-700 bg-slate-900 text-slate-500' : 'bg-sky-500 text-slate-950 hover:bg-sky-300 active:scale-[0.98]'}`}>
          {isCoolingDown ? <Clock3 className="h-4 w-4" /> : <Vote className="h-4 w-4" />}
          {isCoolingDown ? `Again in ${remainingLabel(cooldown!)}` : 'Vote for this person'}
        </button>
        <button type="button" onClick={() => onShare(person)} aria-label={`Share ${person.name}`} className="flex min-h-11 w-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-300 transition hover:border-sky-400 hover:text-sky-300">
          <Share2 className="h-4 w-4" />
        </button>
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

  const loadPeople = async () => {
    try {
      const response = await fetch('/api/people', { cache: 'no-store' });
      if (!response.ok) throw new Error('Unable to load profiles');
      const payload = await response.json() as { people: Person[] };
      setPeople(sortPeople(payload.people));
      setLastUpdated(new Date());
    } catch {
      setPeople(sortPeople(INITIAL_PEOPLE));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPeople();
    const interval = window.setInterval(() => {
      void loadPeople();
    }, 15000);
    return () => window.clearInterval(interval);
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
      const response = await fetch(`/api/people/${encodeURIComponent(person.id)}/vote`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
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
      showToast(`Vote registered for ${person.name}. You can vote for this profile again in 24 hours.`);
    } catch {
      showToast('The live voting service is temporarily unavailable.');
    }
  };

  const handleShare = async (person: Person) => {
    const shareUrl = `${window.location.origin}/people/${encodeURIComponent(person.slug)}`;
    void fetch(`/api/people/${encodeURIComponent(person.id)}/share`, { method: 'POST' }).catch(() => undefined);
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

  const visiblePeople = people.filter((person) => {
    const query = search.trim().toLowerCase();
    const rankQuery = query.match(/(?:rank|number|#)?\s*(\d+)/)?.[1];
    const rank = people.findIndex((item) => item.id === person.id) + 1;
    const matchesRank = Boolean(rankQuery && Number(rankQuery) === rank);
    const matchesSearch = !query || (rankQuery ? matchesRank : `${person.name} ${person.shortBio} ${person.bio || ''} ${person.category} ${person.country}`.toLowerCase().includes(query));
    return matchesSearch && (category === 'All' || person.category === category) && (country === 'All' || person.country === country);
  });
  const totalVotes = people.reduce((sum, person) => sum + person.votes, 0);

  return (
    <div className="people-dashboard min-h-screen bg-[#060a13] text-slate-100">
      {toast && <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-2xl border border-sky-400/50 bg-[#0c1a36] px-4 py-3 text-center text-xs font-bold text-sky-100 shadow-2xl">{toast}</div>}

      <header className="border-b border-slate-800/80 bg-[#070c17]/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 text-slate-950 shadow-lg shadow-sky-500/20"><Radio className="h-5 w-5" /></div>
            <div><div className="text-lg font-black tracking-tight text-white">1v1Vote</div><div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Public pulse dashboard</div></div>
          </div>
          <nav className="hidden items-center gap-1 rounded-full border border-slate-800/80 bg-slate-950/30 p-1 md:flex" aria-label="Primary navigation"><a href="/rankings" className="rounded-full px-3 py-2 text-[11px] font-black text-slate-400 transition hover:bg-sky-400/10 hover:text-sky-300">Rankings</a><a href="/ai" className="rounded-full px-3 py-2 text-[11px] font-black text-slate-400 transition hover:bg-violet-400/10 hover:text-violet-300">AI guide</a><a href="/promote" className="rounded-full px-3 py-2 text-[11px] font-black text-slate-400 transition hover:bg-amber-400/10 hover:text-amber-300">Promote</a></nav>
          <div className="hidden items-center gap-2 text-xs font-semibold text-slate-400 sm:flex"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Live rankings update automatically</div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
        <section className="relative overflow-hidden rounded-[2rem] border border-sky-500/20 bg-gradient-to-br from-[#0d1b36] via-[#0a1223] to-[#0a0e19] px-5 py-8 shadow-2xl shadow-sky-950/20 sm:px-10 sm:py-11">
          <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />
          <div className="relative max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-sky-300"><Sparkles className="h-3.5 w-3.5" /> One person, one vote every 24 hours</div>
            <h1 className="text-3xl font-black leading-tight tracking-tight text-white sm:text-5xl">The public pulse, ranked live.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">Discover notable people, read their source-backed profiles, and cast one vote every 24 hours. The ranking stays simple: real people, live support, clear sources.</p>
          </div>
          <div className="relative mt-7 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-slate-800/80 pt-5 sm:max-w-2xl sm:grid-cols-4 sm:gap-8">
            <div><div className="text-xl font-black text-white">{formatCount(people.length)}</div><div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Profiles</div></div>
            <div><div className="text-xl font-black text-white">{formatCount(totalVotes)}</div><div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Total votes</div></div>
            <div><div className="text-xl font-black text-white">{formatCount(people.reduce((sum, person) => sum + (person.views || 0), 0))}</div><div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Profile views</div></div>
            <div><div className="text-xl font-black text-emerald-300">24h</div><div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Vote reset</div></div>
          </div>
        </section>

         {people.length > 0 && <section className="mt-5 overflow-hidden rounded-3xl border border-amber-400/20 bg-gradient-to-r from-[#151125] via-[#0b1221] to-[#101b2b] p-4 shadow-xl sm:p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-amber-300"><Sparkles className="h-3.5 w-3.5" /> Live signal</div><h2 className="mt-1 text-lg font-black text-white">Who leads the public pulse today?</h2></div><span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-300">Organic votes</span></div><div className="mt-4 grid gap-3 md:grid-cols-3">{people.slice(0, 3).map((person, index) => <a key={person.id} href={`/people/${encodeURIComponent(person.slug)}`} className={`group flex items-center gap-3 rounded-2xl border p-3 transition hover:-translate-y-0.5 ${index === 0 ? 'border-amber-400/40 bg-amber-400/10' : 'border-slate-800 bg-[#080e1b]/70'}`}><span className="text-lg font-black text-amber-300">0{index + 1}</span><img src={person.avatar} alt="" width={42} height={42} loading="lazy" className="h-10 w-10 rounded-xl object-cover" /><span className="min-w-0"><span className="block truncate text-sm font-black text-white group-hover:text-sky-300">{person.name}</span><span className="mt-0.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">{formatCount(person.votes)} votes · {person.country}</span></span></a>)}</div></section>}
         <LiveMarketBoard people={people} />

        <section className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div><h2 className="text-2xl font-black text-white">Most voted people</h2><p className="mt-1 text-xs text-slate-500">One dashboard for notable people from Pakistan and around the world</p></div>
          <div className="relative w-full lg:max-w-xs"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search person, country or rank" className="min-h-11 w-full rounded-xl border border-slate-800 bg-[#0b1221] pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-sky-500/70" /></div>
        </section>

        <div className="mt-5 flex items-center gap-3 overflow-x-auto pb-1 [scrollbar-width:none]"><span className="shrink-0 text-[10px] font-black uppercase tracking-wider text-slate-600">Regions</span>
          {countries.map((item) => <button key={item} type="button" onClick={() => setCountry(item)} className={`shrink-0 rounded-full border px-3 py-2 text-[11px] font-bold transition ${country === item ? 'border-sky-400 bg-sky-400/15 text-sky-200' : 'border-slate-800 bg-[#0b1221] text-slate-500 hover:text-slate-300'}`}>{item === 'All' ? 'All regions' : item}</button>)}
        </div>
        <div className="mt-2 flex items-center gap-3 overflow-x-auto pb-1 [scrollbar-width:none]"><span className="shrink-0 text-[10px] font-black uppercase tracking-wider text-slate-600">Categories</span>
          {categories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={`shrink-0 rounded-full border px-3 py-2 text-[11px] font-bold transition ${category === item ? 'border-amber-400 bg-amber-400/15 text-amber-200' : 'border-slate-800 bg-[#0b1221] text-slate-500 hover:text-slate-300'}`}>{item}</button>)}
        </div>

        <div className="mt-7 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600"><span>{visiblePeople.length} profiles shown</span><span>{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Connecting to live feed'}</span></div>

        {loading ? <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-64 animate-pulse rounded-3xl border border-slate-800 bg-[#0b1221]" />)}</div> : visiblePeople.length ? <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visiblePeople.map((person) => <PersonCard key={person.id} person={person} rank={people.findIndex((item) => item.id === person.id) + 1} cooldown={cooldowns[person.id]} onVote={handleVote} onShare={handleShare} />)}</div> : <div className="mt-3 rounded-3xl border border-dashed border-slate-800 px-5 py-14 text-center text-sm text-slate-500">No profiles match this search or filter.</div>}

        <div className="mt-8 flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-800/80 bg-[#0b1221]/70 px-4 py-4 text-center text-[11px] text-slate-500 sm:flex-row sm:text-left"><div className="flex items-center gap-2"><Users className="h-4 w-4 text-sky-400" /> No account required. Vote once for each profile every 24 hours.</div><div className="flex items-center gap-2"><Link2 className="h-3.5 w-3.5" /> Share any profile with its link.</div></div>
      </main>
      <SiteFooter />
    </div>
  );
};

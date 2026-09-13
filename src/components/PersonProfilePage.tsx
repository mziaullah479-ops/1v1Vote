import React, { useEffect, useState } from 'react';
import { ArrowLeft, Check, ExternalLink, Share2, Trophy, Vote } from 'lucide-react';
import { Person } from '../types';
import { setPageSeo } from '../seo';

function formatCount(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

export const PersonProfilePage: React.FC<{ slug: string }> = ({ slug }) => {
  const [person, setPerson] = useState<Person | null>(null);
  const [rank, setRank] = useState(0);
  const [message, setMessage] = useState('Loading profile...');

  useEffect(() => {
    let active = true;
    void Promise.all([
      fetch(`/api/people/${encodeURIComponent(slug)}`, { cache: 'no-store' }).then((response) => response.ok ? response.json() : Promise.reject(new Error('not found'))),
      fetch('/api/people', { cache: 'no-store' }).then((response) => response.json()),
    ]).then(([profilePayload, peoplePayload]) => {
      if (!active) return;
      const loaded = profilePayload.person as Person;
      setPerson(loaded);
      const ordered = peoplePayload.people as Person[];
      setRank(ordered.findIndex((item) => item.id === loaded.id) + 1);
      setMessage('');
      setPageSeo(`${loaded.name} Vote Ranking - 1v1Vote`, `Read about ${loaded.name}, view the source profile, and vote in the live 1v1Vote ranking.`, `/people/${loaded.slug}`, loaded.avatar);
    }).catch(() => active && setMessage('This public profile is not available.'));
    return () => { active = false; };
  }, [slug]);

  const vote = async () => {
    if (!person) return;
    const response = await fetch(`/api/people/${encodeURIComponent(person.id)}/vote`, { method: 'POST' });
    const payload = await response.json() as { person?: Person; error?: string };
    setMessage(response.ok ? `Vote registered for ${person.name}. You can vote again in 24 hours.` : payload.error || 'Vote could not be registered.');
    if (payload.person) setPerson(payload.person);
  };

  const share = async () => {
    if (!person) return;
    const url = `${window.location.origin}/people/${person.slug}`;
    void fetch(`/api/people/${encodeURIComponent(person.id)}/share`, { method: 'POST' });
    if (navigator.share) await navigator.share({ title: `${person.name} on 1v1Vote`, text: `Vote for ${person.name} on 1v1Vote.`, url });
    else await navigator.clipboard.writeText(url);
  };

  if (!person) return <main className="flex min-h-screen items-center justify-center bg-[#060a13] px-4 text-center text-sm text-slate-400">{message}</main>;
  return <main className="min-h-screen bg-[#060a13] px-4 py-8 text-slate-100 sm:px-6 sm:py-14"><div className="mx-auto max-w-4xl"><a href="/" className="inline-flex items-center gap-2 text-xs font-bold text-sky-300 hover:text-white"><ArrowLeft className="h-4 w-4" /> Back to live rankings</a><article className="mt-8 overflow-hidden rounded-[2rem] border border-sky-500/20 bg-gradient-to-br from-[#0d1b36] to-[#0a0e19] shadow-2xl"><div className="grid gap-8 p-6 sm:grid-cols-[220px_1fr] sm:p-10"><div className="mx-auto h-48 w-48 overflow-hidden rounded-[2rem] border border-sky-400/40 bg-slate-900 shadow-xl sm:mx-0 sm:h-56 sm:w-56"><img src={person.avatar} alt={person.name} width={224} height={224} className="h-full w-full object-cover" /></div><div><div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-sky-300"><span>Rank #{rank || '—'}</span><span>•</span><span>{person.category}</span>{person.verified && <Check className="h-4 w-4 text-emerald-300" />}</div><h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-6xl">{person.name}</h1><p className="mt-4 text-base leading-8 text-slate-300">{person.shortBio}</p><div className="mt-6 flex flex-wrap gap-3"><button type="button" onClick={() => void vote()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-sky-400 px-4 py-3 text-sm font-black text-slate-950 hover:bg-sky-300"><Vote className="h-4 w-4" /> Vote for {person.name}</button><button type="button" onClick={() => void share()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-black text-white hover:border-sky-400"><Share2 className="h-4 w-4" /> Share profile</button></div>{message && <p className="mt-3 text-xs font-bold text-emerald-300">{message}</p>}</div></div><div className="grid gap-4 border-t border-slate-800/80 p-6 sm:grid-cols-3 sm:p-10"><div><div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Live votes</div><div className="mt-2 text-3xl font-black text-white">{formatCount(person.votes)}</div></div><div><div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Country</div><div className="mt-2 text-xl font-black text-white">{person.country}</div></div><div><div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Shares</div><div className="mt-2 text-3xl font-black text-white">{formatCount(person.shares)}</div></div></div></article><section className="mt-6 grid gap-6 lg:grid-cols-[1fr_.75fr]"><article className="rounded-3xl border border-slate-800 bg-[#0b1221] p-6 sm:p-8"><h2 className="text-2xl font-black text-white">About {person.name}</h2><p className="mt-4 text-sm leading-8 text-slate-300">{person.bio || person.shortBio}</p></article><aside className="rounded-3xl border border-slate-800 bg-[#0b1221] p-6 sm:p-8"><h2 className="text-lg font-black text-white"><Trophy className="mr-2 inline h-5 w-5 text-amber-300" />Profile details</h2><dl className="mt-5 space-y-4 text-sm"><div className="flex justify-between gap-4"><dt className="text-slate-500">Category</dt><dd className="font-bold text-white">{person.category}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Country</dt><dd className="font-bold text-white">{person.country}</dd></div>{person.profileUrl && <div className="pt-2"><a href={person.profileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-bold text-sky-300 hover:text-white">Open public source <ExternalLink className="h-4 w-4" /></a></div>}</dl></aside></section></div></main>;
};


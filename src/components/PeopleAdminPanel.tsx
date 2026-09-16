import React, { useEffect, useState } from 'react';
import { Archive, CheckCircle, Clock3, DatabaseBackup, Edit3, Image, LockKeyhole, Megaphone, Pause, Play, RefreshCw, RotateCcw, Save, ShieldCheck, X } from 'lucide-react';
import { Person, PersonCategory, PersonCountry, PeopleAutomationStatus, PersonPromotion } from '../types';

const categories: PersonCategory[] = ['Public Figure', 'Religious Scholar', 'Politics', 'Creator', 'Sports', 'Entertainment', 'Business'];
const countries: PersonCountry[] = ['Pakistan', 'India', 'USA', 'Global'];
const emptyForm: Partial<Person> = { name: '', shortBio: '', bio: '', category: 'Public Figure', country: 'Global', avatar: '', profileUrl: '', researchUrl: '' };

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Not run yet';
}

export const PeopleAdminPanel: React.FC = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [password, setPassword] = useState('');
  const [people, setPeople] = useState<Person[]>([]);
  const [automation, setAutomation] = useState<PeopleAutomationStatus | null>(null);
  const [promotions, setPromotions] = useState<PersonPromotion[]>([]);
  const [promotionForm, setPromotionForm] = useState({ personId: '', label: 'Featured profile', reason: '', hours: '24' });
  const [form, setForm] = useState<Partial<Person>>(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const loadPeople = async () => {
    const response = await fetch('/api/admin/people', { credentials: 'include', cache: 'no-store' });
    if (response.ok) setPeople((await response.json()).people || []);
  };

  const loadAutomation = async () => {
    const response = await fetch('/api/admin/people/automation', { credentials: 'include', cache: 'no-store' });
    if (response.ok) setAutomation((await response.json()).automation || null);
  };

  const loadPromotions = async () => {
    const response = await fetch('/api/admin/promotions', { credentials: 'include', cache: 'no-store' });
    if (response.ok) setPromotions((await response.json()).promotions || []);
  };

  useEffect(() => {
    fetch('/api/admin/session', { credentials: 'include' })
      .then((response) => response.json())
      .then((data) => {
        const loggedIn = Boolean(data.authenticated);
        setAuthenticated(loggedIn);
        setConfigured(data.configured !== false);
        if (loggedIn) void Promise.all([loadPeople(), loadAutomation(), loadPromotions()]);
      })
      .catch(() => setMessage('Admin service is unavailable.'));
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    const interval = window.setInterval(() => void Promise.all([loadPeople(), loadAutomation(), loadPromotions()]), 30000);
    return () => window.clearInterval(interval);
  }, [authenticated]);

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const response = await fetch('/api/admin/login', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) return setMessage(data.error || 'Unable to sign in.');
    setPassword('');
    setAuthenticated(true);
    await Promise.all([loadPeople(), loadAutomation(), loadPromotions()]);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const response = await fetch(editingId ? `/api/admin/people/${encodeURIComponent(editingId)}` : '/api/admin/people', { method: editingId ? 'PUT' : 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    setMessage(response.ok ? (editingId ? 'Profile updated safely. The image URL was verified and is live.' : 'Profile added safely. The image URL was verified and is live.') : data.error || 'Could not save this profile.');
    if (response.ok) { setForm(emptyForm); setEditingId(''); await loadPeople(); }
  };

  const createPromotion = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const response = await fetch('/api/admin/promotions', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ personId: promotionForm.personId, label: promotionForm.label, reason: promotionForm.reason, endsAt: new Date(Date.now() + Number(promotionForm.hours) * 60 * 60 * 1000).toISOString() }) });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    setMessage(response.ok ? 'Featured placement started. Organic votes were not changed.' : data.error || 'Could not start promotion.');
    if (response.ok) { setPromotionForm({ personId: '', label: 'Featured profile', reason: '', hours: '24' }); await loadPromotions(); }
  };

  const revokePromotion = async (promotion: PersonPromotion) => {
    const response = await fetch(`/api/admin/promotions/${encodeURIComponent(promotion.id)}`, { method: 'DELETE', credentials: 'include' });
    setMessage(response.ok ? 'Promotion ended. Organic votes were unchanged.' : 'Could not end promotion.');
    await loadPromotions();
  };

  const archive = async (person: Person) => {
    if (!window.confirm(`Archive ${person.name}? Votes and history stay safe.`)) return;
    await fetch(`/api/admin/people/${encodeURIComponent(person.id)}`, { method: 'DELETE', credentials: 'include' });
    await loadPeople();
    setMessage(`${person.name} archived.`);
  };

  const restore = async (person: Person) => {
    await fetch(`/api/admin/people/${encodeURIComponent(person.id)}/restore`, { method: 'POST', credentials: 'include' });
    await loadPeople();
    setMessage(`${person.name} restored.`);
  };

  const refresh = async () => {
    setBusy(true);
    const response = await fetch('/api/admin/people/catalog', { method: 'POST', credentials: 'include' });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    setAutomation(data.automation || automation);
    setMessage(response.ok ? 'Catalog import started. The server will validate up to 200 public profiles in the background.' : data.error || 'Catalog import could not start.');
    await loadPeople();
  };

  const backup = async () => {
    const response = await fetch('/api/admin/backup', { method: 'POST', credentials: 'include' });
    const data = await response.json().catch(() => ({}));
    setMessage(response.ok ? `Backup created: ${data.backup}` : data.error || 'Backup failed.');
  };

  const toggleAutomation = async () => {
    if (!automation) return;
    setBusy(true);
    const response = await fetch('/api/admin/people/automation', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paused: !automation.paused }) });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    setAutomation(data.automation || automation);
    setMessage(response.ok ? (automation.paused ? 'Profile automation resumed.' : 'Profile automation paused.') : data.error || 'Could not change automation state.');
  };

  const setField = (key: keyof Person, value: string) => setForm((current) => ({ ...current, [key]: value }));

  if (!authenticated) return <main className="flex min-h-screen items-center justify-center bg-[#060a13] px-4"><form onSubmit={(event) => void login(event)} className="w-full max-w-md rounded-[2rem] border border-slate-800 bg-[#0b1221] p-7 shadow-2xl"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-500/10 text-amber-300"><LockKeyhole className="h-7 w-7" /></div><h1 className="mt-5 text-center text-2xl font-black text-white">Private admin access</h1><p className="mt-2 text-center text-sm text-slate-400">Profile control, discovery and transparent promotions.</p>{!configured && <p className="mt-5 rounded-xl border border-rose-500/40 bg-rose-950/30 p-3 text-xs text-rose-300">Admin access is not configured.</p>}{message && <p className="mt-5 rounded-xl border border-rose-500/40 bg-rose-950/30 p-3 text-xs text-rose-300">{message}</p>}<input autoFocus type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Admin password" className="mt-5 w-full rounded-xl border border-slate-700 bg-[#060b17] px-4 py-3 text-white outline-none focus:border-amber-400" disabled={!configured} /><button disabled={!configured || !password || busy} className="mt-4 w-full rounded-xl bg-amber-500 py-3 font-bold text-slate-950 disabled:opacity-40">{busy ? 'Checking...' : 'Unlock admin panel'}</button><a href="/" className="mt-4 block text-center text-sm text-slate-400 hover:text-white">Return to public site</a></form></main>;

  const activePromotions = promotions.filter((promotion) => !promotion.revokedAt && new Date(promotion.endsAt).getTime() > Date.now());
  return <main className="min-h-screen bg-[#060a13] px-4 py-7 text-slate-100 sm:px-6"><div className="mx-auto max-w-7xl"><header className="flex flex-wrap items-center justify-between gap-4"><div><div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-emerald-300"><ShieldCheck className="h-4 w-4" /> Secure admin session</div><h1 className="mt-2 text-3xl font-black text-white">Profile control room</h1><p className="mt-2 text-sm text-slate-400">Manage source-backed profiles, backups, discovery and disclosed featured placements.</p></div><div className="flex flex-wrap gap-2"><button onClick={() => void refresh()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs font-bold text-sky-200"><RefreshCw className="h-4 w-4" /> Research now</button><button onClick={() => void backup()} className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-200"><DatabaseBackup className="h-4 w-4" /> Backup now</button><button onClick={() => void fetch('/api/admin/logout', { method: 'POST', credentials: 'include' }).then(() => window.location.href = '/')} className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300">Sign out</button></div></header>{message && <div className="mt-5 flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-3 text-xs font-bold text-emerald-200"><CheckCircle className="h-4 w-4" />{message}</div>}

      {automation && <section className="mt-6 rounded-3xl border border-sky-500/20 bg-[#0b1221] p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-sky-300"><Clock3 className="h-4 w-4" /> Profile discovery automation</div><h2 className="mt-2 text-xl font-black text-white">One validated profile every 10 minutes</h2><p className="mt-1 text-xs text-slate-500">Discovery never creates votes. Public ranking votes remain organic.</p></div><button type="button" onClick={() => void toggleAutomation()} disabled={busy} className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-black ${automation.paused ? 'bg-emerald-500 text-slate-950' : 'border border-amber-500/40 bg-amber-500/10 text-amber-200'}`}>{automation.paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}{automation.paused ? 'Resume automation' : 'Pause automation'}</button></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-2xl border border-slate-800 bg-[#060b17] p-4"><div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Status</div><div className="mt-2 font-black text-white">{automation.paused ? 'Paused' : automation.state}</div></div><div className="rounded-2xl border border-slate-800 bg-[#060b17] p-4"><div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Provider</div><div className="mt-2 text-sm font-bold text-white">{automation.provider}</div></div><div className="rounded-2xl border border-slate-800 bg-[#060b17] p-4"><div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Last run</div><div className="mt-2 text-sm font-bold text-white">{formatDate(automation.lastRunAt)}</div></div><div className="rounded-2xl border border-slate-800 bg-[#060b17] p-4"><div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Next run</div><div className="mt-2 text-sm font-bold text-white">{formatDate(automation.nextRunAt)}</div></div></div></section>}

      <section className="mt-6 rounded-3xl border border-amber-400/20 bg-gradient-to-br from-[#211a10] to-[#0b1221] p-5 shadow-xl"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-amber-300"><Megaphone className="h-4 w-4" /> Transparent promotion</div><h2 className="mt-2 text-xl font-black text-white">Feature a profile without changing organic votes</h2><p className="mt-1 max-w-2xl text-xs leading-6 text-slate-400">Promotions are labeled and expire automatically. They never add fake votes or alter the organic ranking.</p></div><span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-200">{activePromotions.length}/3 active</span></div><form onSubmit={(event) => void createPromotion(event)} className="mt-5 grid gap-3 md:grid-cols-[1.1fr_1fr_1.4fr_.7fr_auto]"><select required value={promotionForm.personId} onChange={(event) => setPromotionForm((current) => ({ ...current, personId: event.target.value }))} className="rounded-xl border border-slate-700 bg-[#060b17] px-3 py-2.5 text-sm text-white"><option value="">Choose profile</option>{people.filter((person) => !person.archivedAt).map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select><input required value={promotionForm.label} onChange={(event) => setPromotionForm((current) => ({ ...current, label: event.target.value }))} placeholder="Placement label" className="rounded-xl border border-slate-700 bg-[#060b17] px-3 py-2.5 text-sm text-white" /><input value={promotionForm.reason} onChange={(event) => setPromotionForm((current) => ({ ...current, reason: event.target.value }))} placeholder="Reason for audit" className="rounded-xl border border-slate-700 bg-[#060b17] px-3 py-2.5 text-sm text-white" /><select value={promotionForm.hours} onChange={(event) => setPromotionForm((current) => ({ ...current, hours: event.target.value }))} className="rounded-xl border border-slate-700 bg-[#060b17] px-3 py-2.5 text-sm text-white"><option value="6">6 hours</option><option value="24">24 hours</option><option value="72">3 days</option><option value="168">7 days</option></select><button disabled={busy || !promotionForm.personId} className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-black text-slate-950 disabled:opacity-40"><Megaphone className="h-4 w-4" /> Feature</button></form>{activePromotions.length > 0 && <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{activePromotions.map((promotion) => <div key={promotion.id} className="flex items-center justify-between gap-3 rounded-2xl border border-amber-400/20 bg-black/20 p-3"><div className="min-w-0"><div className="truncate text-xs font-black text-white">{people.find((person) => person.id === promotion.personId)?.name || promotion.personId}</div><div className="mt-1 text-[10px] text-amber-200">{promotion.label} · ends {formatDate(promotion.endsAt)}</div></div><button type="button" onClick={() => void revokePromotion(promotion)} className="shrink-0 rounded-lg border border-rose-400/30 px-2 py-1 text-[10px] font-black text-rose-200">End</button></div>)}</div>}</section>

      <div className="mt-7 grid gap-6 lg:grid-cols-[390px_1fr]"><form onSubmit={(event) => void save(event)} className="h-fit rounded-3xl border border-slate-800 bg-[#0b1221] p-5"><div className="flex items-center justify-between"><h2 className="text-lg font-black text-white">{editingId ? 'Edit profile' : 'Add profile'}</h2>{editingId && <button type="button" onClick={() => { setEditingId(''); setForm(emptyForm); }} className="text-slate-500 hover:text-white"><X className="h-4 w-4" /></button>}</div><div className="mt-4 space-y-3">{([['name', 'Full name'], ['shortBio', 'Short bio'], ['avatar', 'Real image HTTPS URL'], ['profileUrl', 'Public source URL'], ['researchUrl', 'Research URL']] as Array<[keyof Person, string]>).map(([key, label]) => <label key={String(key)} className="block text-xs font-bold text-slate-400">{label}<input required={key === 'name' || key === 'avatar'} value={String(form[key] || '')} onChange={(event) => setField(key, event.target.value)} className="mt-1 w-full rounded-xl border border-slate-800 bg-[#060b17] px-3 py-2.5 text-sm text-white outline-none focus:border-sky-500" /></label>)}<label className="block text-xs font-bold text-slate-400">Detailed bio<textarea value={String(form.bio || '')} onChange={(event) => setField('bio', event.target.value)} className="mt-1 min-h-28 w-full rounded-xl border border-slate-800 bg-[#060b17] px-3 py-2.5 text-sm text-white outline-none focus:border-sky-500" /></label><div className="grid grid-cols-2 gap-2"><label className="text-xs font-bold text-slate-400">Category<select value={form.category || 'Public Figure'} onChange={(event) => setField('category', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-800 bg-[#060b17] px-2 py-2.5 text-sm text-white">{categories.map((item) => <option key={item}>{item}</option>)}</select></label><label className="text-xs font-bold text-slate-400">Country<select value={form.country || 'Global'} onChange={(event) => setField('country', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-800 bg-[#060b17] px-2 py-2.5 text-sm text-white">{countries.map((item) => <option key={item}>{item}</option>)}</select></label></div></div><button disabled={busy} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-3 text-sm font-black text-slate-950 disabled:opacity-40"><Save className="h-4 w-4" />{editingId ? 'Save profile' : 'Add profile'}</button></form><section className="rounded-3xl border border-slate-800 bg-[#0b1221] p-5"><div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-black text-white">Profile catalog</h2><p className="mt-1 text-xs text-slate-500">{people.length} records · promotions never change organic votes</p></div><Image className="h-5 w-5 text-sky-300" /></div><div className="mt-4 space-y-2">{people.map((person) => <div key={person.id} className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3 ${person.archivedAt ? 'border-slate-800 bg-slate-950/40 opacity-60' : 'border-slate-800 bg-[#060b17]'}`}><div className="flex min-w-0 items-center gap-3"><img src={person.avatar} alt="" width={40} height={40} className="h-10 w-10 rounded-xl object-cover" /><div className="min-w-0"><div className="truncate text-sm font-black text-white">{person.name}</div><div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">{person.category} · {person.country} · {person.votes} organic votes</div>{person.promotion && <div className="mt-1 text-[10px] font-bold text-amber-300">Promoted: {person.promotion.label}</div>}</div></div><div className="flex items-center gap-2">{person.archivedAt ? <button type="button" onClick={() => void restore(person)} className="rounded-lg border border-emerald-400/30 p-2 text-emerald-300" aria-label={`Restore ${person.name}`}><RotateCcw className="h-4 w-4" /></button> : <><button type="button" onClick={() => { setEditingId(person.id); setForm(person); }} className="rounded-lg border border-sky-400/30 p-2 text-sky-300" aria-label={`Edit ${person.name}`}><Edit3 className="h-4 w-4" /></button><button type="button" onClick={() => void archive(person)} className="rounded-lg border border-rose-400/30 p-2 text-rose-300" aria-label={`Archive ${person.name}`}><Archive className="h-4 w-4" /></button></>}</div></div>)}</div></section></div></div></main>;
};

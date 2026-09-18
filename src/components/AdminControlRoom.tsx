import React, { useEffect, useState } from 'react';
import { Archive, CheckCircle, Clock3, DatabaseBackup, LockKeyhole, Megaphone, Pause, Play, RefreshCw, RotateCcw, ShieldCheck, X } from 'lucide-react';
import { Person, PersonCategory, PersonCountry, PeopleAutomationStatus, PersonPromotion, PromotionRequest, SupportCreditAdjustment } from '../types';
import { apiUrl } from '../services/api';

const fetch = (input: RequestInfo | URL, init?: RequestInit) => globalThis.fetch(typeof input === 'string' && input.startsWith('/api/') ? apiUrl(input) : input, init);

const categories: PersonCategory[] = ['Public Figure', 'Religious Scholar', 'Politics', 'Creator', 'Sports', 'Entertainment', 'Business'];
const countries: PersonCountry[] = ['Pakistan', 'India', 'USA', 'Global'];
const emptyForm: Partial<Person> = { name: '', shortBio: '', bio: '', category: 'Public Figure', country: 'Global', avatar: '', profileUrl: '', researchUrl: '' };

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Not run yet';
}

export const AdminControlRoom: React.FC = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [password, setPassword] = useState('');
  const [people, setPeople] = useState<Person[]>([]);
  const [automation, setAutomation] = useState<PeopleAutomationStatus | null>(null);
  const [promotions, setPromotions] = useState<PersonPromotion[]>([]);
  const [requests, setRequests] = useState<PromotionRequest[]>([]);
  const [supportAdjustments, setSupportAdjustments] = useState<SupportCreditAdjustment[]>([]);
  const [form, setForm] = useState<Partial<Person>>(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [promotionForm, setPromotionForm] = useState({ personId: '', hours: '24', reason: '' });
  const [supportForm, setSupportForm] = useState({ personId: '', delta: '', reason: '' });
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [peopleResponse, automationResponse, promotionResponse, requestResponse, supportResponse] = await Promise.all([
       fetch(apiUrl('/api/admin/people'), { credentials: 'include', cache: 'no-store' }),
       fetch(apiUrl('/api/admin/people/automation'), { credentials: 'include', cache: 'no-store' }),
       fetch(apiUrl('/api/admin/promotions'), { credentials: 'include', cache: 'no-store' }),
       fetch(apiUrl('/api/admin/promotion-requests'), { credentials: 'include', cache: 'no-store' }),
       fetch(apiUrl('/api/admin/support-adjustments'), { credentials: 'include', cache: 'no-store' }),
    ]);
    if (peopleResponse.ok) setPeople((await peopleResponse.json()).people || []);
    if (automationResponse.ok) setAutomation((await automationResponse.json()).automation || null);
    if (promotionResponse.ok) setPromotions((await promotionResponse.json()).promotions || []);
    if (requestResponse.ok) setRequests((await requestResponse.json()).requests || []);
    if (supportResponse.ok) setSupportAdjustments((await supportResponse.json()).adjustments || []);
  };

  useEffect(() => {
     fetch(apiUrl('/api/admin/session'), { credentials: 'include' }).then((response) => response.json()).then((data) => {
      setAuthenticated(Boolean(data.authenticated));
      setConfigured(data.configured !== false);
      if (data.authenticated) void load();
    }).catch(() => setMessage('Admin service is unavailable.'));
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    const timer = window.setInterval(() => void load(), 30000);
    return () => window.clearInterval(timer);
  }, [authenticated]);

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
     const response = await fetch(apiUrl('/api/admin/login'), { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) return setMessage(data.error || 'Unable to sign in.');
    setPassword('');
    setAuthenticated(true);
    await load();
  };

  const catalog = async () => {
    setBusy(true);
     const response = await fetch(apiUrl('/api/admin/people/catalog'), { method: 'POST', credentials: 'include' });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    setAutomation(data.automation || automation);
    setMessage(response.ok ? 'Catalog import started. Up to 200 candidates will be validated in the background.' : data.error || 'Catalog import could not start.');
  };

  const toggleAutomation = async () => {
    if (!automation) return;
    setBusy(true);
     const response = await fetch(apiUrl('/api/admin/people/automation'), { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paused: !automation.paused }) });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    setAutomation(data.automation || automation);
  };

  const savePerson = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
     const response = await fetch(apiUrl(editingId ? `/api/admin/people/${encodeURIComponent(editingId)}` : '/api/admin/people'), { method: editingId ? 'PUT' : 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    setMessage(response.ok ? 'Profile saved.' : data.error || 'Profile could not be saved.');
    if (response.ok) { setForm(emptyForm); setEditingId(''); await load(); }
  };

  const createPromotion = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
     const response = await fetch(apiUrl('/api/admin/promotions'), { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ personId: promotionForm.personId, label: 'Sponsored profile', reason: promotionForm.reason, endsAt: new Date(Date.now() + Number(promotionForm.hours) * 60 * 60 * 1000).toISOString() }) });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    setMessage(response.ok ? 'Sponsored placement published. Organic votes were unchanged.' : data.error || 'Placement could not start.');
    if (response.ok) { setPromotionForm({ personId: '', hours: '24', reason: '' }); await load(); }
  };

  const reviewRequest = async (request: PromotionRequest, decision: 'approve' | 'reject') => {
    setBusy(true);
     const response = await fetch(apiUrl(`/api/admin/promotion-requests/${encodeURIComponent(request.id)}/review`), { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ decision }) });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    setMessage(response.ok ? (decision === 'approve' ? 'Paid request approved and sponsored label published.' : 'Paid request rejected.') : data.error || 'Request review failed.');
    await load();
  };

  const adjustSupportCredits = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
     const response = await fetch(apiUrl(`/api/admin/people/${encodeURIComponent(supportForm.personId)}/support-credits`), { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ delta: Number(supportForm.delta), reason: supportForm.reason }) });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    setMessage(response.ok ? 'Support credit updated. Organic votes and rank were unchanged.' : data.error || 'Support credit could not be updated.');
    if (response.ok) { setSupportForm({ personId: '', delta: '', reason: '' }); await load(); }
  };

  const archive = async (person: Person) => {
    if (!window.confirm(`Archive ${person.name}? Votes remain safe.`)) return;
     await fetch(apiUrl(`/api/admin/people/${encodeURIComponent(person.id)}`), { method: 'DELETE', credentials: 'include' });
    await load();
  };

  if (!authenticated) return <main className="flex min-h-screen items-center justify-center bg-[#060a13] px-4"><form onSubmit={(event) => void login(event)} className="w-full max-w-md rounded-[2rem] border border-slate-800 bg-[#0b1221] p-7 shadow-2xl"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-500/10 text-amber-300"><LockKeyhole className="h-7 w-7" /></div><h1 className="mt-5 text-center text-2xl font-black text-white">Private admin access</h1><p className="mt-2 text-center text-sm text-slate-400">Profiles, imports, payments and transparent promotions.</p>{message && <p className="mt-5 rounded-xl border border-rose-500/40 bg-rose-950/30 p-3 text-xs text-rose-300">{message}</p>}<input autoFocus type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Admin password" className="mt-5 w-full rounded-xl border border-slate-700 bg-[#060b17] px-4 py-3 text-white outline-none focus:border-amber-400" disabled={!configured} /><button disabled={!configured || !password || busy} className="mt-4 w-full rounded-xl bg-amber-500 py-3 font-bold text-slate-950 disabled:opacity-40">{busy ? 'Checking...' : 'Unlock admin panel'}</button><a href="/" className="mt-4 block text-center text-sm text-slate-400 hover:text-white">Return to public site</a></form></main>;

  const pendingRequests = requests.filter((request) => request.status === 'pending');
  const activePromotions = promotions.filter((promotion) => !promotion.revokedAt && new Date(promotion.endsAt).getTime() > Date.now());
  return <main className="min-h-screen bg-[#060a13] px-4 py-7 text-slate-100 sm:px-6"><div className="mx-auto max-w-7xl"><header className="flex flex-wrap items-center justify-between gap-4"><div><div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-emerald-300"><ShieldCheck className="h-4 w-4" /> Secure admin session</div><h1 className="mt-2 text-3xl font-black text-white">Profile control room</h1><p className="mt-2 text-sm text-slate-400">Source-backed profiles, validated imports and paid placement review.</p></div><div className="flex flex-wrap gap-2"><button onClick={() => void catalog()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs font-bold text-sky-200"><RefreshCw className="h-4 w-4" /> Import catalog</button><button onClick={() => void fetch('/api/admin/backup', { method: 'POST', credentials: 'include' }).then(() => setMessage('Backup requested.'))} className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-200"><DatabaseBackup className="h-4 w-4" /> Backup</button><button onClick={() => void fetch('/api/admin/logout', { method: 'POST', credentials: 'include' }).then(() => window.location.href = '/')} className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300">Sign out</button></div></header>{message && <div className="mt-5 flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-3 text-xs font-bold text-emerald-200"><CheckCircle className="h-4 w-4" />{message}</div>}

      {automation && <section className="mt-6 rounded-3xl border border-sky-500/20 bg-[#0b1221] p-5"><div className="flex flex-wrap items-center justify-between gap-4"><div><div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-sky-300"><Clock3 className="h-4 w-4" /> Profile discovery automation</div><h2 className="mt-2 text-xl font-black text-white">Validated research every 10 minutes</h2><p className="mt-1 text-xs text-slate-500">The catalog import and scheduled research never create votes.</p></div><div className="flex gap-2"><button type="button" onClick={() => void catalog()} disabled={busy} className="rounded-xl bg-sky-500 px-3 py-2 text-xs font-black text-slate-950">Import up to 200</button><button type="button" onClick={() => void toggleAutomation()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-xs font-black text-slate-300">{automation.paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}{automation.paused ? 'Resume' : 'Pause'}</button></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-2xl border border-slate-800 bg-[#060b17] p-4"><div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Status</div><div className="mt-2 font-black text-white">{automation.paused ? 'Paused' : automation.state}</div></div><div className="rounded-2xl border border-slate-800 bg-[#060b17] p-4"><div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Profiles</div><div className="mt-2 font-black text-white">{people.filter((person) => !person.archivedAt).length} public · {people.length} total</div></div><div className="rounded-2xl border border-slate-800 bg-[#060b17] p-4"><div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Last run</div><div className="mt-2 text-sm font-bold text-white">{formatDate(automation.lastRunAt)}</div></div><div className="rounded-2xl border border-slate-800 bg-[#060b17] p-4"><div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Next run</div><div className="mt-2 text-sm font-bold text-white">{formatDate(automation.nextRunAt)}</div></div></div></section>}

      <section className="mt-6 rounded-3xl border border-amber-400/25 bg-gradient-to-br from-[#211a10] to-[#0b1221] p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-amber-300"><Megaphone className="h-4 w-4" /> Paid promotion review</div><h2 className="mt-2 text-xl font-black text-white">{pendingRequests.length} pending paid requests · {activePromotions.length}/3 active</h2><p className="mt-1 text-xs text-slate-400">Approve only after confirming payment. Approval changes placement visibility, never organic votes.</p></div></div>{pendingRequests.length > 0 && <div className="mt-5 space-y-3">{pendingRequests.map((request) => <div key={request.id} className="grid gap-3 rounded-2xl border border-amber-400/20 bg-[#060b17] p-4 lg:grid-cols-[1fr_auto_auto]"><div><div className="font-black text-white">{request.personName} <span className="font-normal text-slate-500">· {request.durationHours}h · PKR {request.paymentAmountPkr.toLocaleString()}</span></div><div className="mt-1 text-xs text-slate-400">{request.requesterName} · {request.requesterEmail}</div><div className="mt-1 text-xs text-amber-200">Payment reference: {request.paymentReference}</div></div><button type="button" disabled={busy} onClick={() => void reviewRequest(request, 'approve')} className="rounded-xl bg-emerald-400 px-4 py-2 text-xs font-black text-slate-950">Approve</button><button type="button" disabled={busy} onClick={() => void reviewRequest(request, 'reject')} className="rounded-xl border border-rose-500/40 px-4 py-2 text-xs font-black text-rose-200">Reject</button></div>)}</div>}<form onSubmit={(event) => void createPromotion(event)} className="mt-5 grid gap-3 md:grid-cols-[1.2fr_.7fr_1.5fr_auto]"><select required value={promotionForm.personId} onChange={(event) => setPromotionForm((current) => ({ ...current, personId: event.target.value }))} className="rounded-xl border border-slate-700 bg-[#060b17] px-3 py-2.5 text-sm text-white"><option value="">Choose profile for manual feature</option>{people.filter((person) => !person.archivedAt).map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select><select value={promotionForm.hours} onChange={(event) => setPromotionForm((current) => ({ ...current, hours: event.target.value }))} className="rounded-xl border border-slate-700 bg-[#060b17] px-3 py-2.5 text-sm text-white"><option value="24">24 hours</option><option value="72">3 days</option><option value="168">7 days</option></select><input value={promotionForm.reason} onChange={(event) => setPromotionForm((current) => ({ ...current, reason: event.target.value }))} placeholder="Internal audit note" className="rounded-xl border border-slate-700 bg-[#060b17] px-3 py-2.5 text-sm text-white" /><button disabled={busy} className="rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-black text-slate-950">Feature transparently</button></form></section>

      <div className="mt-7 grid gap-6 lg:grid-cols-[380px_1fr]"><form onSubmit={(event) => void savePerson(event)} className="h-fit rounded-3xl border border-slate-800 bg-[#0b1221] p-5"><div className="flex items-center justify-between"><h2 className="text-lg font-black text-white">{editingId ? 'Edit profile' : 'Add profile'}</h2>{editingId && <button type="button" onClick={() => { setEditingId(''); setForm(emptyForm); }} className="text-slate-500 hover:text-white"><X className="h-4 w-4" /></button>}</div><div className="mt-4 space-y-3">{([['name', 'Full name'], ['shortBio', 'Short bio'], ['avatar', 'Real image HTTPS URL'], ['profileUrl', 'Public source URL'], ['researchUrl', 'Research URL']] as Array<[keyof Person, string]>).map(([key, label]) => <label key={String(key)} className="block text-xs font-bold text-slate-400">{label}<input required={key === 'name' || key === 'avatar'} value={String(form[key] || '')} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-800 bg-[#060b17] px-3 py-2.5 text-sm text-white outline-none focus:border-sky-500" /></label>)}<textarea value={String(form.bio || '')} onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))} placeholder="Detailed bio" className="min-h-24 w-full rounded-xl border border-slate-800 bg-[#060b17] px-3 py-2.5 text-sm text-white" /><div className="grid grid-cols-2 gap-2"><select value={form.category || 'Public Figure'} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as PersonCategory }))} className="rounded-xl border border-slate-800 bg-[#060b17] px-2 py-2.5 text-sm text-white">{categories.map((item) => <option key={item}>{item}</option>)}</select><select value={form.country || 'Global'} onChange={(event) => setForm((current) => ({ ...current, country: event.target.value as PersonCountry }))} className="rounded-xl border border-slate-800 bg-[#060b17] px-2 py-2.5 text-sm text-white">{countries.map((item) => <option key={item}>{item}</option>)}</select></div></div><button disabled={busy} className="mt-4 w-full rounded-xl bg-sky-500 py-3 text-sm font-black text-slate-950">{editingId ? 'Save profile' : 'Add profile'}</button></form><section className="rounded-3xl border border-slate-800 bg-[#0b1221] p-5"><h2 className="text-lg font-black text-white">Profile catalog</h2><p className="mt-1 text-xs text-slate-500">{people.length} records · archive hides a profile without deleting votes.</p><div className="mt-4 grid gap-2 sm:grid-cols-2">{people.map((person) => <div key={person.id} className={`flex items-center justify-between gap-3 rounded-2xl border p-3 ${person.archivedAt ? 'border-slate-800/60 bg-[#060b17] opacity-60' : 'border-slate-800 bg-[#080e1b]'}`}><div className="min-w-0"><div className="truncate text-sm font-black text-white">{person.name}</div><div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">{person.category} · {person.country} · {person.votes} organic votes</div></div>{person.archivedAt ? <button type="button" onClick={() => void fetch(`/api/admin/people/${encodeURIComponent(person.id)}/restore`, { method: 'POST', credentials: 'include' }).then(load)} className="shrink-0 text-emerald-300"><RotateCcw className="h-4 w-4" /></button> : <button type="button" onClick={() => void archive(person)} className="shrink-0 text-slate-500 hover:text-rose-300"><Archive className="h-4 w-4" /></button>}</div>)}</div></section></div>
      <section className="mt-6 rounded-3xl border border-amber-400/25 bg-gradient-to-br from-[#211a10] to-[#0b1221] p-5 shadow-xl"><div><div className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">Transparent support credits</div><h2 className="mt-2 text-xl font-black text-white">Bootstrap discovery without fake organic votes</h2><p className="mt-1 max-w-2xl text-xs leading-6 text-slate-400">Credits are disclosed, reversible, and excluded from organic votes and rankings. Every change needs a reason and is audited.</p></div><form onSubmit={(event) => void adjustSupportCredits(event)} className="mt-5 grid gap-3 md:grid-cols-[1.4fr_.5fr_1.7fr_auto]"><select required value={supportForm.personId} onChange={(event) => setSupportForm((current) => ({ ...current, personId: event.target.value }))} className="rounded-xl border border-slate-700 bg-[#060b17] px-3 py-2.5 text-sm text-white"><option value="">Choose profile</option>{people.filter((person) => !person.archivedAt).map((person) => <option key={person.id} value={person.id}>{person.name} · current +{person.supportCredits || 0}</option>)}</select><input required type="number" min="-100000" max="100000" value={supportForm.delta} onChange={(event) => setSupportForm((current) => ({ ...current, delta: event.target.value }))} placeholder="+10 / -10" className="rounded-xl border border-slate-700 bg-[#060b17] px-3 py-2.5 text-sm text-white" /><input required value={supportForm.reason} onChange={(event) => setSupportForm((current) => ({ ...current, reason: event.target.value }))} placeholder="Reason for the adjustment" className="rounded-xl border border-slate-700 bg-[#060b17] px-3 py-2.5 text-sm text-white" /><button disabled={busy} className="rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-black text-slate-950 disabled:opacity-50">Apply audited credit</button></form>{supportAdjustments.length > 0 && <div className="mt-4 grid gap-2 text-xs text-slate-400">{supportAdjustments.slice(0, 5).map((item) => <div key={item.id} className="flex flex-wrap justify-between gap-2 rounded-xl border border-slate-800 bg-[#060b17] px-3 py-2"><span>{people.find((person) => person.id === item.personId)?.name || item.personId}</span><span className={item.delta >= 0 ? 'text-amber-300' : 'text-emerald-300'}>{item.delta >= 0 ? '+' : ''}{item.delta} · {item.reason}</span></div>)}</div>}</section></div></main>;
};

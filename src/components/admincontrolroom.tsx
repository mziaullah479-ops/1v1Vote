import React, { useEffect, useState } from 'react';
import { Archive, CheckCircle, DatabaseBackup, LockKeyhole, RotateCcw, ShieldCheck, X } from 'lucide-react';
import { Person, PersonCategory, PersonCountry } from '../types';
import { apiFetch, apiUrl } from '../services/api';

const categories: PersonCategory[] = ['Public Figure', 'Religious Scholar', 'Politics', 'Creator', 'Sports', 'Entertainment', 'Business'];
const countries: PersonCountry[] = ['Pakistan', 'India', 'USA', 'Global'];
const emptyForm: Partial<Person> = { name: '', shortBio: '', bio: '', category: 'Public Figure', country: 'Global', avatar: '', profileUrl: '', researchUrl: '' };

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Not available';
}

export const AdminControlRoom: React.FC = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [password, setPassword] = useState('');
  const [people, setPeople] = useState<Person[]>([]);
  const [form, setForm] = useState<Partial<Person>>(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const response = await apiFetch(apiUrl('/api/admin/people'), { credentials: 'include', cache: 'no-store' });
    if (response.ok) setPeople((await response.json()).people || []);
  };

  useEffect(() => {
    void apiFetch(apiUrl('/api/admin/session'), { credentials: 'include' }).then((response) => response.json()).then((data) => {
      setAuthenticated(Boolean(data.authenticated));
      setConfigured(data.configured !== false);
      if (data.authenticated) void load();
    }).catch(() => setMessage('Admin service is unavailable.'));
  }, []);

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const response = await apiFetch(apiUrl('/api/admin/login'), { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) return setMessage(data.error || 'Unable to sign in.');
    setPassword('');
    setAuthenticated(true);
    await load();
  };

  const savePerson = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const response = await apiFetch(apiUrl(editingId ? `/api/admin/people/${encodeURIComponent(editingId)}` : '/api/admin/people'), { method: editingId ? 'PUT' : 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    setMessage(response.ok ? 'Profile saved.' : data.error || 'Profile could not be saved.');
    if (response.ok) {
      setForm(emptyForm);
      setEditingId('');
      await load();
    }
  };

  const archive = async (person: Person) => {
    if (!window.confirm(`Archive ${person.name}? Votes remain safe.`)) return;
    await apiFetch(apiUrl(`/api/admin/people/${encodeURIComponent(person.id)}`), { method: 'DELETE', credentials: 'include' });
    await load();
  };

  const restore = async (person: Person) => {
    await apiFetch(apiUrl(`/api/admin/people/${encodeURIComponent(person.id)}/restore`), { method: 'POST', credentials: 'include' });
    await load();
  };

  const backup = async () => {
    const response = await apiFetch(apiUrl('/api/admin/backup'), { method: 'POST', credentials: 'include' });
    const data = await response.json().catch(() => ({}));
    setMessage(response.ok ? `Backup created: ${data.backup || 'ready'}.` : data.error || 'Backup failed.');
  };

  if (!authenticated) return <main className="flex min-h-screen items-center justify-center bg-[#060a13] px-4"><form onSubmit={(event) => void login(event)} className="w-full max-w-md rounded-[2rem] border border-slate-800 bg-[#0b1221] p-7 shadow-2xl"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-500/10 text-amber-300"><LockKeyhole className="h-7 w-7" /></div><h1 className="mt-5 text-center text-2xl font-black text-white">Private admin access</h1><p className="mt-2 text-center text-sm text-slate-400">Manage source-backed profiles and safe archives.</p>{message && <p className="mt-5 rounded-xl border border-rose-500/40 bg-rose-950/30 p-3 text-xs text-rose-300">{message}</p>}<input autoFocus type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Admin password" className="mt-5 w-full rounded-xl border border-slate-700 bg-[#060b17] px-4 py-3 text-white outline-none focus:border-amber-400" disabled={!configured} /><button disabled={!configured || !password || busy} className="mt-4 w-full rounded-xl bg-amber-500 py-3 font-bold text-slate-950 disabled:opacity-40">{busy ? 'Checking...' : 'Unlock admin panel'}</button><a href="/" className="mt-4 block text-center text-sm text-slate-400 hover:text-white">Return to public site</a></form></main>;

  const activePeople = people.filter((person) => !person.archivedAt);
  const archivedPeople = people.filter((person) => person.archivedAt);
  const setField = (key: keyof Person, value: string) => setForm((current) => ({ ...current, [key]: value }));

  return <main className="min-h-screen bg-[#060a13] px-4 py-7 text-slate-100 sm:px-6"><div className="mx-auto max-w-7xl"><header className="flex flex-wrap items-center justify-between gap-4"><div><div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-emerald-300"><ShieldCheck className="h-4 w-4" /> Secure admin session</div><h1 className="mt-2 text-3xl font-black text-white">Profile control room</h1><p className="mt-2 text-sm text-slate-400">Edit source-backed profiles, preserve organic votes, and archive carefully.</p></div><div className="flex flex-wrap gap-2"><button onClick={() => void backup()} className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-200"><DatabaseBackup className="h-4 w-4" /> Backup</button><button onClick={() => void apiFetch(apiUrl('/api/admin/logout'), { method: 'POST', credentials: 'include' }).then(() => window.location.href = '/')} className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300">Sign out</button></div></header>{message && <div className="mt-5 flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-3 text-xs font-bold text-emerald-200"><CheckCircle className="h-4 w-4" />{message}</div>}

      <div className="mt-7 grid gap-6 lg:grid-cols-[380px_1fr]"><form onSubmit={(event) => void savePerson(event)} className="h-fit rounded-3xl border border-slate-800 bg-[#0b1221] p-5"><div className="flex items-center justify-between"><h2 className="text-lg font-black text-white">{editingId ? 'Edit profile' : 'Add profile'}</h2>{editingId && <button type="button" onClick={() => { setEditingId(''); setForm(emptyForm); }} className="text-slate-500 hover:text-white"><X className="h-4 w-4" /></button>}</div><div className="mt-4 space-y-3">{([['name', 'Full name'], ['shortBio', 'Short bio'], ['avatar', 'Real image HTTPS URL'], ['profileUrl', 'Public source URL'], ['researchUrl', 'Research URL']] as Array<[keyof Person, string]>).map(([key, label]) => <label key={String(key)} className="block text-xs font-bold text-slate-400">{label}<input required={key === 'name' || key === 'avatar'} value={String(form[key] || '')} onChange={(event) => setField(key, event.target.value)} className="mt-1 w-full rounded-xl border border-slate-800 bg-[#060b17] px-3 py-2.5 text-sm text-white outline-none focus:border-sky-500" /></label>)}<label className="block text-xs font-bold text-slate-400">Detailed bio<textarea value={String(form.bio || '')} onChange={(event) => setField('bio', event.target.value)} className="mt-1 min-h-28 w-full rounded-xl border border-slate-800 bg-[#060b17] px-3 py-2.5 text-sm text-white outline-none focus:border-sky-500" /></label><div className="grid grid-cols-2 gap-2"><label className="text-xs font-bold text-slate-400">Category<select value={form.category || 'Public Figure'} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as PersonCategory }))} className="mt-1 w-full rounded-xl border border-slate-800 bg-[#060b17] px-2 py-2.5 text-sm text-white">{categories.map((item) => <option key={item}>{item}</option>)}</select></label><label className="text-xs font-bold text-slate-400">Country<select value={form.country || 'Global'} onChange={(event) => setForm((current) => ({ ...current, country: event.target.value as PersonCountry }))} className="mt-1 w-full rounded-xl border border-slate-800 bg-[#060b17] px-2 py-2.5 text-sm text-white">{countries.map((item) => <option key={item}>{item}</option>)}</select></label></div></div><button disabled={busy} className="mt-5 w-full rounded-xl bg-sky-400 px-4 py-3 text-sm font-black text-slate-950 disabled:opacity-50">{busy ? 'Saving...' : editingId ? 'Save changes' : 'Add profile'}</button></form>

        <section className="rounded-3xl border border-slate-800 bg-[#0b1221] p-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><div className="text-xs font-black uppercase tracking-[0.18em] text-sky-300">Directory data</div><h2 className="mt-2 text-xl font-black text-white">{activePeople.length} active profiles</h2></div><div className="text-xs text-slate-500">Archived: {archivedPeople.length}</div></div><div className="mt-5 space-y-2">{people.map((person) => <div key={person.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-[#060b17] p-3"><div className="min-w-0"><div className="truncate font-black text-white">{person.name}</div><div className="mt-1 text-xs text-slate-500">{person.category} · {person.country} · {person.votes.toLocaleString()} organic votes · updated {formatDate(person.updatedAt)}</div></div><div className="flex shrink-0 gap-2">{person.archivedAt ? <button type="button" onClick={() => void restore(person)} className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 px-2.5 py-2 text-xs font-bold text-emerald-200"><RotateCcw className="h-3.5 w-3.5" /> Restore</button> : <button type="button" onClick={() => { setEditingId(person.id); setForm(person); }} className="rounded-lg border border-sky-500/30 px-2.5 py-2 text-xs font-bold text-sky-200">Edit</button>} {!person.archivedAt && <button type="button" onClick={() => void archive(person)} className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 px-2.5 py-2 text-xs font-bold text-rose-200"><Archive className="h-3.5 w-3.5" /> Archive</button>}</div></div>)}</div></section>
      </div>
    </div></main>;
};

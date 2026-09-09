import React, { useEffect, useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, CircleDollarSign, ExternalLink, ShieldCheck } from 'lucide-react';
import { MATCH_REQUEST_PLANS } from '../data/matchPricing';
import { MatchRequest, Region, UserProfile } from '../types';

interface MatchRequestViewProps {
  user: UserProfile | null;
  onOpenAuth: () => void;
}

interface CreatorDraft {
  name: string;
  profileUrl: string;
  region: Region;
}

interface RequestConfig {
  paymentAccountLabel: string;
  paymentInstructions: string;
}

function defaultStartTime() {
  const value = new Date(Date.now() + 1000 * 60 * 60 * 48);
  value.setMinutes(0, 0, 0);
  const offset = value.getTimezoneOffset() * 60 * 1000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 16);
}

export const MatchRequestView: React.FC<MatchRequestViewProps> = ({ user, onOpenAuth }) => {
  const [creator1, setCreator1] = useState<CreatorDraft>({ name: '', profileUrl: '', region: 'Pakistan' });
  const [creator2, setCreator2] = useState<CreatorDraft>({ name: '', profileUrl: '', region: 'Pakistan' });
  const [durationHours, setDurationHours] = useState(MATCH_REQUEST_PLANS[0].durationHours);
  const [startTime, setStartTime] = useState(defaultStartTime);
  const [ownershipNote, setOwnershipNote] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [description, setDescription] = useState('');
  const [config, setConfig] = useState<RequestConfig>({
    paymentAccountLabel: 'Payment details will be shown by the admin.',
    paymentInstructions: 'Submit payment through the approved account and enter the transaction reference below.',
  });
  const [requests, setRequests] = useState<MatchRequest[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/match-request-config')
      .then((response) => response.json())
      .then((data) => setConfig(data))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!user) return;
    fetch('/api/match-requests', { credentials: 'include' })
      .then((response) => response.ok ? response.json() : { requests: [] })
      .then((data) => setRequests(data.requests || []))
      .catch(() => undefined);
  }, [user]);

  const selectedPlan = useMemo(
    () => MATCH_REQUEST_PLANS.find((plan) => plan.durationHours === durationHours) || MATCH_REQUEST_PLANS[0],
    [durationHours],
  );
  const endPreview = useMemo(() => {
    const start = new Date(startTime).getTime();
    if (!Number.isFinite(start)) return 'Choose a valid start time.';
    return new Date(start + selectedPlan.durationHours * 60 * 60 * 1000).toLocaleString();
  }, [selectedPlan.durationHours, startTime]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/match-requests', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creator1,
          creator2,
          durationHours,
          startTime,
          ownershipNote,
          paymentReference,
          description,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'The request could not be submitted.');
      setRequests((current) => [data.request, ...current]);
      setMessage('Request received. An admin will verify ownership and payment before publishing it.');
      setPaymentReference('');
      setOwnershipNote('');
      setDescription('');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'The request could not be submitted.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-3 py-8 sm:px-6">
      <div className="mb-6 rounded-3xl border border-sky-500/25 bg-gradient-to-br from-[#0b1831] to-[#0b101e] p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-300">Creator Match Requests</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">اپنا official match لگوائیں</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">اپنے دونوں social accounts کی public profile URLs، ownership proof اور payment reference دیں۔ Admin verification کے بعد match مقررہ وقت پر publish ہوگا۔</p>
          </div>
          <ShieldCheck className="h-10 w-10 text-emerald-300" />
        </div>
      </div>

      {!user && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/35 bg-amber-950/25 p-4 text-sm text-amber-100">
          <span>Request submit کرنے کے لیے secure account بنائیں یا sign in کریں۔</span>
          <button onClick={onOpenAuth} className="rounded-xl bg-amber-500 px-4 py-2 font-bold text-slate-950">Create account</button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <form onSubmit={submit} className="space-y-5 rounded-3xl border border-slate-800 bg-[#09101f] p-5 sm:p-7">
          <div className="grid gap-4 sm:grid-cols-2">
            {[{ draft: creator1, setDraft: setCreator1, label: 'Creator 1', color: 'sky' }, { draft: creator2, setDraft: setCreator2, label: 'Creator 2', color: 'orange' }].map(({ draft, setDraft, label, color }) => (
              <div key={label} className={`rounded-2xl border ${color === 'sky' ? 'border-sky-500/25' : 'border-orange-500/25'} bg-[#060b16] p-4`}>
                <h2 className={`mb-3 text-sm font-black ${color === 'sky' ? 'text-sky-300' : 'text-orange-300'}`}>{label}</h2>
                <input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Creator name" className="mb-2 w-full rounded-xl border border-slate-700 bg-[#0a1324] px-3 py-2.5 text-sm text-white outline-none focus:border-sky-400" />
                <input required type="url" value={draft.profileUrl} onChange={(event) => setDraft({ ...draft, profileUrl: event.target.value })} placeholder="https://youtube.com/@handle" className="w-full rounded-xl border border-slate-700 bg-[#0a1324] px-3 py-2.5 text-xs text-white outline-none focus:border-sky-400" />
                <select value={draft.region} onChange={(event) => setDraft({ ...draft, region: event.target.value as Region })} className="mt-2 w-full rounded-xl border border-slate-700 bg-[#0a1324] px-3 py-2.5 text-xs text-white outline-none focus:border-sky-400">
                  {['Pakistan', 'India', 'USA', 'Global'].map((region) => <option key={region}>{region}</option>)}
                </select>
                <a href={draft.profileUrl || '#'} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-sky-300"><ExternalLink className="h-3 w-3" /> Public profile will be checked</a>
              </div>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-300">Duration
              <select value={durationHours} onChange={(event) => setDurationHours(Number(event.target.value))} className="mt-2 w-full rounded-xl border border-slate-700 bg-[#060b16] px-3 py-3 text-sm text-white outline-none focus:border-sky-400">
                {MATCH_REQUEST_PLANS.map((plan) => <option key={plan.durationHours} value={plan.durationHours}>{plan.label} - PKR {plan.amountPkr.toLocaleString()}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-300">Start time (minimum 24 hours ahead)
              <input required type="datetime-local" min={defaultStartTime()} value={startTime} onChange={(event) => setStartTime(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-[#060b16] px-3 py-3 text-sm text-white outline-none focus:border-sky-400" />
            </label>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-[#060b16] p-3 text-xs text-slate-300"><CalendarClock className="h-4 w-4 text-sky-300" /> Expected end: <strong className="text-white">{endPreview}</strong></div>

          <label className="block text-xs font-semibold text-slate-300">Ownership proof plan
            <textarea required minLength={20} value={ownershipNote} onChange={(event) => setOwnershipNote(event.target.value)} placeholder="مثال: دونوں channels میرے ہیں؛ میں public bio میں دی گئی verification phrase رکھوں گا، یا admin کو ownership proof دوں گا۔" className="mt-2 min-h-24 w-full rounded-xl border border-slate-700 bg-[#060b16] px-3 py-3 text-sm text-white outline-none focus:border-sky-400" />
          </label>
          <label className="block text-xs font-semibold text-slate-300">Match description (optional)
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="یہ matchup کس موضوع یا audience کے لیے ہے؟" className="mt-2 min-h-20 w-full rounded-xl border border-slate-700 bg-[#060b16] px-3 py-3 text-sm text-white outline-none focus:border-sky-400" />
          </label>
          <label className="block text-xs font-semibold text-slate-300">Payment transaction reference
            <input required minLength={4} value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} placeholder="Transaction ID / reference" className="mt-2 w-full rounded-xl border border-slate-700 bg-[#060b16] px-3 py-3 text-sm text-white outline-none focus:border-sky-400" />
          </label>

          {error && <p className="rounded-xl border border-rose-500/35 bg-rose-950/30 p-3 text-xs text-rose-200">{error}</p>}
          {message && <p className="rounded-xl border border-emerald-500/35 bg-emerald-950/30 p-3 text-xs text-emerald-200">{message}</p>}
          <button disabled={submitting} className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-3 font-black text-white shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">{submitting ? 'Submitting request...' : 'Submit for admin review'}</button>
        </form>

        <aside className="space-y-5">
          <div className="rounded-3xl border border-emerald-500/25 bg-emerald-950/15 p-5">
            <div className="flex items-center gap-2 text-emerald-300"><CircleDollarSign className="h-5 w-5" /><h2 className="font-black">Payment before publishing</h2></div>
            <p className="mt-3 text-sm font-bold text-white">{config.paymentAccountLabel}</p>
            <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-300">{config.paymentInstructions}</p>
            <p className="mt-3 text-[11px] text-emerald-200/80">Payment is manually verified. No match is published automatically.</p>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-[#09101f] p-5">
            <h2 className="font-black text-white">Your requests</h2>
            <div className="mt-3 space-y-2">
              {!user && <p className="text-xs text-slate-500">Sign in to see request history.</p>}
              {user && requests.length === 0 && <p className="text-xs text-slate-500">No requests submitted yet.</p>}
              {requests.map((request) => <div key={request.id} className="rounded-xl border border-slate-800 bg-[#060b16] p-3 text-xs"><div className="flex justify-between gap-2"><strong className="text-slate-200">{request.creator1.name} vs {request.creator2.name}</strong><span className={request.status === 'approved' ? 'text-emerald-300' : request.status === 'rejected' ? 'text-rose-300' : 'text-amber-300'}>{request.status}</span></div><p className="mt-1 text-slate-500">PKR {request.paymentAmountPkr.toLocaleString()} · {request.paymentStatus}</p></div>)}
            </div>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-[#09101f] p-5 text-xs leading-5 text-slate-400"><strong className="text-white">Important:</strong> صرف وہی profiles submit کریں جن کی ownership آپ ثابت کر سکتے ہیں۔ Admin public links، verification proof اور payment reference دیکھ کر 24 گھنٹے کے اندر فیصلہ کرے گا۔</div>
        </aside>
      </div>
    </div>
  );
};

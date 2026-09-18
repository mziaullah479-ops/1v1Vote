import React, { useEffect, useState } from 'react';
import { CheckCircle2, CircleDollarSign, ExternalLink, Megaphone, ShieldCheck } from 'lucide-react';
import { PROMOTION_PLANS } from '../data/matchPricing';
import { Person } from '../types';
import { apiUrl } from '../services/api';

interface PromotionConfig {
  paymentAccountLabel: string;
  paymentInstructions: string;
}

export const PromoteProfileView: React.FC = () => {
  const [people, setPeople] = useState<Person[]>([]);
  const [config, setConfig] = useState<PromotionConfig>({
    paymentAccountLabel: 'Payment details will be shown by the admin.',
    paymentInstructions: 'Submit payment through the approved account and enter the transaction reference below.',
  });
  const [personId, setPersonId] = useState('');
  const [requesterName, setRequesterName] = useState('');
  const [requesterEmail, setRequesterEmail] = useState('');
  const [durationHours, setDurationHours] = useState(PROMOTION_PLANS[0].durationHours);
  const [paymentReference, setPaymentReference] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
       fetch(apiUrl('/api/people'), { cache: 'default' }).then((response) => response.json()),
       fetch(apiUrl('/api/promotion-config')).then((response) => response.json()),
    ]).then(([peopleData, configData]) => {
      setPeople(peopleData.people || []);
      setConfig(configData);
    }).catch(() => setError('The promotion service is temporarily unavailable.'));
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
       const response = await fetch(apiUrl('/api/promotion-requests'), {
         method: 'POST',
         credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personId, requesterName, requesterEmail, durationHours, paymentReference, reason, label: 'Sponsored profile' }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'The promotion request could not be submitted.');
      setMessage('Request received. An admin will verify payment and publish the labeled promotion after review.');
      setPaymentReference('');
      setReason('');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'The promotion request could not be submitted.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#060a13] px-4 py-8 text-slate-100 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <a href="/" className="text-xs font-bold text-sky-300 hover:text-white">Back to live rankings</a>
        <section className="mt-5 rounded-[2rem] border border-amber-400/25 bg-gradient-to-br from-[#261b0d] via-[#111525] to-[#0a0e19] p-6 shadow-2xl sm:p-10">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-amber-300"><Megaphone className="h-4 w-4" /> Paid promotion</div>
              <h1 className="mt-4 max-w-3xl text-3xl font-black tracking-tight text-white sm:text-5xl">Put a public profile in the spotlight.</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">Promote an active 1v1Vote profile for a fixed period. Sponsored placement is clearly labeled, reviewed by an admin, and never changes organic votes or ranking totals.</p>
            </div>
            <ShieldCheck className="h-12 w-12 text-emerald-300" />
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
          <form onSubmit={submit} className="rounded-3xl border border-slate-800 bg-[#0b1221] p-5 sm:p-7">
            <h2 className="text-xl font-black text-white">Request a sponsored placement</h2>
            <p className="mt-2 text-xs leading-5 text-slate-500">No account is required. Use a real email so the admin can confirm the request.</p>
            <div className="mt-5 space-y-4">
              <label className="block text-xs font-bold text-slate-300">Profile to promote
                <select required value={personId} onChange={(event) => setPersonId(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-[#060b17] px-3 py-3 text-sm text-white outline-none focus:border-amber-400">
                  <option value="">Choose an active profile</option>
                  {people.map((person) => <option key={person.id} value={person.id}>{person.name} · {person.country}</option>)}
                </select>
              </label>
              {personId && <a href={`/people/${encodeURIComponent(people.find((person) => person.id === personId)?.slug || '')}`} className="inline-flex items-center gap-1 text-xs text-sky-300 hover:text-white"><ExternalLink className="h-3.5 w-3.5" /> Preview public profile</a>}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-bold text-slate-300">Your name<input required value={requesterName} onChange={(event) => setRequesterName(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-[#060b17] px-3 py-3 text-sm text-white outline-none focus:border-amber-400" /></label>
                <label className="block text-xs font-bold text-slate-300">Email for confirmation<input required type="email" value={requesterEmail} onChange={(event) => setRequesterEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-[#060b17] px-3 py-3 text-sm text-white outline-none focus:border-amber-400" /></label>
              </div>
              <label className="block text-xs font-bold text-slate-300">Promotion duration
                <select value={durationHours} onChange={(event) => setDurationHours(Number(event.target.value))} className="mt-2 w-full rounded-xl border border-slate-700 bg-[#060b17] px-3 py-3 text-sm text-white outline-none focus:border-amber-400">
                  {PROMOTION_PLANS.map((plan) => <option key={plan.durationHours} value={plan.durationHours}>{plan.label} · PKR {plan.amountPkr.toLocaleString()}</option>)}
                </select>
              </label>
              <label className="block text-xs font-bold text-slate-300">Payment transaction reference<input required minLength={4} value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} placeholder="Transaction ID / reference" className="mt-2 w-full rounded-xl border border-slate-700 bg-[#060b17] px-3 py-3 text-sm text-white outline-none focus:border-amber-400" /></label>
              <label className="block text-xs font-bold text-slate-300">Promotion note (optional)<textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="What should the admin know about this placement?" className="mt-2 min-h-24 w-full rounded-xl border border-slate-700 bg-[#060b17] px-3 py-3 text-sm text-white outline-none focus:border-amber-400" /></label>
            </div>
            {error && <p className="mt-4 rounded-xl border border-rose-500/35 bg-rose-950/30 p-3 text-xs text-rose-200">{error}</p>}
            {message && <p className="mt-4 flex gap-2 rounded-xl border border-emerald-500/35 bg-emerald-950/30 p-3 text-xs text-emerald-200"><CheckCircle2 className="h-4 w-4 shrink-0" />{message}</p>}
            <button disabled={submitting || !people.length} className="mt-5 w-full rounded-xl bg-amber-400 px-4 py-3 font-black text-slate-950 transition hover:bg-amber-300 disabled:opacity-50">{submitting ? 'Submitting request...' : 'Submit promotion request'}</button>
          </form>

          <aside className="space-y-5">
            <div className="rounded-3xl border border-emerald-500/25 bg-emerald-950/15 p-5 sm:p-6"><div className="flex items-center gap-2 text-emerald-300"><CircleDollarSign className="h-5 w-5" /><h2 className="font-black">Payment and review</h2></div><p className="mt-3 text-sm font-bold text-white">{config.paymentAccountLabel}</p><p className="mt-2 whitespace-pre-wrap text-xs leading-6 text-slate-300">{config.paymentInstructions}</p><p className="mt-3 text-[11px] leading-5 text-emerald-200/80">Payment is manually verified. Approval creates a time-limited Sponsored profile label only.</p></div>
            <div className="rounded-3xl border border-slate-800 bg-[#0b1221] p-5 sm:p-6"><h2 className="font-black text-white">What promotion does</h2><ul className="mt-4 space-y-3 text-xs leading-5 text-slate-400"><li>Places the selected active profile in a featured surface.</li><li>Shows a clear sponsored label and expiry window.</li><li>Leaves votes, shares, and organic rank untouched.</li><li>Requires admin review before publication.</li></ul></div>
          </aside>
        </div>
      </div>
    </main>
  );
};

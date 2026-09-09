import React, { useEffect, useState } from 'react';
import { LockKeyhole, LogOut, ShieldCheck } from 'lucide-react';
import { Match, MatchRequest } from '../types';
import { AdminPanel } from './AdminPanel';

interface AdminGateProps {
  matches: Match[];
  onAddMatch: (matchData: Partial<Match>) => void;
  onEndMatch: (matchId: string, winnerId?: string) => void;
  onBackup: () => Promise<void>;
  onExit: () => void;
}

export const AdminGate: React.FC<AdminGateProps> = ({ matches, onAddMatch, onEndMatch, onBackup, onExit }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);
  const [matchRequests, setMatchRequests] = useState<MatchRequest[]>([]);

  useEffect(() => {
    fetch('/api/admin/session', { credentials: 'include' })
      .then((response) => response.json())
      .then((data) => {
        setAuthenticated(Boolean(data.authenticated));
        setConfigured(data.configured !== false);
      })
      .catch(() => setError('Admin service is unavailable on this deployment.'))
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    fetch('/api/admin/match-requests', { credentials: 'include' })
      .then((response) => response.ok ? response.json() : { requests: [] })
      .then((data) => setMatchRequests(data.requests || []))
      .catch(() => undefined);
  }, [authenticated]);

  const reviewMatchRequest = async (requestId: string, decision: 'approve' | 'reject', adminNote: string) => {
    const response = await fetch(`/api/admin/match-requests/${encodeURIComponent(requestId)}/review`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, adminNote }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Unable to review this request.');
    setMatchRequests((current) => current.map((request) => request.id === requestId ? data.result.request : request));
  };

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data.error || 'Unable to sign in.');
      return;
    }
    setPassword('');
    setAuthenticated(true);
  };

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' }).catch(() => undefined);
    onExit();
  };

  if (checking) {
    return <div className="min-h-[60vh] flex items-center justify-center text-slate-400">Checking secure admin session...</div>;
  }

  if (!authenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <form onSubmit={login} className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#09101f] p-7 shadow-2xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-500/10 text-amber-300">
            <LockKeyhole className="h-7 w-7" />
          </div>
          <h1 className="text-center text-2xl font-black text-white">Private admin access</h1>
          <p className="mt-2 text-center text-sm text-slate-400">This area is not linked from the public site.</p>
          {!configured && <p className="mt-5 rounded-xl border border-rose-500/40 bg-rose-950/30 p-3 text-xs text-rose-300">Set ADMIN_PASSWORD on the server before signing in.</p>}
          {error && <p className="mt-5 rounded-xl border border-rose-500/40 bg-rose-950/30 p-3 text-xs text-rose-300">{error}</p>}
          <input
            autoFocus
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Admin password"
            className="mt-5 w-full rounded-xl border border-slate-700 bg-[#060b17] px-4 py-3 text-white outline-none focus:border-amber-400"
            disabled={!configured}
          />
          <button type="submit" disabled={!configured || !password} className="mt-4 w-full rounded-xl bg-amber-600 py-3 font-bold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-40">Unlock admin panel</button>
          <button type="button" onClick={onExit} className="mt-3 w-full py-2 text-sm text-slate-400 hover:text-white">Return to public site</button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 pt-5 text-xs text-slate-400">
        <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-400" />Secure admin session</span>
        <button onClick={logout} className="flex items-center gap-1.5 hover:text-white"><LogOut className="h-3.5 w-3.5" />Sign out</button>
      </div>
      <AdminPanel matches={matches} matchRequests={matchRequests} onReviewMatchRequest={reviewMatchRequest} onAddMatch={onAddMatch} onEndMatch={onEndMatch} onBackup={onBackup} />
    </div>
  );
};

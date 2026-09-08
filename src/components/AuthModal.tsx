import React, { useState } from 'react';
import { X, UserCheck, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (name: string, email: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onLogin(name, email || `${name.toLowerCase()}@vsbattle.app`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-md bg-[#09101f] border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-bold text-white tracking-tight">
            Create Free Account
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Save your voting streaks, appear on the voter leaderboard, and unlock creator badges!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">
              Display Name or Fan Handle *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. DuckySquadPK or JimmyLoyalist"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#060b17] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">
              Email Address (optional)
            </label>
            <input
              type="email"
              placeholder="fan@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#060b17] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-800/60 text-[11px] text-sky-300">
            Note: Voting is always 100% free and does not require an account. Logging in just saves your personal history!
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all flex items-center justify-center gap-2"
          >
            <UserCheck className="w-4 h-4" />
            Continue & Link Voting History
          </button>
        </form>
      </div>
    </div>
  );
};

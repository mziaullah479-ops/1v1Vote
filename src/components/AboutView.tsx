import React from 'react';
import { ShieldCheck, LineChart, Users, Zap, CheckCircle2 } from 'lucide-react';

export const AboutView: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto my-10 px-4 animate-fade-in">
      <div className="bg-[#070e1c] rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs uppercase font-extrabold tracking-widest text-sky-400 bg-sky-950/60 px-3 py-1 rounded-full border border-sky-800/60">
            About 1v1Vote
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white mt-3 tracking-tight">
            The Stadium for Online Influencer Clashes
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Combining the real-time energy of stock trading charts with the passion of sports fan rivalries.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
          <div className="p-5 rounded-2xl bg-[#091224] border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center mb-3">
              <LineChart className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">Stock Trading-Style Graphs</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every vote instantly shifts the dynamic curve. Watch momentum swings in real-time as creators rally their fanbases across Pakistan, India, USA, and globally.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#091224] border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">Fair Vote Fraud Prevention</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Strict one-vote-per-device-per-match protocol using browser fingerprinting, cookie tracking, and IP rate-limiting. No bot armies or spam voting allowed.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#091224] border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">Fixed 2–3 Day Windows</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Battles run within strict official countdown timers. Once the clock hits zero, the victor is crowned in the permanent Hall of Fame.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#091224] border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">Zero Friction Voting</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              No registration or phone number required to vote. Just tap your favorite creator and your voice is counted. Optional free accounts let you track your ranking.
            </p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/40 to-slate-900 border border-blue-800/40 text-xs text-slate-300">
          <h4 className="font-bold text-white text-sm mb-1 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Community & Content Disclaimer
          </h4>
          <p className="text-slate-400 leading-relaxed">
            1v1Vote is an independent fan voting platform created for entertainment, social dialogue, and community appreciation. All creator names, channel handles, and logos belong to their respective copyright holders.
          </p>
        </div>
      </div>
    </div>
  );
};

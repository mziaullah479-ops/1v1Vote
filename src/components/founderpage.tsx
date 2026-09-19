import React, { useEffect } from 'react';
import { ArrowLeft, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';
import { setPageSeo } from '../seo';

export const AboutMePage: React.FC = () => {
  useEffect(() => {
    setPageSeo(
      'About Muhammad Ziaullah | 1v1Vote',
      'Learn about Muhammad Ziaullah, an independent developer and entrepreneur building practical, user-first digital products including 1v1Vote.',
      '/about-me',
      '/muhammad-ziaullah.png',
    );
  }, []);

  return <main className="seo-shell min-h-screen px-4 py-8 text-slate-100 sm:px-6 sm:py-14">
    <div className="mx-auto max-w-4xl">
      <a href="/" className="inline-flex items-center gap-2 text-xs font-bold text-sky-300 hover:text-white"><ArrowLeft className="h-4 w-4" /> Back to live rankings</a>
       <section className="seo-hero mt-8 rounded-[2rem] border border-sky-500/20 bg-gradient-to-br from-[#0d1b36] via-[#0b1730] to-[#0a0e19] p-6 shadow-2xl sm:p-10">
         <div className="grid items-center gap-8 sm:grid-cols-[180px_1fr]">
           <img src="/muhammad-ziaullah.png" alt="Muhammad Ziaullah" width="170" height="210" className="h-52 w-40 rounded-[1.75rem] border border-sky-400/40 object-cover object-top shadow-xl" />
           <div>
             <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-sky-300"><Sparkles className="h-4 w-4" /> About me</div>
             <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">Muhammad Ziaullah</h1>
             <p className="mt-3 text-lg font-bold text-sky-200">Independent developer, entrepreneur, and product builder</p>
             <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">I build practical, user-first web and mobile platforms that solve real problems and stay simple to use.</p>
           </div>
         </div>
       </section>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
        <article className="seo-article rounded-3xl border border-slate-800 bg-[#0b1221] p-6 sm:p-8">
           <h2 className="text-xl font-black text-white">What I build</h2>
          <p className="mt-4 text-sm leading-8 text-slate-300">I am an independent developer and entrepreneur building practical, user-first web and mobile platforms. I work across a range of projects — from public engagement tools like 1v1Vote, to automation systems and niche community apps — always with a focus on solving real problems rather than building for the sake of it.</p>
          <p className="mt-5 text-sm leading-8 text-slate-300">I handle the strategy, planning, and product direction myself, while working closely with AI-assisted development tools to bring ideas to life quickly and efficiently. My goal with every project is simple: build something genuinely useful, keep it lightweight, and grow it sustainably.</p>
          <div className="mt-6 flex flex-wrap gap-3"><a href="/about" className="inline-flex items-center gap-2 rounded-xl bg-sky-400 px-4 py-3 text-sm font-black text-slate-950 hover:bg-sky-300">Read about 1v1Vote</a><a href="/contact" className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm font-black text-white hover:border-sky-400">Contact for corrections <ExternalLink className="h-4 w-4" /></a></div>
        </article>
        <aside className="rounded-3xl border border-slate-800 bg-[#0b1221] p-6">
           <div className="flex items-center gap-2 text-sm font-black text-white"><ShieldCheck className="h-4 w-4 text-emerald-300" /> How I work</div>
          <ul className="mt-5 space-y-4 text-sm leading-6 text-slate-400">
            <li>Keep profiles source-backed and understandable.</li>
            <li>Keep organic votes separate from paid influence.</li>
            <li>Correct, archive, or restore profiles without destroying history.</li>
            <li>Grow through useful content and real visitor interest, not artificial traffic.</li>
          </ul>
        </aside>
      </div>
       <p className="mt-6 text-center text-xs leading-6 text-slate-500">I maintain the public directory and editorial standards. Profile corrections and source suggestions are reviewed through the contact route.</p>
    </div>
  </main>;
};

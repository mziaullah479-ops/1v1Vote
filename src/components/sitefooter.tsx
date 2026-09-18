import React from 'react';
import { ArrowUpRight, Radio, ShieldCheck } from 'lucide-react';

const footerGroups = [
  {
    title: 'Explore',
    links: [
      ['/about', 'About'], ['/how-it-works', 'How it works'], ['/rankings', 'Live rankings'], ['/people', 'People directory'], ['/vote', 'Vote'],
       ['/discover', 'Discover'], ['/profiles', 'Profiles'], ['/sources', 'Sources'], ['/categories', 'Categories'], ['/country-rankings', 'Country rankings'],
    ],
  },
  {
    title: 'Regions',
    links: [
      ['/pakistan', 'Pakistan'], ['/india', 'India'], ['/usa', 'USA'], ['/global', 'Global'], ['/pakistani-leaders', 'Pakistani leaders'],
      ['/pakistani-scholars', 'Pakistani scholars'], ['/international-stars', 'International stars'], ['/leaders', 'Leaders'], ['/public-figures', 'Public figures'],
    ],
  },
  {
    title: 'Categories',
    links: [
      ['/politics', 'Politics'], ['/religious-scholars', 'Religious scholars'], ['/sports', 'Sports'], ['/athletes', 'Athletes'], ['/entertainment', 'Entertainment'],
      ['/actors', 'Actors'], ['/business', 'Business'], ['/entrepreneurs', 'Entrepreneurs'], ['/scholars', 'Scholars'], ['/daily-vote', 'Daily vote'],
    ],
  },
  {
    title: 'Help & policies',
    links: [
       ['/faq', 'FAQ'], ['/vote-guide', 'Voting guide'], ['/founder', 'Founder'], ['/request', 'Profile request'], ['/profile-corrections', 'Profile corrections'], ['/contact', 'Contact'],
      ['/editorial-policy', 'Editorial policy'], ['/data-safety', 'Data safety'], ['/privacy', 'Privacy'], ['/terms', 'Terms'], ['/site-map', 'Site map'],
    ],
  },
  {
    title: 'Featured profiles',
    links: [
      ['/people/maulana-fazlur-rehman', 'Maulana Fazlur Rehman'], ['/people/imran-khan', 'Imran Khan'], ['/people/elon-musk', 'Elon Musk'], ['/people/cristiano-ronaldo', 'Cristiano Ronaldo'],
    ],
  },
] as const;

export const SiteFooter: React.FC = () => (
  <footer className="site-footer border-t border-slate-800/80 bg-[#070b15] px-4 pb-8 pt-10 text-slate-400 sm:px-6">
    <div className="mx-auto max-w-7xl">
      <div className="mb-10 grid gap-6 rounded-[1.75rem] border border-slate-800/80 bg-[#0b1221]/65 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
        <div className="flex items-start gap-3">
          <div className="brand-mark flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"><Radio className="relative z-10 h-5 w-5" /></div>
          <div>
            <div className="brand-wordmark text-lg font-black text-white">1v1Vote</div>
            <p className="mt-1 max-w-xl text-xs leading-5 text-slate-400">A public signal index for people who matter to the conversation — ranked by daily visitor support, not paid influence.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <a href="/how-it-works" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-2 text-[11px] font-black text-slate-300 transition hover:border-sky-400/60 hover:text-sky-200">How it works <ArrowUpRight className="h-3.5 w-3.5" /></a>
          <a href="/data-safety" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-2 text-[11px] font-black text-slate-300 transition hover:border-emerald-400/60 hover:text-emerald-200"><ShieldCheck className="h-3.5 w-3.5" /> Data safety</a>
        </div>
      </div>
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
        {footerGroups.map((group) => (
          <div key={group.title}>
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{group.title}</h2>
            <div className="mt-4 space-y-2.5">
              {group.links.map(([href, label]) => <a key={href} href={href} className="block text-xs leading-5 transition hover:text-sky-300">{label}</a>)}
            </div>
          </div>
        ))}
      </div>
       <div className="footer-rule mt-10 flex flex-col gap-2 border-t border-slate-800/80 pt-5 text-[11px] sm:flex-row sm:items-center sm:justify-between">
        <span className="font-black tracking-wide text-slate-300">1v1Vote</span>
         <span>Public opinion, ranked live. One vote per profile per calendar day.</span>
      </div>
    </div>
  </footer>
);

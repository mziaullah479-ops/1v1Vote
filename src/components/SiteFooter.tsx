import React from 'react';

const footerGroups = [
  {
    title: 'Explore',
    links: [
      ['/about', 'About'], ['/how-it-works', 'How it works'], ['/rankings', 'Live rankings'], ['/people', 'People directory'], ['/vote', 'Vote'],
      ['/discover', 'Discover'], ['/profiles', 'Profiles'], ['/sources', 'Sources'], ['/categories', 'Categories'], ['/country-rankings', 'Country rankings'],
      ['/promote', 'Promote a profile'], ['/ai', 'AI guide'],
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
      ['/faq', 'FAQ'], ['/vote-guide', 'Voting guide'], ['/request', 'Profile request'], ['/profile-corrections', 'Profile corrections'], ['/contact', 'Contact'],
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
  <footer className="border-t border-slate-800/80 bg-[#070b15] px-4 pb-8 pt-10 text-slate-400 sm:px-6">
    <div className="mx-auto max-w-7xl">
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
      <div className="mt-10 flex flex-col gap-2 border-t border-slate-800/80 pt-5 text-[11px] sm:flex-row sm:items-center sm:justify-between">
        <span className="font-black tracking-wide text-slate-300">1v1Vote</span>
        <span>Public opinion, ranked live. One vote per profile every 24 hours.</span>
      </div>
    </div>
  </footer>
);

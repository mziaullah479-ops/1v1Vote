import React, { useEffect } from 'react';
import { PeopleDashboard } from './components/peopledashboard';
import { AdminControlRoom } from './components/admincontrolroom';
import { PersonProfilePage } from './components/personprofilepage';
import { SeoContentPage, SEO_PAGES } from './components/seocontentpage';
import { setPageSeo } from './seo';
import { SiteFooter } from './components/sitefooter';
import { ThemeToggle } from './components/ThemeToggle';
import { AboutMePage } from './components/founderpage';

function NotFoundPage() {
  return <main className="flex min-h-screen items-center justify-center bg-[#060a13] px-5 py-16 text-center text-slate-100"><div className="max-w-lg"><p className="text-xs font-black uppercase tracking-[0.2em] text-sky-300">404 / page not found</p><h1 className="mt-4 text-4xl font-black text-white">That public page does not exist.</h1><p className="mt-4 text-sm leading-7 text-slate-400">Return to the live directory to browse source-backed profiles and current public rankings.</p><a href="/" className="mt-7 inline-flex rounded-xl bg-sky-300 px-5 py-3 text-sm font-black text-slate-950">Back to live rankings</a></div></main>;
}

const DIRECTORY_ROUTES: Record<string, { initialCategory?: 'All' | import('./types').PersonCategory; initialCountry?: 'All' | import('./types').PersonCountry; heading: string; intro: string }> = {
  '/rankings': { heading: 'Live public figure rankings', intro: 'See the current public-support order, open any profile, and vote once per calendar day.' },
  '/people': { heading: 'Browse the people directory', intro: 'Explore source-backed public figures from Pakistan, India, the USA, and around the world.' },
  '/vote': { heading: 'Cast today\'s public vote', intro: 'Choose a profile, read its source-backed summary, and add one organic vote for today.' },
  '/discover': { heading: 'Discover public figures', intro: 'Search by name, rank, country, or category and find a profile worth exploring.' },
  '/profiles': { heading: 'Explore public profiles', intro: 'Open detailed profile pages with biographies, sources, rankings, and daily voting.' },
  '/public-figures': { heading: 'Public figures directory', intro: 'Browse the complete active directory and use filters to narrow the live index.' },
  '/country-rankings': { heading: 'Country and region rankings', intro: 'Compare the public figures represented in each region of the live directory.' },
  '/pakistan': { initialCountry: 'Pakistan', heading: 'Pakistani public figures', intro: 'Explore Pakistani leaders, scholars, athletes, creators, and other public figures.' },
  '/india': { initialCountry: 'India', heading: 'Indian public figures', intro: 'Explore Indian political, sports, entertainment, and business profiles.' },
  '/usa': { initialCountry: 'USA', heading: 'American public figures', intro: 'Explore American leaders, athletes, entertainers, and business figures.' },
  '/global': { initialCountry: 'Global', heading: 'Global public figures', intro: 'Explore internationally recognized people represented in the public signal index.' },
  '/politics': { initialCategory: 'Politics', heading: 'Political leaders and public voices', intro: 'Browse political profiles and vote based on public interest, not paid placement.' },
  '/religious-scholars': { initialCategory: 'Religious Scholar', heading: 'Religious scholars', intro: 'Browse source-backed religious scholar profiles and their live public support.' },
  '/sports': { initialCategory: 'Sports', heading: 'Sports figures and athletes', intro: 'Explore athletes and sports personalities across the live public ranking.' },
  '/entertainment': { initialCategory: 'Entertainment', heading: 'Entertainment figures', intro: 'Explore actors, performers, and entertainment personalities with public profiles.' },
  '/business': { initialCategory: 'Business', heading: 'Business leaders', intro: 'Explore founders, executives, and business leaders in the public directory.' },
  '/leaders': { heading: 'Leaders and public voices', intro: 'Explore political, religious, business, and cultural leaders in one searchable index.' },
  '/scholars': { initialCategory: 'Religious Scholar', heading: 'Scholars directory', intro: 'Browse public scholar profiles with biographies, sources, and daily voting.' },
  '/athletes': { initialCategory: 'Sports', heading: 'Athletes directory', intro: 'Browse athlete profiles and see where public support is moving.' },
  '/actors': { initialCategory: 'Entertainment', heading: 'Actors and entertainers', intro: 'Browse source-backed actors and entertainers with direct voting pages.' },
  '/entrepreneurs': { initialCategory: 'Business', heading: 'Entrepreneurs directory', intro: 'Browse founders and business leaders with shareable public profiles.' },
  '/pakistani-leaders': { initialCountry: 'Pakistan', heading: 'Pakistani leaders', intro: 'Explore Pakistani political and public leaders in the live directory.' },
  '/pakistani-scholars': { initialCategory: 'Religious Scholar', initialCountry: 'Pakistan', heading: 'Pakistani scholars', intro: 'Explore Pakistani scholar profiles with sources, biographies, and daily voting.' },
  '/international-stars': { initialCountry: 'Global', heading: 'International public figures', intro: 'Explore globally recognized athletes, entertainers, and leaders.' },
};

export default function App() {
  const pathname = window.location.pathname.replace(/\/$/, '') || '/';
  const seoPage = SEO_PAGES[pathname];
  const directoryRoute = DIRECTORY_ROUTES[pathname];
  useEffect(() => {
    if (pathname === '/') setPageSeo('1v1Vote - Live Public Figure Rankings & Daily Voting', 'Vote for public figures, explore source-backed profiles, and see live rankings across Pakistan, India, the USA, and the world. Vote once per calendar day.', '/');
    else if (seoPage) setPageSeo(seoPage.title, seoPage.description, pathname);
  }, [pathname, seoPage]);
  let content: React.ReactNode = pathname === '/' ? <PeopleDashboard /> : <NotFoundPage />;
  if (pathname === '/admin') content = <AdminControlRoom />;
  else if (pathname === '/about-me') content = <><AboutMePage /><SiteFooter /></>;
  else if (directoryRoute && seoPage) content = <PeopleDashboard {...directoryRoute} pageTitle={seoPage.title} pageDescription={seoPage.description} />;
  else {
    const profileMatch = pathname.match(/^\/people\/([^/]+)$/);
    if (profileMatch) content = <><PersonProfilePage slug={decodeURIComponent(profileMatch[1])} /><SiteFooter /></>;
    else if (SEO_PAGES[pathname]) content = <><SeoContentPage page={SEO_PAGES[pathname]} /><SiteFooter /></>;
  }
  return <><ThemeToggle />{content}</>;
}

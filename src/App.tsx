import React, { useEffect } from 'react';
import { PeopleDashboard } from './components/PeopleDashboard';
import { PeopleAdminPanel } from './components/PeopleAdminPanel';
import { PersonProfilePage } from './components/PersonProfilePage';
import { SeoContentPage, SEO_PAGES } from './components/SeoContentPage';
import { setPageSeo } from './seo';
import { SiteFooter } from './components/SiteFooter';

export default function App() {
  const pathname = window.location.pathname.replace(/\/$/, '') || '/';
  useEffect(() => {
    if (pathname === '/') setPageSeo('1v1Vote - Public Figure Rankings & Daily Voting', 'Vote every 24 hours for public figures, leaders, scholars, athletes, artists, and entrepreneurs.', '/');
  }, [pathname]);
  if (pathname === '/admin') return <PeopleAdminPanel />;
  const profileMatch = pathname.match(/^\/people\/([^/]+)$/);
  if (profileMatch) return <><PersonProfilePage slug={decodeURIComponent(profileMatch[1])} /><SiteFooter /></>;
  if (SEO_PAGES[pathname]) return <><SeoContentPage page={SEO_PAGES[pathname]} /><SiteFooter /></>;
  return <PeopleDashboard />;
}

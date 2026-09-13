import React, { useEffect } from 'react';
import { PeopleDashboard } from './components/PeopleDashboard';
import { PeopleAdminPanel } from './components/PeopleAdminPanel';
import { PersonProfilePage } from './components/PersonProfilePage';
import { SeoContentPage, SEO_PAGES } from './components/SeoContentPage';
import { setPageSeo } from './seo';

export default function App() {
  const pathname = window.location.pathname.replace(/\/$/, '') || '/';
  useEffect(() => {
    if (pathname === '/') setPageSeo('1v1Vote - Vote. Rank. Win.', 'Vote once every 24 hours for important public figures, leaders, scholars, athletes, and entertainers.', '/');
  }, [pathname]);
  if (pathname === '/admin') return <PeopleAdminPanel />;
  const profileMatch = pathname.match(/^\/people\/([^/]+)$/);
  if (profileMatch) return <PersonProfilePage slug={decodeURIComponent(profileMatch[1])} />;
  if (SEO_PAGES[pathname]) return <SeoContentPage page={SEO_PAGES[pathname]} />;
  return <PeopleDashboard />;
}

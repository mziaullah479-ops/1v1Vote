import React, { useEffect } from 'react';
import { PeopleDashboard } from './components/PeopleDashboard';
import { PeopleAdminPanel } from './components/PeopleAdminPanel';
import { PersonProfilePage } from './components/PersonProfilePage';
import { SeoContentPage, SEO_PAGES } from './components/SeoContentPage';
import { setPageSeo } from './seo';
import { SiteFooter } from './components/SiteFooter';

export default function App() {
  const pathname = window.location.pathname.replace(/\/$/, '') || '/';
  const seoPage = SEO_PAGES[pathname];
  useEffect(() => {
    if (pathname === '/') setPageSeo('1v1Vote - Live Public Figure Rankings & Daily Voting', 'Vote for public figures, explore source-backed profiles, and see live rankings across Pakistan, India, the USA, and the world. Vote once every 24 hours.', '/');
    else if (seoPage) setPageSeo(seoPage.title, seoPage.description, pathname);
  }, [pathname, seoPage]);
  if (pathname === '/admin') return <PeopleAdminPanel />;
  const profileMatch = pathname.match(/^\/people\/([^/]+)$/);
  if (profileMatch) return <><PersonProfilePage slug={decodeURIComponent(profileMatch[1])} /><SiteFooter /></>;
  if (SEO_PAGES[pathname]) return <><SeoContentPage page={SEO_PAGES[pathname]} /><SiteFooter /></>;
  return <PeopleDashboard />;
}

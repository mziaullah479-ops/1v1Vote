import React, { useEffect } from 'react';
import { PeopleDashboard } from './components/PeopleDashboard';
import { AdminControlRoom } from './components/AdminControlRoom';
import { PersonProfilePage } from './components/PersonProfilePage';
import { SeoContentPage, SEO_PAGES } from './components/SeoContentPage';
import { setPageSeo } from './seo';
import { SiteFooter } from './components/SiteFooter';
import { ThemeToggle } from './components/ThemeToggle';
import { FounderPage } from './components/FounderPage';

export default function App() {
  const pathname = window.location.pathname.replace(/\/$/, '') || '/';
  const seoPage = SEO_PAGES[pathname];
  useEffect(() => {
    if (pathname === '/') setPageSeo('1v1Vote - Live Public Figure Rankings & Daily Voting', 'Vote for public figures, explore source-backed profiles, and see live rankings across Pakistan, India, the USA, and the world. Vote once per calendar day.', '/');
    else if (seoPage) setPageSeo(seoPage.title, seoPage.description, pathname);
  }, [pathname, seoPage]);
  let content: React.ReactNode = <PeopleDashboard />;
  if (pathname === '/admin') content = <AdminControlRoom />;
  else if (pathname === '/founder') content = <><FounderPage /><SiteFooter /></>;
  else {
    const profileMatch = pathname.match(/^\/people\/([^/]+)$/);
    if (profileMatch) content = <><PersonProfilePage slug={decodeURIComponent(profileMatch[1])} /><SiteFooter /></>;
    else if (SEO_PAGES[pathname]) content = <><SeoContentPage page={SEO_PAGES[pathname]} /><SiteFooter /></>;
  }
  return <><ThemeToggle />{content}</>;
}

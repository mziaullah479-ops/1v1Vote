import React, { useEffect } from 'react';
import { PeopleDashboard } from './components/peopledashboard';
import { AdminControlRoom } from './components/admincontrolroom';
import { PersonProfilePage } from './components/personprofilepage';
import { SeoContentPage, SEO_PAGES } from './components/seocontentpage';
import { setPageSeo } from './seo';
import { SiteFooter } from './components/sitefooter';
import { ThemeToggle } from './components/ThemeToggle';
import { FounderPage } from './components/founderpage';

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

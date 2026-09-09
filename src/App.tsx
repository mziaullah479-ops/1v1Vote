import React, { useState, useEffect, useCallback } from 'react';
import { MatchStore } from './data/store';
import { Match, Comment, UserProfile } from './types';
import { Navbar } from './components/Navbar';
import { MatchArena } from './components/MatchArena';
import { StockTradingChart } from './components/StockTradingChart';
import { VoteShareCards } from './components/VoteShareCards';
import { FeatureBar } from './components/FeatureBar';
import { CommentsSection } from './components/CommentsSection';
import { ActiveMatchesGrid } from './components/ActiveMatchesGrid';
import { PastMatches } from './components/PastMatches';
import { AdminGate } from './components/AdminGate';
import { ShareModal } from './components/ShareModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { AuthModal } from './components/AuthModal';
import { AboutView } from './components/AboutView';
import { Footer } from './components/Footer';
import { AdSensePlaceholder } from './components/AdSensePlaceholder';
import { HomeHero } from './components/HomeHero';
import { BattlePageHeader } from './components/BattlePageHeader';
import { MatchRequestView } from './components/MatchRequestView';

const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, '');

function getRoutePath() {
  const pathname = window.location.pathname;
  if (BASE_PATH && (pathname === BASE_PATH || pathname.startsWith(`${BASE_PATH}/`))) {
    return pathname.slice(BASE_PATH.length) || '/';
  }
  return pathname;
}

function getPublicPath(route: string) {
  if (!BASE_PATH) return route;
  return `${BASE_PATH}${route === '/' ? '/' : route}`;
}

function setMeta(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
}

function setCanonical(url: string) {
  let element = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!element) {
    element = document.createElement('link');
    element.rel = 'canonical';
    document.head.appendChild(element);
  }
  element.href = url;
}

export default function App() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [currentTab, setCurrentTab] = useState<'home' | 'battle' | 'battles' | 'leaderboard' | 'about' | 'request' | 'admin'>(
    getRoutePath() === '/admin' ? 'admin' : getRoutePath() === '/request' ? 'request' : 'home',
  );
  const [comments, setComments] = useState<Comment[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  
  // Modals
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLeaderboardModalOpen, setIsLeaderboardModalOpen] = useState(false);
  
  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync state from store
  const syncStoreData = useCallback(() => {
    const all = MatchStore.getMatches();
    setMatches([...all]);

    // Parse URL path: if /vs/some-slug is given, open that battle arena
    const path = getRoutePath();

    if (path.startsWith('/vs/')) {
      const slugFromUrl = path.replace('/vs/', '').trim();
      const found = all.find((m) => m.slug === slugFromUrl);
      if (found) {
        setCurrentMatch(found);
        setComments(MatchStore.getComments(found.id));
        setCurrentTab('battle');
      }
    } else {
      // Default match available for preview
      if (all.length > 0) {
        setCurrentMatch((prev) => prev || all[0]);
      }
    }

    setUser(MatchStore.getCurrentUser());
  }, []);

  useEffect(() => {
    MatchStore.init();
    syncStoreData();
    void MatchStore.connectBackend();

    const unsubscribe = MatchStore.subscribe(() => {
      syncStoreData();
    });

    // Listen to popstate for browser back/forward buttons
    const handlePopState = () => {
      const path = getRoutePath();
      if (path.startsWith('/vs/')) {
        const slugFromUrl = path.replace('/vs/', '').trim();
        const all = MatchStore.getMatches();
        const found = all.find((m) => m.slug === slugFromUrl);
        if (found) {
          setCurrentMatch(found);
          setComments(MatchStore.getComments(found.id));
          setCurrentTab('battle');
        }
      } else if (path === '/admin') {
        setCurrentTab('admin');
      } else if (path === '/request') {
        setCurrentTab('request');
      } else {
        setCurrentTab('home');
      }
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      unsubscribe();
      window.removeEventListener('popstate', handlePopState);
    };
  }, [syncStoreData]);

  // Keep search and social previews aligned with the battle URL.
  useEffect(() => {
    const battleMatch = currentTab === 'battle' ? currentMatch : null;
    const title = battleMatch
      ? `${battleMatch.creator1.name} vs ${battleMatch.creator2.name} - 1v1Vote Live Arena`
      : '1v1Vote - Live Creator Battles & Matchup Voting';
    const description = battleMatch
      ? `Vote in the live 1v1 battle between ${battleMatch.creator1.name} and ${battleMatch.creator2.name}. Share the result and follow the live vote swing.`
      : '1v1Vote: Live head-to-head voting battles between top creators. Vote, share, and decide who rules the arena.';
    const url = battleMatch ? `${window.location.origin}/vs/${battleMatch.slug}` : `${window.location.origin}/`;
    const image = `${window.location.origin}/og-image.svg`;

    document.title = title;
    setMeta('name', 'description', description);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:image', image);
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', image);
    setCanonical(url);

    let structuredData = document.querySelector<HTMLScriptElement>('script[data-1v1vote-seo]');
    if (!structuredData) {
      structuredData = document.createElement('script');
      structuredData.type = 'application/ld+json';
      structuredData.dataset['1v1voteSeo'] = 'true';
      document.head.appendChild(structuredData);
    }
    structuredData.textContent = JSON.stringify(battleMatch ? {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: title,
      description,
      url,
      startDate: battleMatch.startTime,
      endDate: battleMatch.endTime,
      eventStatus: battleMatch.status === 'ended' ? 'https://schema.org/EventCompleted' : 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
      location: { '@type': 'VirtualLocation', url },
      organizer: { '@type': 'Organization', name: '1v1Vote', url: `${window.location.origin}/` },
    } : {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: '1v1Vote',
      url,
      description,
    });
  }, [currentTab, currentMatch]);

  useEffect(() => {
    if (currentTab === 'battle' && currentMatch) {
      void MatchStore.recordView(currentMatch.id);
    }
  }, [currentTab, currentMatch?.id]);

  // Handle selecting a match from the grid or search to enter battle arena
  const handleSelectMatch = (match: Match) => {
    setCurrentMatch(match);
    setComments(MatchStore.getComments(match.id));
    setCurrentTab('battle');

    // Update URL cleanly for SEO: /vs/creator1-vs-creator2
    const newPath = `/vs/${match.slug}`;
    if (getRoutePath() !== newPath) {
      window.history.pushState(null, '', getPublicPath(newPath));
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Back to home page showing all battles
  const handleBackToHome = () => {
    setCurrentTab('home');
    if (getRoutePath() !== '/') {
      window.history.pushState(null, '', getPublicPath('/'));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle voting
  const handleVote = (creatorId: string) => {
    if (!currentMatch) return;

    const res = MatchStore.vote(currentMatch.id, creatorId);
    if (res.success) {
      setToastMessage(res.message);
    } else {
      setToastMessage(res.message);
    }
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Handle adding comments
  const handleAddComment = (authorName: string, content: string, allegianceCreatorId?: string) => {
    if (!currentMatch) return;
    MatchStore.addComment(currentMatch.id, authorName, content, allegianceCreatorId);
    setComments(MatchStore.getComments(currentMatch.id));
    setToastMessage('Comment posted!');
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleLikeComment = (commentId: string) => {
    if (!currentMatch) return;
    MatchStore.likeComment(currentMatch.id, commentId);
    setComments(MatchStore.getComments(currentMatch.id));
  };

  // Handle search query
  const handleSearchQuery = (query: string) => {
    if (!query.trim()) return;
    const q = query.toLowerCase();
    const found = matches.find(
      (m) =>
        m.creator1.name.toLowerCase().includes(q) ||
        m.creator2.name.toLowerCase().includes(q) ||
        m.title.toLowerCase().includes(q)
    );
    if (found) {
      handleSelectMatch(found);
    }
  };

  // Admin handlers
  const handleAddMatch = (matchData: Partial<Match>) => {
    const created = MatchStore.createMatch(matchData);
    handleSelectMatch(created);
  };

  const handleEndMatch = (matchId: string, winnerId?: string) => {
    MatchStore.endMatchManually(matchId, winnerId);
  };

  // User auth handlers
  const handleLogin = async (name: string, email: string, password: string) => {
    const result = await MatchStore.authenticate(name, email, password);
    if (!result.user) return result.error || 'Unable to sign in.';
    const profile = result.user;
    setUser(profile);
    setToastMessage(`Welcome, ${profile.name}! Your voting history is now synced.`);
    setTimeout(() => setToastMessage(null), 3500);
    return null;
  };

  const handleLogout = async () => {
    await MatchStore.logoutBackend();
    setUser(null);
    setToastMessage('Signed out.');
    setTimeout(() => setToastMessage(null), 2500);
  };

  const hasVoted = currentMatch ? MatchStore.hasUserVoted(currentMatch.id) : false;
  const votedCreatorId = currentMatch ? MatchStore.getUserVotedCreator(currentMatch.id) : undefined;

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-18 right-4 z-50 bg-[#0c1a36] border border-sky-500/80 text-sky-200 px-4 py-2.5 rounded-2xl shadow-[0_0_25px_rgba(56,189,248,0.4)] text-xs font-bold animate-bounce flex items-center gap-2">
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'home') {
            handleBackToHome();
          } else if (tab === 'leaderboard') {
            setIsLeaderboardModalOpen(true);
          } else {
            setCurrentTab(tab);
            if (tab === 'request' && getRoutePath() !== '/request') {
              window.history.pushState(null, '', getPublicPath('/request'));
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onSearchQuery={handleSearchQuery}
      />

      {/* Top Header Ad Placement (AdSense Slot) */}
      <div className="pt-2">
        <AdSensePlaceholder slotType="header-banner" />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {/* ================= HOME VIEW (ALL BATTLES HUB) ================= */}
        {currentTab === 'home' && (
          <div className="animate-fade-in">
            {/* Top Home Hero Banner */}
            <HomeHero
              featuredMatch={matches.find((m) => m.isTrending) || matches[0]}
              totalBattles={matches.filter((m) => m.status === 'active').length}
              totalVotesCount={matches.reduce((acc, m) => acc + m.votes1 + m.votes2, 0)}
              onSelectMatch={handleSelectMatch}
              onExploreClick={() => {
                const el = document.getElementById('active-matches-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* All Active Influencer Battles Grid - Central Hub */}
            <div id="active-matches-section">
              <ActiveMatchesGrid
                matches={matches}
                onSelectMatch={handleSelectMatch}
                selectedSlug={currentMatch?.slug}
              />
            </div>

            <section className="mx-auto my-8 w-full max-w-6xl px-3 sm:px-6">
              <div className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-amber-500/25 bg-gradient-to-r from-amber-950/30 to-[#0b1324] p-5 sm:flex-row sm:items-center sm:p-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Own a creator matchup?</p>
                  <h2 className="mt-1 text-xl font-black text-white">Submit a verified match request</h2>
                  <p className="mt-1 text-xs text-slate-400">Payment، ownership proof اور schedule کے بعد admin publish کرے گا۔</p>
                </div>
                <button onClick={() => { setCurrentTab('request'); window.history.pushState(null, '', getPublicPath('/request')); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-black text-slate-950 transition hover:bg-amber-400">Request a Match</button>
              </div>
            </section>

            {/* Platform Feature Highlights */}
            <FeatureBar />

            {/* In-Content Billboard Ad Placement */}
            <AdSensePlaceholder slotType="in-content" />

            {/* Past Concluded Battles & Hall of Fame Winners */}
            <PastMatches
              matches={matches}
              onSelectMatch={handleSelectMatch}
            />
          </div>
        )}

        {/* ================= DEDICATED 1V1 BATTLE ARENA VIEW ================= */}
        {currentTab === 'battle' && currentMatch && (
          <div className="animate-fade-in">
            {/* Back Button & Battle Header Navigation Bar */}
            <BattlePageHeader
              currentMatch={currentMatch}
              allMatches={matches}
              onBackToHome={handleBackToHome}
              onSelectMatch={handleSelectMatch}
              onShare={() => setIsShareModalOpen(true)}
            />

            {/* 1. Primary Match Arena (Creator vs Creator Clash) */}
            <MatchArena
              match={currentMatch}
              hasVoted={hasVoted}
              votedCreatorId={votedCreatorId}
              onVote={handleVote}
            />

            {/* 2. Stock Trading-Style Percentage Graph */}
            <StockTradingChart
              match={currentMatch}
              onOpenShareModal={() => setIsShareModalOpen(true)}
            />

            {/* 3. Vote Share Progress Cards */}
            <VoteShareCards match={currentMatch} />

            {/* 4. Four Feature Highlights Row */}
            <FeatureBar />

            {/* In-Content Billboard Ad Placement */}
            <AdSensePlaceholder slotType="in-content" />

            {/* 5. Live Comments Section with Fandom Allegiance */}
            <CommentsSection
              match={currentMatch}
              comments={comments}
              onAddComment={handleAddComment}
              onLikeComment={handleLikeComment}
            />

            {/* 6. More Battles Explorer at Bottom */}
            <div className="mt-8 pt-8 border-t border-slate-800/80">
              <div className="text-center mb-4">
                <h3 className="text-xl sm:text-2xl font-black text-white">More Active Battles</h3>
                <p className="text-xs text-slate-400 mt-1">Jump into another creator clash and make your vote count</p>
              </div>
              <ActiveMatchesGrid
                matches={matches}
                onSelectMatch={handleSelectMatch}
                selectedSlug={currentMatch.slug}
              />
            </div>
          </div>
        )}

        {currentTab === 'battles' && (
          <div className="animate-fade-in pt-4">
            <ActiveMatchesGrid
              matches={matches}
              onSelectMatch={handleSelectMatch}
              selectedSlug={currentMatch?.slug}
            />
            <PastMatches
              matches={matches}
              onSelectMatch={handleSelectMatch}
            />
          </div>
        )}

        {currentTab === 'request' && (
          <MatchRequestView user={user} onOpenAuth={() => setIsAuthModalOpen(true)} />
        )}

        {currentTab === 'admin' && (
          <AdminGate
            matches={matches}
            onAddMatch={handleAddMatch}
            onEndMatch={handleEndMatch}
            onBackup={async () => {
              try {
                const result = await MatchStore.createBackup();
                setToastMessage(`Backup created: ${result.backup}`);
              } catch (error: any) {
                setToastMessage(error?.message || 'Backup could not be created.');
              }
              setTimeout(() => setToastMessage(null), 3500);
            }}
            onExit={() => {
              window.history.pushState(null, '', getPublicPath('/'));
              setCurrentTab('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentTab === 'about' && (
          <AboutView />
        )}
      </main>

      {/* Modals */}
      {currentMatch && (
        <ShareModal
          match={currentMatch}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleLogin}
      />

      <LeaderboardModal
        isOpen={isLeaderboardModalOpen}
        onClose={() => setIsLeaderboardModalOpen(false)}
        currentUser={user}
      />

      {/* Global Footer */}
      <Footer onSelectTab={(tab) => {
        if (tab === 'leaderboard') {
          setIsLeaderboardModalOpen(true);
        } else {
          setCurrentTab(tab);
          if (tab === 'request' && getRoutePath() !== '/request') {
            window.history.pushState(null, '', getPublicPath('/request'));
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }} />
    </div>
  );
}

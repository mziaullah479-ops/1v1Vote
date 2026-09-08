import React, { useState } from 'react';
import { BarChart3, Info, Search, User, LogOut, Menu, X, Flame } from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  currentTab: 'home' | 'battle' | 'battles' | 'leaderboard' | 'about' | 'admin';
  onSelectTab: (tab: 'home' | 'battle' | 'battles' | 'leaderboard' | 'about' | 'admin') => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onSearchQuery?: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  user,
  onOpenAuth,
  onLogout,
  onSearchQuery,
}) => {
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchVal(e.target.value);
    if (onSearchQuery) onSearchQuery(e.target.value);
  };

  const handleNavClick = (tab: 'home' | 'battle' | 'battles' | 'leaderboard' | 'about' | 'admin') => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#070b16]/95 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-6 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo: 1v1Vote (WITHOUT .com as requested) */}
        <div 
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none group"
        >
          <div className="flex items-center tracking-tight">
            {/* 1v1 in cyan-blue badge */}
            <span className="bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-white font-black text-lg sm:text-2xl px-2 sm:px-2.5 py-0.5 rounded-lg shadow-[0_0_15px_rgba(56,189,248,0.5)] italic tracking-tighter mr-1.5">
              1v1
            </span>
            <span className="text-white font-extrabold text-lg sm:text-2xl tracking-normal group-hover:text-cyan-300 transition-colors">
              Vote
            </span>
          </div>

          <div className="hidden lg:flex items-center text-slate-500 text-xs font-medium pl-3 border-l border-slate-800 tracking-wide">
            Live Creator Matchups
          </div>
        </div>

        {/* Center Nav Tabs (Desktop) */}
        <nav className="hidden md:flex items-center gap-1.5 bg-[#0e1424] p-1 rounded-full border border-slate-800/70 shadow-inner">
          <button
            id="nav-home"
            onClick={() => handleNavClick('home')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              currentTab === 'home'
                ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.6)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
            Home
          </button>

          <button
            id="nav-battles"
            onClick={() => handleNavClick('battles')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              currentTab === 'battles'
                ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.6)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            All Battles
          </button>

          <button
            id="nav-leaderboard"
            onClick={() => handleNavClick('leaderboard')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              currentTab === 'leaderboard'
                ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.6)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Leaderboard
          </button>

          <button
            id="nav-about"
            onClick={() => handleNavClick('about')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              currentTab === 'about'
                ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.6)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            About
          </button>

        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Search Bar / Icon */}
          <div className="relative">
            {showSearchInput ? (
              <div className="flex items-center bg-[#0d1424] border border-slate-700 rounded-full px-2.5 py-1 text-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
                <input
                  type="text"
                  placeholder="Search creator..."
                  value={searchVal}
                  onChange={handleSearchChange}
                  autoFocus
                  onBlur={() => !searchVal && setShowSearchInput(false)}
                  className="bg-transparent text-white focus:outline-none w-24 sm:w-36 text-xs"
                />
              </div>
            ) : (
              <button
                id="btn-search-toggle"
                onClick={() => setShowSearchInput(true)}
                className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
                title="Search creators"
              >
                <Search className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* User Sign In / Profile */}
          {user ? (
            <div className="flex items-center gap-2 bg-[#0e1628] border border-slate-700/80 rounded-full pl-2 pr-2.5 py-1">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-6 h-6 rounded-full border border-cyan-400/50 bg-slate-800"
              />
              <span className="text-xs font-medium text-slate-200 max-w-[80px] truncate hidden sm:inline">
                {user.name}
              </span>
              <button
                onClick={onLogout}
                className="text-slate-400 hover:text-rose-400 ml-0.5 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              id="btn-signin"
              onClick={onOpenAuth}
              className="px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_14px_rgba(37,99,235,0.45)] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}

          {/* Mobile Menu Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-slate-800/90 flex flex-col gap-1.5 pb-2 animate-fade-in">
          <button
            onClick={() => handleNavClick('home')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              currentTab === 'home'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800/70'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
            <span>Home (All Battles)</span>
          </button>

          <button
            onClick={() => handleNavClick('battles')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              currentTab === 'battles'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800/70'
            }`}
          >
            <Flame className="w-4 h-4 text-orange-400" />
            <span>Active Matches Grid</span>
          </button>

          <button
            onClick={() => handleNavClick('leaderboard')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              currentTab === 'leaderboard'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800/70'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>Leaderboard</span>
          </button>

          <button
            onClick={() => handleNavClick('about')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              currentTab === 'about'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800/70'
            }`}
          >
            <Info className="w-4 h-4 text-sky-400" />
            <span>About 1v1Vote</span>
          </button>

        </div>
      )}
    </header>
  );
};

import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

type Theme = 'light' | 'dark';
const THEME_KEY = '1v1vote-theme-v1';

function readTheme(): Theme {
  try {
    return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(() => readTheme());

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // The visual preference still works when storage is unavailable.
    }
  }, [theme]);

  const dark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
      className="theme-toggle absolute right-4 top-4 z-[60] inline-flex min-h-11 items-center gap-2 rounded-full border border-sky-400/40 bg-white/95 px-3 py-2 text-xs font-black text-slate-800 shadow-xl shadow-slate-900/15 backdrop-blur transition hover:-translate-y-0.5 hover:border-sky-500 sm:fixed sm:bottom-4 sm:top-auto dark:bg-slate-900/95 dark:text-white"
    >
      {dark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-sky-600" />}
      <span className="hidden sm:inline">{dark ? 'Light mode' : 'Dark mode'}</span>
    </button>
  );
};

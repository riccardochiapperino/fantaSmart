'use client';

import React, { useState, useEffect } from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';

export function ThemeToggle({ showLabels = false }: { showLabels?: boolean }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-8 h-8 rounded-xl bg-slate-800/40 animate-pulse" />;
  }

  const cycleTheme = () => {
    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('system');
    else setTheme('dark');
  };

  return (
    <button
      onClick={cycleTheme}
      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-all duration-200 flex items-center gap-1.5 active:scale-95 shadow-sm"
      title={`Tema attuale: ${theme} (Clicca per cambiare)`}
      aria-label="Cambia tema"
    >
      {resolvedTheme === 'dark' ? (
        <Moon className="w-4 h-4 text-cyan-400" />
      ) : (
        <Sun className="w-4 h-4 text-amber-500" />
      )}
      {showLabels && (
        <span className="text-xs font-semibold capitalize">
          {theme === 'system' ? 'Sistema' : theme === 'dark' ? 'Scuro' : 'Chiaro'}
        </span>
      )}
    </button>
  );
}

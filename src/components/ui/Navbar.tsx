'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Menu,
  Zap,
  Settings,
  User,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { LogoWithText } from './Logo';
import { GuestBanner } from './GuestBanner';
import { AppSidebar } from '@/src/components/navigation/AppSidebar';
import { useAuth } from '@/lib/auth';
import { TabType } from '@/lib/types';

interface Props {
  latencyMs?: number;
  onOpenSettings: () => void;
  activeTab?: TabType;
  onSelectTab?: (tab: TabType) => void;
  activeLeagueName?: string;
}

export function Navbar({
  latencyMs = 2.8,
  onOpenSettings,
  activeTab,
  onSelectTab,
  activeLeagueName,
}: Props) {
  const router = useRouter();
  const { user, isGuest, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Chiudi menu al click esterno
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-200 shadow-sm">
        {/* Guest Warning Banner */}
        <GuestBanner />

        <div className="max-w-7xl mx-auto px-2.5 sm:px-4 h-13 sm:h-14 flex items-center justify-between gap-2">
          {/* Left: Hamburger Menu Button + Logo */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 transition-all active:scale-95 shadow-sm"
              title="Apri Menu di Navigazione"
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <Link
              href="/hub"
              className="group transition-transform active:scale-95 focus:outline-none shrink-0"
            >
              <LogoWithText logoClassName="w-7 h-7 sm:w-8 sm:h-8 group-hover:scale-105 transition-transform" />
            </Link>
          </div>

          {/* Right: Info App, Latency, Theme & Quick Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Latenza Badge Hydration Safe */}
            <div className="hidden md:flex items-center gap-1 text-[11px] font-bold text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 px-2.5 py-1 rounded-xl">
              <Zap className="w-3.5 h-3.5 text-cyan-500 animate-pulse" />
              <span suppressHydrationWarning>
                {mounted ? `${latencyMs.toFixed(1)} ms` : '< 3.0 ms'}
              </span>
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Settings Button */}
            <button
              onClick={onOpenSettings}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all active:scale-95 shadow-sm"
              title="Impostazioni di Sistema"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* User Profile Avatar & Dropdown */}
            <div className="relative" ref={menuRef}>
              {mounted && user ? (
                <>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-all ${
                      isGuest
                        ? 'bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                        : user.role === 'ADMIN'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                        : 'bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-300 dark:border-cyan-800 text-cyan-800 dark:text-cyan-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full text-black flex items-center justify-center text-[10px] font-black ${
                      isGuest ? 'bg-amber-500' : user.role === 'ADMIN' ? 'bg-emerald-500' : 'bg-cyan-500'
                    }`}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:inline max-w-[90px] truncate">{user.name}</span>
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 sm:w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                      <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                        <div className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                          {user.name}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {user.email}
                        </div>
                        <div className="text-[9px] font-black text-cyan-600 dark:text-cyan-400 uppercase mt-0.5">
                          Ruolo: {isGuest ? 'Ospite (Read-Only)' : user.role}
                        </div>
                      </div>

                      {user.role === 'ADMIN' && (
                        <Link
                          href="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" /> Database Admin
                        </Link>
                      )}

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Disconnetti
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-extrabold rounded-xl shadow-md transition-all active:scale-95"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Accedi</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Off-Canvas Sliding Navigation Sidebar */}
      <AppSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        activeLeagueName={activeLeagueName}
        onOpenSettings={onOpenSettings}
      />
    </>
  );
}

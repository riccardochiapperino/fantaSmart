'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Zap,
  Users,
  Layout,
  RefreshCw,
  Search,
  ShieldCheck,
  Home,
  Settings,
  LogOut,
  X,
  ChevronRight,
  Eye,
  Calendar,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { TabType } from '@/lib/types';
import { LogoWithText } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeTab?: TabType;
  onSelectTab?: (tab: TabType) => void;
  activeLeagueName?: string;
  onOpenSettings?: () => void;
}

export function AppSidebar({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  activeLeagueName,
  onOpenSettings,
}: Props) {
  const router = useRouter();
  const { user, isGuest, logout } = useAuth();

  // Chiudi con tasto Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const navLinks = [
    { id: 'asta' as TabType, label: 'Live Auction Cockpit', icon: Zap, color: 'text-cyan-500', badge: 'Live ⚡' },
    { id: 'rosa' as TabType, label: 'Mia Rosa & Modifica', icon: Users, color: 'text-emerald-500' },
    { id: 'campo' as TabType, label: 'Campo Tattico 2D', icon: Layout, color: 'text-blue-500', badge: 'Best 11' },
    { id: 'sostituto' as TabType, label: 'Sostituti & Alternative', icon: RefreshCw, color: 'text-amber-500' },
    { id: 'home' as TabType, label: 'Listone Calciatori', icon: Search, color: 'text-purple-500', badge: '515' },
  ];

  const handleNavClick = (tabId: TabType) => {
    if (onSelectTab) {
      onSelectTab(tabId);
    }
    onClose();
  };

  const handleLogout = () => {
    logout();
    onClose();
    router.push('/login');
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-in fade-in"
      />

      {/* Drawer Panel (Left to Right) */}
      <div className="relative w-full max-w-[300px] sm:max-w-xs bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 h-full shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200">
        {/* Top Header & Logo */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <LogoWithText logoClassName="w-7 h-7" />
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        {user && (
          <div className="p-3 mx-3 mt-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl text-black font-black flex items-center justify-center text-sm ${
              isGuest ? 'bg-amber-500' : user.role === 'ADMIN' ? 'bg-emerald-500' : 'bg-cyan-500'
            }`}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                {user.name}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {user.email}
              </div>
              <span className={`inline-block text-[9px] font-black uppercase px-1.5 py-0.2 rounded mt-0.5 ${
                isGuest
                  ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                  : user.role === 'ADMIN'
                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                  : 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300'
              }`}>
                {isGuest ? 'Ospite' : user.role}
              </span>
            </div>
          </div>
        )}

        {/* Active League Info */}
        {activeLeagueName && (
          <div className="px-4 pt-2">
            <div className="text-[10px] uppercase font-bold text-slate-400">Asta Selezionata:</div>
            <div className="text-xs font-black text-cyan-600 dark:text-cyan-400 truncate">
              {activeLeagueName}
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <div className="px-3 py-2 space-y-1 flex-1 overflow-y-auto">
          {/* Hub Leghe Link */}
          <Link
            href="/hub"
            onClick={onClose}
            className="w-full flex items-center justify-between p-2.5 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Home className="w-4 h-4 text-cyan-500" />
              <span>Hub Leghe</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>

          <div className="pt-2 pb-1 text-[10px] uppercase font-bold text-slate-400 px-2.5">
            Navigazione Live Asta
          </div>

          {navLinks.map(link => {
            const Icon = link.icon;
            const isActive = activeTab === link.id;

            return (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl font-bold text-xs transition-all ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${link.color}`} />
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span className="text-[9px] font-black bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                    {link.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Super Admin Link (se admin) */}
          {user?.role === 'ADMIN' && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 mt-2">
              <Link
                href="/admin"
                onClick={onClose}
                className="w-full flex items-center justify-between p-2.5 rounded-xl font-extrabold text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Gestione Database Calciatori</span>
                </div>
                <span className="text-[9px] font-black bg-emerald-500/20 px-1.5 py-0.5 rounded">
                  Admin
                </span>
              </Link>
            </div>
          )}
        </div>

        {/* Bottom Actions Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Tema Visivo:</span>
            <ThemeToggle />
          </div>

          {onOpenSettings && (
            <button
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Impostazioni di Sistema</span>
            </button>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-extrabold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Disconnetti</span>
          </button>
        </div>
      </div>
    </div>
  );
}

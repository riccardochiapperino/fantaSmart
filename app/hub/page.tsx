'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Zap,
  Plus,
  ShieldAlert,
  ShieldCheck,
  LogOut,
  Settings,
  LayoutGrid,
  Users,
  Wallet,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import {
  getUserAuctions,
  createAuction,
  duplicateAuction,
  deleteAuction,
  AuctionSession,
} from '@/lib/storage/multiAuctionStore';
import { saveAuctionState } from '@/lib/storage/auctionStorage';
import { LogoWithText } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Navbar } from '@/components/ui/Navbar';
import { AuctionCard } from '@/src/components/hub/AuctionCard';
import { CreateAuctionModal } from '@/src/components/hub/CreateAuctionModal';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { LeagueConfig } from '@/lib/types';

export default function HubPage() {
  const router = useRouter();
  const { user, isLoading, logout, setActiveAuctionId } = useAuth();

  const [auctions, setAuctions] = useState<AuctionSession[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>('');

  // 1. Route Guard: Se non autenticato, reindirizza a /login
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // 2. Carica le aste dell'utente
  const refreshAuctions = useCallback(() => {
    if (!user) return;
    const list = getUserAuctions(user.id);
    setAuctions(list);
    if (list.length > 0) {
      const currentActive = user.activeAuctionId || list[0].id;
      setActiveId(currentActive);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshAuctions();
    }
  }, [user, refreshAuctions]);

  // Handler: Entra nel Cockpit di una determinata asta
  const handleEnterCockpit = (auctionId: string) => {
    if (!user) return;
    setActiveAuctionId(auctionId);
    setActiveId(auctionId);

    // Carica la sessione specifica e sincronizza il storage locale
    const target = auctions.find(a => a.id === auctionId);
    if (target) {
      saveAuctionState({
        allPlayers: target.allPlayers,
        leagueConfig: target.leagueConfig,
        history: target.history || [],
        lastUpdated: new Date().toISOString(),
      });
    }

    router.push(`/auction?id=${auctionId}`);
  };

  // Handler: Naviga a specifica tab di un'asta
  const handleNavigateTab = (auctionId: string, tab: 'rosa' | 'campo') => {
    if (!user) return;
    setActiveAuctionId(auctionId);
    setActiveId(auctionId);

    const target = auctions.find(a => a.id === auctionId);
    if (target) {
      saveAuctionState({
        allPlayers: target.allPlayers,
        leagueConfig: target.leagueConfig,
        history: target.history || [],
        lastUpdated: new Date().toISOString(),
      });
    }

    router.push(`/auction?id=${auctionId}&tab=${tab}`);
  };

  // Handler: Duplica asta
  const handleDuplicate = (auctionId: string) => {
    if (!user) return;
    duplicateAuction(user.id, auctionId);
    refreshAuctions();
  };

  // Handler: Elimina asta
  const handleDelete = (auctionId: string) => {
    if (!user) return;
    deleteAuction(user.id, auctionId);
    refreshAuctions();
  };

  // Handler: Crea nuova asta
  const handleCreateAuction = (name: string, config: LeagueConfig) => {
    if (!user) return;
    const newSession = createAuction(user.id, name, config);
    refreshAuctions();
    handleEnterCockpit(newSession.id);
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-cyan-400 font-bold text-sm animate-pulse">
        Caricamento Hub Leghe...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 flex flex-col justify-between">
      {/* 1. TOP NAVBAR CON LOGO, HAMBURGER SIDEBAR & INFO */}
      <Navbar onOpenSettings={() => setIsSettingsOpen(true)} />

      {/* 2. MAIN CONTENT HUB */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8 w-full space-y-6 flex-1">
        {/* Welcome Hero Banner */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-white relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
          <div className="absolute right-[-5%] top-[-30%] w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute left-[30%] bottom-[-40%] w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-1.5 z-10">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Multi-Auction Hub • Stagione 2026/2027</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Bentornato, {user.name}! ⚽
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
              Seleziona una delle tue leghe per entrare nel Live Auction Cockpit oppure creane una nuova per iniziare un'asta da zero.
            </p>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="z-10 flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black text-xs sm:text-sm rounded-2xl shadow-xl transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>CREA NUOVA ASTA</span>
          </button>
        </div>

        {/* Sezione Le Mie Aste */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-cyan-500" />
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                Le Mie Aste ({auctions.length})
              </h2>
            </div>
          </div>

          {/* Griglia Aste */}
          {auctions.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-cyan-500/10 text-cyan-500 flex items-center justify-center mx-auto">
                <Plus className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Nessuna asta creata</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Inizia creando la tua prima lega con parametri e budget personalizzati.
              </p>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="px-4 py-2 bg-cyan-500 text-black font-bold text-xs rounded-xl shadow-md"
              >
                Crea Prima Asta
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {auctions.map(auction => (
                <AuctionCard
                  key={auction.id}
                  auction={auction}
                  isActive={auction.id === activeId}
                  onEnterCockpit={handleEnterCockpit}
                  onNavigateTab={handleNavigateTab}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 py-4 px-4 text-center text-xs text-slate-400">
        FantaSmart Engine 2026/2027 • Multi-Auction RBAC Platform
      </footer>

      {/* Modal Creazione Asta */}
      <CreateAuctionModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreateAuction}
      />

      {/* Modal Impostazioni */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Settings,
  Users,
  Layout,
  Search,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import {
  getUserAuctions,
  getAuctionById,
  updateAuctionSession,
  AuctionSession,
} from '@/lib/storage/multiAuctionStore';
import { TabType, Role, Player } from '@/lib/types';
import { useFanta } from '@/hooks/useFanta';
import { Navbar } from '@/components/ui/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { LiveAuctionCockpit } from '@/src/components/auction/LiveAuctionCockpit';
import { RosaTab } from '@/components/tabs/RosaTab';
import { TacticalPitchView } from '@/components/pitch';
import { SostitutoTab } from '@/components/tabs/SostitutoTab';
import { ListoneTab } from '@/components/tabs/ListoneTab';

function AuctionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auctionIdParam = searchParams.get('id');
  const initialTabParam = (searchParams.get('tab') as TabType) || 'asta';

  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>(initialTabParam);
  const [currentSession, setCurrentSession] = useState<AuctionSession | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [focusedPlayer, setFocusedPlayer] = useState<Player | null>(null);

  const isGuest = !user || user.isGuest || user.id?.startsWith('guest-');
  const targetAuctionId = auctionIdParam || user?.activeAuctionId || currentSession?.id;

  const fanta = useFanta({
    auctionId: targetAuctionId,
    isGuest,
  });

  // 1. Auth Guard: Se non autenticato, reindirizza a /login
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // 2. Carica la sessione d'asta selezionata
  useEffect(() => {
    if (!user) return;
    const targetId = auctionIdParam || user.activeAuctionId;
    const session = targetId ? getAuctionById(user.id, targetId) : getUserAuctions(user.id)[0];

    if (session) {
      setCurrentSession(session);
    } else {
      router.push('/hub');
    }
  }, [user, auctionIdParam, router]);

  // 3. Sincronizzazione automatica delle modifiche all'asta attiva
  useEffect(() => {
    if (!user || !currentSession || !fanta.advisorState) return;

    updateAuctionSession(user.id, currentSession.id, {
      allPlayers: fanta.advisorState.allPlayers,
      myRoster: fanta.advisorState.myRoster,
      opponents: fanta.advisorState.opponents,
      remainingBudget: fanta.advisorState.remainingBudget,
      leagueConfig: fanta.advisorState.leagueConfig,
    });
  }, [
    user,
    currentSession?.id,
    fanta.advisorState?.myRoster,
    fanta.advisorState?.remainingBudget,
    fanta.advisorState?.opponents,
    fanta.advisorState?.allPlayers,
    fanta.advisorState?.leagueConfig,
  ]);

  if (authLoading || !user || !currentSession) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-cyan-400 font-bold text-sm animate-pulse">
        Caricamento Asta Live in Corso...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-20 overflow-x-hidden w-full transition-colors duration-200">
      {/* 1. TOP NAVBAR CON LOGO, HAMBURGER SIDEBAR & INFO APPLICAZIONE */}
      <Navbar
        latencyMs={fanta.advisorState?.lastCalculationLatencyMs ?? 2.8}
        onOpenSettings={() => setIsSettingsOpen(true)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        activeLeagueName={currentSession.name}
      />

      {/* 2. SUB-BAR CON NOME LEGA & CAMBIO RAPIDO TAB */}
      <div className="bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800/80 backdrop-blur-md px-3 sm:px-4 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Back to Hub & League Name */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/hub"
              className="flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Hub Leghe</span>
            </Link>

            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-sm">
                {currentSession.name}
              </span>
              <span className="text-[10px] font-black bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 px-2 py-0.5 rounded-md border border-cyan-500/30">
                {currentSession.leagueConfig.numTeams} Squadre
              </span>
            </div>
          </div>

          {/* Tab Switcher Desktop */}
          <div className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
            <button
              onClick={() => setActiveTab('asta')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeTab === 'asta'
                  ? 'bg-cyan-500 text-black shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              ⚡ Live Cockpit
            </button>
            <button
              onClick={() => setActiveTab('rosa')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeTab === 'rosa'
                  ? 'bg-cyan-500 text-black shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              📋 Mia Rosa ({fanta.squad.length})
            </button>
            <button
              onClick={() => setActiveTab('campo')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeTab === 'campo'
                  ? 'bg-cyan-500 text-black shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🏟️ Campo 2D
            </button>
            <button
              onClick={() => setActiveTab('sostituto')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeTab === 'sostituto'
                  ? 'bg-cyan-500 text-black shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🔄 Sostituto
            </button>
            <button
              onClick={() => setActiveTab('home')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeTab === 'home'
                  ? 'bg-cyan-500 text-black shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              📊 Listone
            </button>
          </div>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE */}
      <main className="p-3 sm:p-4 max-w-7xl mx-auto space-y-4">
        {activeTab === 'asta' && (
          <LiveAuctionCockpit
            selectedPlayer={focusedPlayer}
            onSelectPlayer={setFocusedPlayer}
            auctionId={currentSession.id}
            isGuest={isGuest}
          />
        )}

        {activeTab === 'rosa' && (
          <RosaTab
            squad={fanta.squad}
            availablePlayers={fanta.availablePlayers}
            remainingBudget={fanta.remainingBudget}
            totalBudget={fanta.budget}
            schedule={fanta.schedule}
            pairingMatrix={fanta.pairingMatrix}
            onUpdatePrice={fanta.updatePlayerPrice}
            onReleasePlayer={fanta.releasePlayer}
            onAddPlayer={(id, price) => fanta.buyPlayer(id, price, true)}
            onFocusPlayer={player => {
              setFocusedPlayer(player);
              setActiveTab('asta');
            }}
            onNavigateToPitch={() => setActiveTab('campo')}
          />
        )}

        {activeTab === 'campo' && (
          <TacticalPitchView
            squad={fanta.squad}
            schedule={fanta.schedule}
            pairingMatrix={fanta.pairingMatrix}
          />
        )}

        {activeTab === 'sostituto' && (
          <SostitutoTab
            players={fanta.players}
            squad={fanta.squad}
            remainingBudget={fanta.remainingBudget}
            schedule={fanta.schedule}
            pairingMatrix={fanta.pairingMatrix}
            selectedLostPlayer={fanta.selectedLostPlayer}
            setSelectedLostPlayer={fanta.setSelectedLostPlayer}
            onBuy={fanta.buyPlayer}
            onReleasePlayer={fanta.releasePlayer}
          />
        )}

        {activeTab === 'home' && (
          <ListoneTab
            players={fanta.players}
            onBuyPlayer={(id, price) => fanta.buyPlayer(id, price, true)}
            onMarkAsLost={fanta.markAsLost}
            onReleasePlayer={fanta.releasePlayer}
          />
        )}
      </main>

      {/* 4. BOTTOM MOBILE NAV */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 5. MODAL IMPOSTAZIONI */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

export default function AuctionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-cyan-400 font-bold text-sm animate-pulse">
        Caricamento Live Cockpit...
      </div>
    }>
      <AuctionContent />
    </Suspense>
  );
}

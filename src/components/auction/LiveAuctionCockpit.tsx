'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Player, LeagueConfig } from '@/lib/types';
import type { useAuctionAdvisor } from '@/lib/advisor';
import {
  saveAuctionState,
  loadAuctionState,
  clearAuctionStorage,
  TransactionRecord,
} from '@/lib/storage/auctionStorage';

import { LiveAuctionHUD } from './LiveAuctionHUD';
import { QuickActionBar } from './QuickActionBar';
import { PlayerFocusCard } from './PlayerFocusCard';
import { AdvisorSidebar } from './AdvisorSidebar';
import { TransactionHistory } from './TransactionHistory';
import { AuctionSetupModal } from './AuctionSetupModal';
import { OpponentsOverviewDrawer } from './OpponentsOverviewDrawer';
import { ReleasePlayerModal } from '@/src/components/modals/ReleasePlayerModal';

export interface LiveAuctionCockpitProps {
  /** Advisor condiviso con il resto della pagina (unica fonte di verità di budget, rosa e prezzi) */
  advisor: ReturnType<typeof useAuctionAdvisor>;
  selectedPlayer?: Player | null;
  onSelectPlayer?: (player: Player | null) => void;
  auctionId?: string;
  isGuest?: boolean;
}

export function LiveAuctionCockpit({
  advisor,
  selectedPlayer: externalSelectedPlayer,
  onSelectPlayer: onExternalSelectPlayer,
  auctionId,
  isGuest,
}: LiveAuctionCockpitProps) {
  // 1. Hydration Safety State per prevenire mismatch SSR/CSR in Next.js
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isOpponentsOpen, setIsOpponentsOpen] = useState(false);
  const [internalSelectedPlayer, setInternalSelectedPlayer] = useState<Player | null>(null);
  const [releasingPlayer, setReleasingPlayer] = useState<Player | null>(null);
  const [history, setHistory] = useState<TransactionRecord[]>([]);

  // Sincronizzazione calciatore in battuta da prop esterna (es. "Porta in Battuta")
  useEffect(() => {
    if (externalSelectedPlayer !== undefined) {
      setInternalSelectedPlayer(externalSelectedPlayer);
    }
  }, [externalSelectedPlayer]);

  const rawSelectedPlayer = externalSelectedPlayer !== undefined ? externalSelectedPlayer : internalSelectedPlayer;

  // Versione aggiornata del giocatore in battuta (prezzo e stato seguono sempre le regole attuali della lega)
  const selectedPlayer = useMemo(
    () =>
      rawSelectedPlayer
        ? advisor.state.allPlayers.find(p => p.id === rawSelectedPlayer.id) ?? rawSelectedPlayer
        : null,
    [rawSelectedPlayer, advisor.state.allPlayers]
  );

  const handleSelectPlayer = useCallback(
    (player: Player | null) => {
      setInternalSelectedPlayer(player);
      onExternalSelectPlayer?.(player);
    },
    [onExternalSelectPlayer]
  );

  // 2. Hydration Effect: ripristina solo la cronologia transazioni (RAM volatile se Guest, localStorage se registrato).
  // Rosa, budget e regole della lega sono gestiti dall'advisor condiviso: non vanno ripristinati da qui.
  useEffect(() => {
    setIsHydrated(true);
    const saved = loadAuctionState(auctionId, isGuest);
    if (saved?.history) {
      setHistory(saved.history);
    }
  }, [auctionId, isGuest]);

  // 4. Auto-Sync Persistence ad ogni modifica di stato dell'Advisor
  useEffect(() => {
    if (!isHydrated) return;
    saveAuctionState(
      {
        allPlayers: advisor.state.allPlayers,
        leagueConfig: advisor.state.leagueConfig,
        history,
        lastUpdated: new Date().toISOString(),
      },
      auctionId,
      isGuest
    );
  }, [advisor.state.allPlayers, advisor.state.leagueConfig, history, isHydrated, auctionId, isGuest]);

  // Handler Acquisto "Preso da Me" (Verde / Enter)
  const handleBuyMine = useCallback(
    (player: Player, price: number) => {
      // Sicurezza: non registrare acquisti che superano i crediti disponibili
      if (price > advisor.state.maxBid) return;
      advisor.buyPlayer(player.id, price, true);

      const newTx: TransactionRecord = {
        id: `tx_${Date.now()}_${player.id}`,
        timestamp: new Date().toLocaleTimeString(),
        player,
        price,
        isMine: true,
      };

      setHistory(prev => [newTx, ...prev]);
      handleSelectPlayer(null);
    },
    [advisor, handleSelectPlayer]
  );

  // Handler Acquisto "Preso da Altro" (Rosso / Shift+Enter)
  const handleBuyOther = useCallback(
    (player: Player, price?: number, buyerId?: string) => {
      const finalPrice = price || player.targetPrice || player.estPrice || 1;
      advisor.buyPlayer(player.id, finalPrice, false, buyerId);

      const buyerName = buyerId
        ? advisor.state.opponents.find(o => o.id === buyerId)?.name || 'Rivale'
        : 'Rivale';

      const newTx: TransactionRecord = {
        id: `tx_${Date.now()}_${player.id}`,
        timestamp: new Date().toLocaleTimeString(),
        player,
        price: finalPrice,
        isMine: false,
        buyerId: buyerName,
      };

      setHistory(prev => [newTx, ...prev]);
      handleSelectPlayer(null);
    },
    [advisor, handleSelectPlayer]
  );

  // Handler Undo Ultimo Acquisto (Ctrl+Z)
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;

    const [lastTx, ...remainingHistory] = history;
    setHistory(remainingHistory);

    // Ripristina SOLO il giocatore dell'ultima transazione (torna libero, crediti restituiti)
    advisor.releasePlayer(lastTx.player.id);
    if (selectedPlayer?.id === lastTx.player.id) {
      handleSelectPlayer(null);
    }
  }, [history, advisor, selectedPlayer, handleSelectPlayer]);

  // Handler Deselezione / Svincolo Giocatore
  const handleReleasePlayer = useCallback(
    (playerId: number) => {
      const found = advisor.state.allPlayers.find(p => p.id === playerId);
      if (found && found.boughtFor !== undefined) {
        setReleasingPlayer(found);
      } else {
        advisor.releasePlayer(playerId);
        setHistory(prev => prev.filter(tx => tx.player.id !== playerId));
        if (selectedPlayer?.id === playerId) {
          handleSelectPlayer(null);
        }
      }
    },
    [advisor, selectedPlayer, handleSelectPlayer]
  );

  const handleConfirmRelease = useCallback(
    (playerId: number, refundAmount: number) => {
      advisor.releasePlayer(playerId, refundAmount);
      setHistory(prev => prev.filter(tx => tx.player.id !== playerId));
      if (selectedPlayer?.id === playerId) {
        handleSelectPlayer(null);
      }
    },
    [advisor, selectedPlayer, handleSelectPlayer]
  );

  // Raccomandazioni k-NN e Pairing per il giocatore correntemente focalizzato
  const currentRecommendations = useMemo(() => {
    if (!selectedPlayer) {
      return { replacements: [], calendarPairings: [] };
    }
    return advisor.getRecommendationsFor(selectedPlayer.id);
  }, [advisor, selectedPlayer]);

  // Nominations Strategiche (Target vs Esca)
  const currentNominations = useMemo(() => {
    const targets = advisor.getNextNomination(undefined, 'target');
    const baits = advisor.getNextNomination(undefined, 'bait');
    return [...targets, ...baits];
  }, [advisor]);

  const handleSaveSetup = (newConfig: LeagueConfig, newPlayers?: Player[]) => {
    if (newPlayers && newPlayers.length > 0) {
      advisor.updateLeagueConfig(newConfig);
    } else {
      advisor.updateLeagueConfig(newConfig);
    }
  };

  const handleResetAuction = () => {
    clearAuctionStorage(auctionId, isGuest);
    setHistory([]);
    handleSelectPlayer(null);
    advisor.resetAuction();
  };

  if (!isHydrated) {
    return (
      <div className="min-h-[400px] flex items-center justify-center text-cyan-400 font-bold text-sm animate-pulse">
        Caricamento Live Cockpit In Corso...
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      {/* 1. TOP HUD BAR */}
      <LiveAuctionHUD
        state={advisor.state}
        onOpenSetup={() => setIsSetupOpen(true)}
        onOpenOpponents={() => setIsOpponentsOpen(true)}
        onReset={handleResetAuction}
      />

      {/* 2. QUICK ACTION BAR (Cmd+K) */}
      <QuickActionBar
        availablePlayers={advisor.state.availablePlayers}
        selectedPlayer={selectedPlayer}
        opponents={advisor.state.opponents}
        remainingBudget={advisor.state.remainingBudget}
        maxBid={advisor.state.maxBid}
        slotsToFill={advisor.state.slotsToFill}
        onSelectPlayer={handleSelectPlayer}
        onBuyMine={handleBuyMine}
        onBuyOther={handleBuyOther}
        onUndo={handleUndo}
      />

      {/* 3. MAIN GRID (Focus Card + Advisor Drawer) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* FOCUS PLAYER CARD (7 Colonne) */}
        <div className="lg:col-span-7">
          <PlayerFocusCard
            player={selectedPlayer}
            remainingBudget={advisor.state.remainingBudget}
            maxBid={advisor.state.maxBid}
            onBuyMine={handleBuyMine}
            onBuyOther={handleBuyOther}
            onRelease={handleReleasePlayer}
          />
        </div>

        {/* SMART ADVISOR SIDEBAR (5 Colonne) */}
        <div className="lg:col-span-5 h-full">
          <AdvisorSidebar
            selectedPlayer={selectedPlayer}
            advisorState={advisor.state}
            recommendations={currentRecommendations}
            nominations={currentNominations}
            onBuyPlayer={handleBuyMine}
            onSelectPlayer={handleSelectPlayer}
          />
        </div>
      </div>

      {/* 4. CRONOLOGIA TRANSAZIONI & UNDO STACK */}
      <TransactionHistory
        history={history}
        onUndo={handleUndo}
        onReleasePlayer={handleReleasePlayer}
      />

      {/* 5. MODAL CONFIGURAZIONE & UPLOAD LISTONE */}
      <AuctionSetupModal
        isOpen={isSetupOpen}
        onClose={() => setIsSetupOpen(false)}
        currentConfig={advisor.state.leagueConfig}
        onSaveSetup={handleSaveSetup}
      />

      {/* 6. DRAWER OPPONENTS OVERVIEW & MARKET HEATMAP */}
      <OpponentsOverviewDrawer
        isOpen={isOpponentsOpen}
        onClose={() => setIsOpponentsOpen(false)}
        opponents={advisor.state.opponents}
        marketScarcity={advisor.state.marketScarcity}
        onRenameOpponent={advisor.renameOpponent}
        onReleasePlayer={advisor.releasePlayer}
      />

      {/* 7. MODAL SVINCOLO & RECUPERO CREDITI */}
      <ReleasePlayerModal
        player={releasingPlayer}
        isOpen={!!releasingPlayer}
        onClose={() => setReleasingPlayer(null)}
        onConfirm={handleConfirmRelease}
      />
    </div>
  );
}

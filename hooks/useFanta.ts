'use client';

import { useState, useCallback } from 'react';
import { Player, Role, TabType, LeagueConfig } from '@/lib/types';
import { useAuctionAdvisor } from '@/lib/advisor/useAuctionAdvisor';
import { REAL_PLAYERS_2026, REAL_SCHEDULE_2026, REAL_PAIRING_MATRIX_2026 } from '@/lib/mock/realDataset2026';

export interface UseFantaOptions {
  auctionId?: string;
  isGuest?: boolean;
  /** Regole della lega scelte alla creazione dell'asta (budget, squadre, slot, modificatore) */
  initialConfig?: LeagueConfig;
}

export function useFanta(options?: UseFantaOptions) {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [selectedLostPlayer, setSelectedLostPlayer] = useState<Player | null>(null);

  const advisor = useAuctionAdvisor({
    initialPlayers: REAL_PLAYERS_2026,
    initialSchedule: REAL_SCHEDULE_2026,
    initialPairingMatrix: REAL_PAIRING_MATRIX_2026,
    initialConfig: options?.initialConfig,
    auctionId: options?.auctionId,
    isGuest: options?.isGuest,
  });

  const {
    state,
    buyPlayer: advisorBuyPlayer,
    updatePlayerPrice,
    releasePlayer,
    updatePlayerStatus,
    markAsLost: advisorMarkAsLost,
    resetAuction,
    resetToFactoryDataset,
  } = advisor;

  const players = state.allPlayers;
  const squad = state.myRoster;
  const availablePlayers = state.availablePlayers;
  const lostPlayers = state.lostPlayers;
  const budget = state.leagueConfig.initialBudget;
  const spent = state.spentBudget;
  const remainingBudget = state.remainingBudget;

  const remainingSlots = state.slotsToFill;
  const maxBid = state.maxBid;
  const avgPerSlot = remainingSlots > 0 ? (remainingBudget / remainingSlots).toFixed(1) : '0';

  // Wrapper polimorfico per buyPlayer (accetta sia Player object che playerId number)
  const buyPlayer = useCallback(
    (playerOrId: Player | number, price: number, isMine: boolean = true, buyerId?: string) => {
      const id = typeof playerOrId === 'number' ? playerOrId : playerOrId.id;
      // Un acquisto mio non può superare i crediti disponibili (1 cr riservato per ogni slot ancora vuoto)
      if (isMine && price > maxBid) {
        alert(
          `Budget superato: puoi offrire al massimo ${maxBid} crediti ` +
            `(te ne restano ${remainingBudget}, con ${remainingSlots} slot ancora da riempire).`
        );
        return;
      }
      advisorBuyPlayer(id, price, isMine, buyerId);
    },
    [advisorBuyPlayer, maxBid, remainingBudget, remainingSlots]
  );

  // Wrapper polimorfico per markAsLost
  const markAsLost = useCallback(
    (playerOrId: Player | number) => {
      const id = typeof playerOrId === 'number' ? playerOrId : playerOrId.id;
      const target = players.find(p => p.id === id);
      advisorMarkAsLost(id);
      if (target) {
        setSelectedLostPlayer(target);
        setActiveTab('sostituto');
      }
    },
    [advisorMarkAsLost, players]
  );

  // Modifica slot
  const updateSlot = useCallback(
    (playerId: number, newSlot: number) => {
      updatePlayerStatus(playerId, { slot: newSlot });
    },
    [updatePlayerStatus]
  );

  // Export backup JSON
  const exportBackup = useCallback(() => {
    if (typeof window === 'undefined') return;
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify({ players, spent, config: state.leagueConfig }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `fantasmart_backup_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }, [players, spent, state.leagueConfig]);

  // Import backup JSON
  const importBackup = useCallback(
    (jsonString: string) => {
      try {
        const parsed = JSON.parse(jsonString);
        if (parsed.players && Array.isArray(parsed.players)) {
          parsed.players.forEach((p: Player) => {
            if (p.boughtFor !== undefined) {
              advisorBuyPlayer(p.id, p.boughtFor, true);
            } else if (p.isLost) {
              advisorMarkAsLost(p.id);
            }
          });
          alert('Backup caricato con successo!');
        } else {
          alert('Formato file JSON non valido.');
        }
      } catch {
        alert('Errore durante la lettura del file JSON.');
      }
    },
    [advisorBuyPlayer, advisorMarkAsLost]
  );

  // Reset dati
  const resetData = useCallback(() => {
    if (
      confirm(
        "Sei sicuro di voler resettare tutti i dati dell'asta? Tutti gli acquisti andranno persi."
      )
    ) {
      resetAuction();
    }
  }, [resetAuction]);

  return {
    players,
    squad,
    availablePlayers,
    lostPlayers,
    budget,
    spent,
    remainingBudget,
    remainingSlots,
    maxBid,
    avgPerSlot,
    activeTab,
    setActiveTab,
    selectedLostPlayer,
    setSelectedLostPlayer,
    buyPlayer,
    markAsLost,
    updatePlayerPrice,
    releasePlayer,
    updatePlayerStatus,
    updateSlot,
    updateLeagueConfig: advisor.updateLeagueConfig,
    exportBackup,
    importBackup,
    resetData,
    resetToFactoryDataset,
    opponents: state.opponents,
    marketScarcity: state.marketScarcity,
    renameOpponent: advisor.renameOpponent,
    advisor,
    advisorState: state,
    schedule: state.schedule,
    pairingMatrix: state.pairingMatrix,
  };
}

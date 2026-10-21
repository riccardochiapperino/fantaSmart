'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Player,
  Role,
  LeagueConfig,
  ScheduleGrid,
  PairingMatrix,
  AdvisorState,
  ReplacementRecommendation,
  PairingScore,
  NominationRecommendation,
  OpponentTeam,
  MarketScarcity,
} from '@/lib/types';
import { MOCK_PLAYERS, MOCK_LEAGUE_CONFIG, MOCK_SCHEDULE_GRID, MOCK_PAIRING_MATRIX, REAL_PLAYERS_2026, REAL_SCHEDULE_2026, REAL_PAIRING_MATRIX_2026 } from './mockData';
import { calculateAllPlayerScores, calculateCPS, calculateXFM } from './scoring';
import {
  calculateRoleBaselines,
  calculateVORP,
  calculateInitialSlotBudgets,
  rebalanceSlotBudgets,
  calculateMarketInflation,
  applyFixedPricing,
  calculateMaxBid,
} from './vorpEngine';
import { findBestPairingsForPlayer } from './pairingEngine';
import { getNearestNeighborsReplacements, getStrategicNominations } from './recommender';

const STORAGE_KEY = 'fanta_live_auction_2026';

export function createInitialOpponents(config: LeagueConfig): OpponentTeam[] {
  const totalRivals = Math.max(1, config.numTeams - 1);
  const slots = config.slotsPerRole || { P: 3, D: 8, C: 8, A: 6 };
  const teams: OpponentTeam[] = [];

  const defaultNames = [
    'FC Rival 1',
    'Real Rivale 2',
    'Dinamo 3',
    'Virtus 4',
    'Atletico 5',
    'Sporting 6',
    'Olympique 7',
    'Borussia 8',
    'Stella Rossa 9',
    'Galatasaray 10',
    'Celtic 11',
    'Rangers 12',
    'Feyenoord 13',
    'Benfica 14',
    'Porto 15',
  ];

  for (let i = 1; i <= totalRivals; i++) {
    teams.push({
      id: `rival-${i}`,
      name: defaultNames[i - 1] || `Squadra Rivale ${i}`,
      remainingBudget: config.initialBudget,
      spentBudget: 0,
      slots: { ...slots },
      maxSlots: { ...slots },
      spentByRole: { P: 0, D: 0, C: 0, A: 0 },
      roster: [],
    });
  }
  return teams;
}

export interface UseAuctionAdvisorOptions {
  initialPlayers?: Player[];
  initialConfig?: LeagueConfig;
  initialSchedule?: ScheduleGrid;
  initialPairingMatrix?: PairingMatrix;
  auctionId?: string;
  isGuest?: boolean;
}

export function useAuctionAdvisor(options?: UseAuctionAdvisorOptions) {
  const auctionId = options?.auctionId;
  const isGuest = options?.isGuest;
  const storageKey = auctionId ? `fanta_live_auction_${auctionId}` : STORAGE_KEY;
  // Config di partenza della lega (quella scelta alla creazione dell'asta), usata anche per i ripristini
  const defaultConfig = options?.initialConfig ?? MOCK_LEAGUE_CONFIG;

  const [leagueConfig, setLeagueConfig] = useState<LeagueConfig>(defaultConfig);
  const [schedule] = useState<ScheduleGrid>(
    options?.initialSchedule ?? REAL_SCHEDULE_2026
  );
  const [pairingMatrix] = useState<PairingMatrix>(
    options?.initialPairingMatrix ?? REAL_PAIRING_MATRIX_2026
  );
  const [allPlayers, setAllPlayers] = useState<Player[]>(
    options?.initialPlayers ?? REAL_PLAYERS_2026
  );
  const [opponents, setOpponents] = useState<OpponentTeam[]>(() =>
    createInitialOpponents(leagueConfig)
  );

  const [slotBudgets, setSlotBudgets] = useState(() =>
    calculateInitialSlotBudgets(leagueConfig)
  );

  // Caricamento iniziale da LocalStorage (Hydration Safe e isolato per sessione d'asta)
  useEffect(() => {
    if (typeof window === 'undefined' || isGuest) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.players && Array.isArray(parsed.players) && parsed.players.length > 0) {
          setAllPlayers(parsed.players);
        }
        if (parsed.config) {
          setLeagueConfig(parsed.config);
          setSlotBudgets(calculateInitialSlotBudgets(parsed.config));
        }
        if (parsed.opponents && Array.isArray(parsed.opponents)) {
          setOpponents(parsed.opponents);
        }
      }
    } catch (err) {
      console.warn('Errore lettura LocalStorage asta:', err);
    }
  }, [storageKey, isGuest]);

  // Salvataggio automatico su LocalStorage ad ogni modifica (Se Guest, opera solo in RAM)
  const persistState = useCallback(
    (playersToSave: Player[], configToSave: LeagueConfig, opponentsToSave?: OpponentTeam[]) => {
      if (typeof window === 'undefined' || isGuest) return;
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            players: playersToSave,
            config: configToSave,
            opponents: opponentsToSave ?? opponents,
            timestamp: Date.now(),
          })
        );
      } catch (err) {
        console.warn('Errore salvataggio LocalStorage asta:', err);
      }
    },
    [opponents, storageKey, isGuest]
  );

  // Giocatori con prezzo consigliato, CPS e VORP calcolati dalle regole della lega.
  // Il prezzo è FISSO: dipende solo da config + caratteristiche dei giocatori, non da acquisti o crediti rimasti.
  const pricedPlayers = useMemo(
    () => applyFixedPricing(allPlayers, leagueConfig),
    [allPlayers, leagueConfig]
  );

  // Calcolo sincrono ultra-veloce (<3ms) dello stato dell'Advisor & Market Scarcity
  const advisorState: AdvisorState = useMemo(() => {
    const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

    const myRoster = pricedPlayers.filter(p => p.boughtFor !== undefined);
    const lostPlayers = pricedPlayers.filter(p => p.isLost);
    const availablePlayers = pricedPlayers.filter(
      p => p.boughtFor === undefined && !p.isLost
    );

    const spentBudget = myRoster.reduce((sum, p) => sum + (p.boughtFor ?? 0), 0);
    const remainingBudget = Math.max(0, leagueConfig.initialBudget - spentBudget);
    const totalLeagueBudget = leagueConfig.numTeams * leagueConfig.initialBudget;

    // Slot ancora da riempire e massimo offribile (1 cr riservato per ogni slot successivo)
    const totalSlots = Object.values(leagueConfig.slotsPerRole).reduce((a, b) => a + b, 0);
    const slotsToFill = Math.max(0, totalSlots - myRoster.length);
    const maxBid = calculateMaxBid(remainingBudget, slotsToFill);

    // 1. Scoring vettoriale veloce
    const scoresMap = calculateAllPlayerScores(pricedPlayers);

    // 2. Baselines e VORP
    const baselines = calculateRoleBaselines(pricedPlayers, leagueConfig, scoresMap);

    // 3. Disponibili per reparto
    const availableByRole: Record<Role, Player[]> = {
      P: availablePlayers.filter(p => p.role === 'P'),
      D: availablePlayers.filter(p => p.role === 'D'),
      C: availablePlayers.filter(p => p.role === 'C'),
      A: availablePlayers.filter(p => p.role === 'A'),
    };

    // 4. Inflazione di Mercato
    const currentInflation = calculateMarketInflation(pricedPlayers);

    // 5. Calcolo Market Scarcity (Intelligence Competitiva sui Rivali)
    const roles: Role[] = ['P', 'D', 'C', 'A'];
    const marketScarcity: Record<Role, MarketScarcity> = {
      P: { role: 'P', activeBuyers: 0, remainingTopPlayers: 0, scarcityRatio: 1.0, highestCompetitorBudget: 0 },
      D: { role: 'D', activeBuyers: 0, remainingTopPlayers: 0, scarcityRatio: 1.0, highestCompetitorBudget: 0 },
      C: { role: 'C', activeBuyers: 0, remainingTopPlayers: 0, scarcityRatio: 1.0, highestCompetitorBudget: 0 },
      A: { role: 'A', activeBuyers: 0, remainingTopPlayers: 0, scarcityRatio: 1.0, highestCompetitorBudget: 0 },
    };

    roles.forEach(role => {
      const buyersWithOpenSlots = opponents.filter(team => team.slots[role] > 0);
      const activeBuyers = buyersWithOpenSlots.length;
      const topPlayers = availableByRole[role].filter(p => {
        const cps = scoresMap.get(p.id)?.cps ?? 0;
        return calculateVORP(cps, baselines[role]) > 0.5;
      }).length;

      const highestBudget = buyersWithOpenSlots.length > 0
        ? Math.max(...buyersWithOpenSlots.map(t => t.remainingBudget))
        : 0;

      const ratio = topPlayers > 0 ? Number((activeBuyers / topPlayers).toFixed(2)) : 2.0;

      marketScarcity[role] = {
        role,
        activeBuyers,
        remainingTopPlayers: topPlayers,
        scarcityRatio: ratio,
        highestCompetitorBudget: highestBudget,
      };
    });

    const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const latency = Number((endTime - startTime).toFixed(2));

    return {
      myRoster,
      availablePlayers,
      lostPlayers,
      allPlayers: pricedPlayers,
      opponents,
      marketScarcity,
      remainingBudget,
      spentBudget,
      totalLeagueBudget,
      slotsToFill,
      maxBid,
      currentInflation,
      targetBudgetsBySlot: slotBudgets,
      leagueConfig,
      schedule,
      pairingMatrix,
      lastCalculationLatencyMs: latency,
    };
  }, [pricedPlayers, leagueConfig, schedule, pairingMatrix, slotBudgets, opponents]);

  /**
   * Registra l'acquisto di un giocatore nell'asta live:
   * - Se `isMine` === true: aggiunge il giocatore alla mia rosa ed esegue il rebalancing dinamico del budget.
   * - Se `isMine` === false: lo segna come soffiato da un rivale e aggiorna il tracker dell'avversario.
   */
  const buyPlayer = useCallback(
    (playerId: number, price: number, isMine: boolean = true, buyerId?: string) => {
      setAllPlayers(prev => {
        const targetPlayer = prev.find(p => p.id === playerId);
        if (!targetPlayer) return prev;

        const updatedList = prev.map(p => {
          if (p.id !== playerId) return p;
          if (isMine) {
            return { ...p, boughtFor: price, isLost: false, boughtBy: undefined };
          }
          return { ...p, boughtFor: undefined, isLost: true, boughtBy: buyerId ?? 'Rivale' };
        });

        // Se l'ho comprato io, aggiorna e ribilancia la curva di decadimento del mio budget
        if (isMine) {
          setSlotBudgets(currentAllocations => {
            return rebalanceSlotBudgets(
              currentAllocations,
              targetPlayer.role,
              targetPlayer.slot,
              price,
              updatedList.filter(p => p.boughtFor !== undefined),
              updatedList,
              leagueConfig
            );
          });
        } else {
          // Aggiorna la squadra avversaria acquirente
          setOpponents(prevOpponents => {
            const targetOpponent = prevOpponents.find(o => o.id === buyerId) || prevOpponents[0];
            if (!targetOpponent) return prevOpponents;

            const updatedOpponents = prevOpponents.map(o => {
              if (o.id !== targetOpponent.id) return o;
              const role = targetPlayer.role;
              return {
                ...o,
                remainingBudget: Math.max(0, o.remainingBudget - price),
                spentBudget: o.spentBudget + price,
                slots: {
                  ...o.slots,
                  [role]: Math.max(0, o.slots[role] - 1),
                },
                spentByRole: {
                  ...o.spentByRole,
                  [role]: o.spentByRole[role] + price,
                },
                roster: [...o.roster, { ...targetPlayer, boughtFor: price }],
              };
            });

            persistState(updatedList, leagueConfig, updatedOpponents);
            return updatedOpponents;
          });
        }

        persistState(updatedList, leagueConfig);
        return updatedList;
      });
    },
    [leagueConfig, persistState]
  );

  /**
   * Rinomina una squadra avversaria
   */
  const renameOpponent = useCallback(
    (teamId: string, newName: string) => {
      setOpponents(prev => {
        const updated = prev.map(o => (o.id === teamId ? { ...o, name: newName } : o));
        persistState(allPlayers, leagueConfig, updated);
        return updated;
      });
    },
    [allPlayers, leagueConfig, persistState]
  );

  /**
   * Modifica il prezzo pagato per un calciatore già acquistato in rosa
   */
  const updatePlayerPrice = useCallback(
    (playerId: number, newPrice: number) => {
      setAllPlayers(prev => {
        const targetPlayer = prev.find(p => p.id === playerId);
        if (!targetPlayer || targetPlayer.boughtFor === undefined) return prev;

        const updatedList = prev.map(p => (p.id === playerId ? { ...p, boughtFor: newPrice } : p));

        setSlotBudgets(currentAllocations => {
          return rebalanceSlotBudgets(
            calculateInitialSlotBudgets(leagueConfig),
            targetPlayer.role,
            targetPlayer.slot,
            newPrice,
            updatedList.filter(p => p.boughtFor !== undefined),
            updatedList,
            leagueConfig
          );
        });

        persistState(updatedList, leagueConfig);
        return updatedList;
      });
    },
    [leagueConfig, persistState]
  );

  /**
   * Svincola / Rimuove un calciatore dalla propria rosa o da un avversario
   */
  const releasePlayer = useCallback(
    (playerId: number, refundAmount?: number) => {
      setAllPlayers(prev => {
        const targetPlayer = prev.find(p => p.id === playerId);
        if (!targetPlayer) return prev;

        const updatedList = prev.map(p =>
          p.id === playerId ? { ...p, boughtFor: undefined, isLost: false, boughtBy: undefined } : p
        );

        let newConfig = leagueConfig;

        // Se era in rosa utente
        if (targetPlayer.boughtFor !== undefined) {
          const originalPrice = targetPlayer.boughtFor;
          if (refundAmount !== undefined && refundAmount < originalPrice) {
            const loss = originalPrice - Math.max(0, refundAmount);
            newConfig = {
              ...leagueConfig,
              initialBudget: Math.max(0, leagueConfig.initialBudget - loss),
            };
            setLeagueConfig(newConfig);
          }

          const remainingRoster = updatedList.filter(p => p.boughtFor !== undefined);
          let freshBudgets = calculateInitialSlotBudgets(newConfig);

          for (const bought of remainingRoster) {
            freshBudgets = rebalanceSlotBudgets(
              freshBudgets,
              bought.role,
              bought.slot,
              bought.boughtFor ?? 0,
              remainingRoster,
              updatedList,
              newConfig
            );
          }
          setSlotBudgets(freshBudgets);
        }

        // Se era in rosa di un avversario
        if (targetPlayer.isLost && targetPlayer.boughtBy) {
          setOpponents(prevOpp => {
            return prevOpp.map(o => {
              const inRoster = o.roster.find(p => p.id === playerId);
              if (!inRoster) return o;
              const price = inRoster.boughtFor ?? 0;
              const refund = refundAmount !== undefined ? Math.min(price, Math.max(0, refundAmount)) : price;
              const role = targetPlayer.role;
              return {
                ...o,
                remainingBudget: o.remainingBudget + refund,
                spentBudget: Math.max(0, o.spentBudget - refund),
                slots: {
                  ...o.slots,
                  [role]: Math.min(o.maxSlots[role], o.slots[role] + 1),
                },
                spentByRole: {
                  ...o.spentByRole,
                  [role]: Math.max(0, o.spentByRole[role] - refund),
                },
                roster: o.roster.filter(p => p.id !== playerId),
              };
            });
          });
        }

        persistState(updatedList, newConfig);
        return updatedList;
      });
    },
    [leagueConfig, persistState]
  );

  /**
   * Aggiorna lo stato qualitativo / titolarità di un calciatore (Pannello Admin)
   */
  const updatePlayerStatus = useCallback(
    (playerId: number, updates: Partial<Player>) => {
      setAllPlayers(prev => {
        const updatedList = prev.map(p => {
          if (p.id !== playerId) return p;
          const merged = { ...p, ...updates };

          const xfm = calculateXFM(merged);
          const cps = calculateCPS(merged);

          return {
            ...merged,
            expectedBaseScore: xfm,
            cps,
          };
        });

        persistState(updatedList, leagueConfig);
        return updatedList;
      });
    },
    [leagueConfig, persistState]
  );

  /**
   * Segna un giocatore come soffiato da un rivale
   */
  const markAsLost = useCallback(
    (playerId: number, buyerId?: string) => {
      buyPlayer(playerId, 0, false, buyerId);
    },
    [buyPlayer]
  );

  /**
   * Ottiene i migliori sostituti Nearest-Neighbors (k-NN) e partner di calendario
   */
  const getRecommendationsFor = useCallback(
    (playerId: number): { replacements: ReplacementRecommendation[]; calendarPairings: PairingScore[] } => {
      const targetPlayer = pricedPlayers.find(p => p.id === playerId);
      if (!targetPlayer) {
        return { replacements: [], calendarPairings: [] };
      }

      const scoresMap = calculateAllPlayerScores(pricedPlayers);

      // Prezzi fissi di lega: non dipendono dagli acquisti già fatti
      const targetPriceMap = new Map<number, number>();
      pricedPlayers.forEach(p => targetPriceMap.set(p.id, p.targetPrice ?? p.estPrice ?? 1));

      const cpsOnlyMap = new Map<number, number>();
      scoresMap.forEach((val, key) => cpsOnlyMap.set(key, val.cps));

      const replacements = getNearestNeighborsReplacements(
        targetPlayer,
        advisorState.availablePlayers,
        cpsOnlyMap,
        targetPriceMap,
        3
      );

      const calendarPairings = findBestPairingsForPlayer(
        targetPlayer,
        advisorState.availablePlayers,
        schedule,
        5
      );

      return { replacements, calendarPairings };
    },
    [pricedPlayers, advisorState.availablePlayers, schedule]
  );

  /**
   * Suggerisce chi chiamare al prossimo turno
   */
  const getNextNomination = useCallback(
    (role?: Role, strategy: 'target' | 'bait' = 'target'): NominationRecommendation[] => {
      const baselines = calculateRoleBaselines(pricedPlayers, leagueConfig);

      return getStrategicNominations(
        advisorState.availablePlayers,
        advisorState.myRoster,
        slotBudgets,
        baselines,
        role,
        4
      ).filter(rec => rec.type === strategy);
    },
    [pricedPlayers, advisorState.availablePlayers, advisorState.myRoster, leagueConfig, slotBudgets]
  );

  /**
   * Aggiorna la configurazione della lega
   */
  const updateLeagueConfig = useCallback(
    (newConfig: Partial<LeagueConfig>) => {
      setLeagueConfig(prev => {
        const updated = { ...prev, ...newConfig };
        setSlotBudgets(calculateInitialSlotBudgets(updated));
        if (newConfig.numTeams && newConfig.numTeams !== prev.numTeams) {
          const newOpponents = createInitialOpponents(updated);
          setOpponents(newOpponents);
          persistState(allPlayers, updated, newOpponents);
        } else if (newConfig.initialBudget !== undefined && newConfig.initialBudget !== prev.initialBudget) {
          // Nuovo budget di lega: anche i rivali ripartono dal nuovo budget, al netto di quanto hanno già speso
          const rescaledOpponents = opponents.map(o => ({
            ...o,
            remainingBudget: Math.max(0, updated.initialBudget - o.spentBudget),
          }));
          setOpponents(rescaledOpponents);
          persistState(allPlayers, updated, rescaledOpponents);
        } else {
          persistState(allPlayers, updated);
        }
        return updated;
      });
    },
    [allPlayers, opponents, persistState]
  );

  /**
   * Ripristina il dataset ai dati di fabbrica e la config con cui è stata creata la lega
   */
  const resetToFactoryDataset = useCallback(() => {
    setAllPlayers(REAL_PLAYERS_2026);
    setLeagueConfig(defaultConfig);
    setSlotBudgets(calculateInitialSlotBudgets(defaultConfig));
    setOpponents(createInitialOpponents(defaultConfig));
    if (typeof window !== 'undefined') {
      localStorage.removeItem(storageKey);
    }
  }, [defaultConfig, storageKey]);

  /**
   * Azzera acquisti e perse mantenendo le regole della lega (budget, squadre, slot) e le
   * modifiche fatte al database giocatori.
   */
  const resetAuction = useCallback(() => {
    const clearedPlayers = allPlayers.map(p => ({
      ...p,
      boughtFor: undefined,
      isLost: false,
      boughtBy: undefined,
    }));
    const freshOpponents = createInitialOpponents(leagueConfig);
    setAllPlayers(clearedPlayers);
    setSlotBudgets(calculateInitialSlotBudgets(leagueConfig));
    setOpponents(freshOpponents);
    persistState(clearedPlayers, leagueConfig, freshOpponents);
  }, [allPlayers, leagueConfig, persistState]);

  return {
    state: advisorState,
    buyPlayer,
    renameOpponent,
    updatePlayerPrice,
    releasePlayer,
    updatePlayerStatus,
    markAsLost,
    getRecommendationsFor,
    getNextNomination,
    updateLeagueConfig,
    resetAuction,
    resetToFactoryDataset,
  };
}

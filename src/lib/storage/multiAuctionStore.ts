'use client';

import { LeagueConfig, Player, OpponentTeam } from '@/lib/types';
import { REAL_PLAYERS_2026 } from '@/lib/mock/realDataset2026';
import { createInitialOpponents } from '@/lib/advisor/useAuctionAdvisor';

export interface AuctionSession {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  lastUpdated: string;
  leagueConfig: LeagueConfig;
  allPlayers: Player[];
  myRoster: Player[];
  lostPlayers: Player[];
  opponents: OpponentTeam[];
  remainingBudget: number;
  spentBudget: number;
  history?: any[];
}

const DEFAULT_CONFIG: LeagueConfig = {
  numTeams: 8,
  initialBudget: 500,
  defenseModifier: true,
  slotsPerRole: { P: 3, D: 8, C: 8, A: 6 },
};

const GUEST_MEMORY_STORE = new Map<string, AuctionSession[]>();

function isGuestUser(userId: string): boolean {
  return !userId || userId.startsWith('guest-') || userId === 'guest';
}

function getStorageKey(userId: string): string {
  return `fanta_store_${userId || 'guest'}`;
}

export function createDefaultAuctionSession(userId: string, name = 'Lega Serie A 2026/27', config?: Partial<LeagueConfig>): AuctionSession {
  const mergedConfig: LeagueConfig = { ...DEFAULT_CONFIG, ...config };
  const initialOpponents = createInitialOpponents(mergedConfig);

  return {
    id: `auction_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name,
    userId,
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    leagueConfig: mergedConfig,
    allPlayers: REAL_PLAYERS_2026,
    myRoster: [],
    lostPlayers: [],
    opponents: initialOpponents,
    remainingBudget: mergedConfig.initialBudget,
    spentBudget: 0,
    history: [],
  };
}

export function getUserAuctions(userId: string): AuctionSession[] {
  if (typeof window === 'undefined') return [];

  // Se ospite, usa solo memoria volatile
  if (isGuestUser(userId)) {
    if (!GUEST_MEMORY_STORE.has(userId)) {
      GUEST_MEMORY_STORE.set(userId, [createDefaultAuctionSession(userId, 'Lega Ospite (Demo)')]);
    }
    return GUEST_MEMORY_STORE.get(userId)!;
  }

  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (raw) {
      const parsed: AuctionSession[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Errore lettura MultiAuctionStore:', err);
  }

  // Se vuoto, crea la prima asta di default e salvala
  const defaultAuction = createDefaultAuctionSession(userId);
  saveUserAuctions(userId, [defaultAuction]);
  return [defaultAuction];
}

export function saveUserAuctions(userId: string, auctions: AuctionSession[]): void {
  if (typeof window === 'undefined') return;

  // Se ospite, salva solo in memoria RAM
  if (isGuestUser(userId)) {
    GUEST_MEMORY_STORE.set(userId, auctions);
    return;
  }

  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(auctions));
  } catch (err) {
    console.warn('Errore salvataggio MultiAuctionStore:', err);
  }
}

export function getAuctionById(userId: string, auctionId: string): AuctionSession | null {
  const list = getUserAuctions(userId);
  return list.find(a => a.id === auctionId) || null;
}

export function createAuction(
  userId: string,
  name: string,
  config?: Partial<LeagueConfig>
): AuctionSession {
  const auctions = getUserAuctions(userId);
  const newSession = createDefaultAuctionSession(userId, name, config);
  const updated = [newSession, ...auctions];
  saveUserAuctions(userId, updated);
  return newSession;
}

export function updateAuctionSession(
  userId: string,
  auctionId: string,
  updates: Partial<AuctionSession>
): void {
  const auctions = getUserAuctions(userId);
  const updated = auctions.map(a => {
    if (a.id !== auctionId) return a;
    return {
      ...a,
      ...updates,
      lastUpdated: new Date().toISOString(),
    };
  });
  saveUserAuctions(userId, updated);
}

export function deleteAuction(userId: string, auctionId: string): void {
  const auctions = getUserAuctions(userId);
  const filtered = auctions.filter(a => a.id !== auctionId);
  // Assicura che ci sia sempre almeno 1 asta
  if (filtered.length === 0) {
    filtered.push(createDefaultAuctionSession(userId, 'Nuova Asta Serie A'));
  }
  saveUserAuctions(userId, filtered);
}

export function duplicateAuction(
  userId: string,
  auctionId: string,
  newName?: string
): AuctionSession {
  const source = getAuctionById(userId, auctionId);
  const name = newName || `${source?.name || 'Asta'} (Copia)`;
  const auctions = getUserAuctions(userId);

  const duplicated: AuctionSession = {
    ...(source || createDefaultAuctionSession(userId)),
    id: `auction_${Date.now()}_copy`,
    name,
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  };

  const updated = [duplicated, ...auctions];
  saveUserAuctions(userId, updated);
  return duplicated;
}

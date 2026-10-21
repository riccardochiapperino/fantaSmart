import { Player, LeagueConfig } from '@/lib/types';

export interface TransactionRecord {
  id: string;
  timestamp: string;
  player: Player;
  price: number;
  isMine: boolean;
  buyerId?: string;
}

export interface SavedAuctionState {
  allPlayers: Player[];
  leagueConfig: LeagueConfig;
  history: TransactionRecord[];
  lastUpdated: string;
}

const DEFAULT_STORAGE_KEY = 'fanta_live_auction_2026_v1';

// Memoria volatile per la modalità Ospite (Guest) - ZERO scritture su localStorage
const GUEST_AUCTION_STATE_MAP = new Map<string, SavedAuctionState>();

function getStorageKey(auctionId?: string): string {
  return auctionId ? `fanta_live_auction_v1_${auctionId}` : DEFAULT_STORAGE_KEY;
}

/**
 * Salva in modo sicuro lo stato dell'asta per la singola sessione.
 * In modalità Guest opera al 100% in RAM volatile senza toccare localStorage.
 */
export function saveAuctionState(
  state: SavedAuctionState,
  auctionId?: string,
  isGuest?: boolean
): void {
  if (isGuest) {
    const guestKey = auctionId || 'guest_default';
    GUEST_AUCTION_STATE_MAP.set(guestKey, state);
    return;
  }

  if (typeof window === 'undefined') return;
  try {
    const key = getStorageKey(auctionId);
    const serialized = JSON.stringify(state);
    localStorage.setItem(key, serialized);
  } catch (err) {
    console.warn('Errore durante il salvataggio dello stato dell\'asta in localStorage:', err);
  }
}

/**
 * Carica lo stato dell'asta isolato per sessione
 */
export function loadAuctionState(
  auctionId?: string,
  isGuest?: boolean
): SavedAuctionState | null {
  if (isGuest) {
    const guestKey = auctionId || 'guest_default';
    return GUEST_AUCTION_STATE_MAP.get(guestKey) || null;
  }

  if (typeof window === 'undefined') return null;
  try {
    const key = getStorageKey(auctionId);
    const item = localStorage.getItem(key);
    if (!item) return null;
    return JSON.parse(item) as SavedAuctionState;
  } catch (err) {
    console.warn('Errore durante il caricamento dello stato dell\'asta da localStorage:', err);
    return null;
  }
}

/**
 * Resetta e cancella lo stato dell'asta per la sessione selezionata
 */
export function clearAuctionStorage(auctionId?: string, isGuest?: boolean): void {
  if (isGuest) {
    const guestKey = auctionId || 'guest_default';
    GUEST_AUCTION_STATE_MAP.delete(guestKey);
    return;
  }

  if (typeof window === 'undefined') return;
  try {
    const key = getStorageKey(auctionId);
    localStorage.removeItem(key);
  } catch (err) {
    console.warn('Errore durante la cancellazione del localStorage:', err);
  }
}

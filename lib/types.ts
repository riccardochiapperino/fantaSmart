export type Role = 'P' | 'D' | 'C' | 'A';

export type TacticalRole = 'GK' | 'CB' | 'WB' | 'CM' | 'AM' | 'W' | 'ST' | (string & {});

export interface Player {
    id: number;
    name: string;
    team: string;
    role: Role;
    tacticalRole?: TacticalRole;
    qtA: number;
    fvm: number;
    estPrice: number; // Stima statica del dataset (su budget 500): solo fallback, il prezzo vero è targetPrice
    slot: number;     // 1° - 8° Slot
    slotTier?: number;
    tier?: number;     // Livello qualità (1 = Top, 2 = Semi-Top, 3 = Titolare, 4 = Alternativa, 5 = Scommessa)
    isTitular: boolean;
    titolarita?: number; // Indice titolarità (0.0 -> 1.0, es. 0.85 = 85%)
    expectedBaseScore?: number; // Fantamedia base attesa prima dei bonus (es. 6.2)
    isPenaltyTaker?: boolean;
    penaltyOrder?: 1 | 2 | 3 | null; // Ordine rigorista (1°, 2°, 3° o null)
    penaltyTier?: 0 | 1 | 2 | 3;
    isFreeKicker?: boolean;  // Batte le punizioni
    isCornerTaker?: boolean; // Batte i calci d'angolo
    setPiecesScore?: number;
    injuryRisk?: number;      // Indice rischio infortuni (1 = Solido, 10 = Fragile)
    notes?: string;
    boughtFor?: number; // Se acquistato dall'utente
    isLost?: boolean;   // Se soffiato da un rivale
    boughtBy?: string;  // Nome o ID del rivale che l'ha acquistato
    isDrafted?: boolean;
    draftedPrice?: number;
    draftedByMe?: boolean;
    
    // Calcolati dinamici per Live Auction Advisor
    cps?: number;
    vorp?: number;
    targetPrice?: number;
    starterScore?: number;
}

export type Match = {
    home: string;
    away: string;
};

export type Schedule = Match[][]; // Array di 38 giornate (ognuna da 10 match)

export type TabType = 'home' | 'asta' | 'rosa' | 'campo' | 'sostituto' | 'admin';

// INTERFACCE ADVISOR ENGINE
export interface LeagueConfig {
  numTeams: number;           // Numero di squadre nella lega (es. 8 o 10)
  initialBudget: number;      // Budget iniziale per squadra (es. 500)
  defenseModifier: boolean;   // Modificatore di Difesa attivo (true/false)
  slotsPerRole: Record<Role, number>; // Slot per reparto { P: 3, D: 8, C: 8, A: 6 }
}

export interface Fixture {
  matchday: number;  // Giornata (1-38)
  opponent: string;  // Squadra avversaria (es. "INT")
  isHome: boolean;   // true = Casa, false = Trasferta
  fdr: number;       // Fixture Difficulty Rating (1 = Facile, 5 = Difficilissimo)
}

export interface TeamSchedule {
  team: string;
  fixtures: Fixture[]; // Array di 38 giornate
}

export type ScheduleGrid = Record<string, Fixture[]>;

export interface CalculatedScores {
  xfm: number;              // Expected Fantamedia (inclusi bonus)
  cps: number;              // Composite Player Score
  vorp: number;             // Value Over Replacement Player
  targetPrice: number;      // Prezzo target teorico dinamico
}

export interface SlotBudgetAllocation {
  role: Role;
  slot: number;
  baseTargetPrice: number;
  dynamicTargetPrice: number;
  status: 'open' | 'filled';
  boughtPrice?: number;
  playerId?: number;
}

export interface PairingScore {
  playerA: Player;
  playerB: Player;
  alternationPct: number;    // % alternanza Casa/Trasferta su 38 giornate (0.0 -> 1.0)
  averageMinFdr: number;     // Media di min(FDR_A, FDR_B) su 38 giornate
  compatibilityScore: number; // Punteggio sintetico di compatibilità (più alto è meglio)
  notes: string;
}

export interface ReplacementRecommendation {
  targetPlayer: Player;
  replacement: Player;
  distance: number;          // Distanza euclidea pesata k-NN
  cpsDiff: number;
  priceDiff: number;
  tierDiff: number;
  matchReason: string;
}

export interface NominationRecommendation {
  player: Player;
  type: 'target' | 'bait';
  reason: string;
  estimatedDynamicPrice: number;
  cps: number;
  hypeIndex: number; // Rapporto tra valore nominale (FVM) e CPS reale
}

export interface PairingMatrix {
  goalkeeperAlternation: Record<string, Record<string, number>>; // Percentuale 0-100%
  complementaryFDR: Record<string, Record<string, number>>;      // Indice medio 1.0 - 5.0
}

export interface OpponentTeam {
  id: string;
  name: string;
  remainingBudget: number;
  spentBudget: number;
  slots: Record<Role, number>;       // Slot ancora liberi per reparto
  maxSlots: Record<Role, number>;    // Totale slot per reparto
  spentByRole: Record<Role, number>; // Spesa effettuata per reparto
  roster: Player[];                  // Giocatori acquistati dalla squadra
}

export interface MarketScarcity {
  role: Role;
  activeBuyers: number;       // Numero rivali che cercano ancora titolari (slot 1-3)
  remainingTopPlayers: number;// Giocatori VORP > 0 ancora liberi
  scarcityRatio: number;      // Rapporto acquirenti / top liberi (>1 = alta competitività)
  highestCompetitorBudget: number; // Budget massimo del rivale più ricco con slot aperti
}

export interface AdvisorState {
  myRoster: Player[];
  availablePlayers: Player[];
  lostPlayers: Player[];
  allPlayers: Player[];
  opponents: OpponentTeam[];
  marketScarcity?: Record<Role, MarketScarcity>;
  remainingBudget: number;
  spentBudget: number;
  totalLeagueBudget: number;
  slotsToFill: number;        // Slot della mia rosa ancora da riempire
  maxBid: number;             // Massimo offribile ora: lascia 1 cr per ogni slot ancora vuoto dopo il prossimo
  currentInflation: number;
  targetBudgetsBySlot: Record<Role, SlotBudgetAllocation[]>;
  leagueConfig: LeagueConfig;
  schedule: ScheduleGrid;
  pairingMatrix?: PairingMatrix;
  lastCalculationLatencyMs: number;
}

export interface RecommendedPairing {
  player: Player;
  pairingScore: number;       // Punteggio sintetico 0-100
  alternationPct?: number;    // % Alternanza casa/trasferta se portiere
  fdrAdvantageDays?: number;  // Giornate favorevoli su 38
  isFlankComplement?: boolean;// Bonus se terzino/wingback complementare opposto
  tacticalRole?: string;
  badge: string;             // es. "100% Alternanza", "34/38 FDR Favorevole", "1° Rigorista"
  notes: string;
  partnerPlayer?: Player;
  partnerTeam?: string;
}

export interface RankedMatch extends RecommendedPairing {
  score: number;             // Punteggio composito di complementarietà (0-100, identico a pairingScore)
  qualityScore: number;      // Qualità assoluta normalizzata (0-100)
  calendarSynergy: number;   // Sinergia calendario Casa/Trasferta o FDR (0-100)
  budgetFitness: number;     // Idoneità economica rispetto allo slot residuo (0-100)
  tacticalSynergy: number;   // Sinergia tattica / corsie esterne (0-100)
}
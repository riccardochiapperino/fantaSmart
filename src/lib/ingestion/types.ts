import { Role, TacticalRole } from '@/lib/types';

export interface RawPlayerRecord {
  id: number;
  name: string;
  team: string;
  role: Role;
  qtA: number;
  fvm: number;
  estPrice: number;
  fma?: number;
  rawRole?: string;
  raw?: Record<string, any>;
}

export interface StatusEnrichmentRecord {
  playerName: string;
  teamName?: string;
  starterScore?: number;        // 0.0 (Riserva) -> 1.0 (Inamovibile)
  penaltyTier?: 0 | 1 | 2 | 3;   // 3 = 1° Rigorista, 2 = 2°, 1 = 3°, 0 = No
  isFreeKicker?: boolean;        // Batte le punizioni
  isCornerTaker?: boolean;       // Batte i calci d'angolo
  injuryRisk?: number;          // 1 (Integro) -> 10 (Molto fragile)
  tacticalRole?: TacticalRole;   // Ruolo tattico (WB, AM, ST, ecc.)
  expectedBaseScore?: number;    // Fantamedia base attesa (es. 6.2)
  notes?: string;
}

export type StatusEnrichmentData = StatusEnrichmentRecord[] | Record<string, StatusEnrichmentRecord>;

export interface RawFixtureRecord {
  matchday: number;
  homeTeam: string;
  awayTeam: string;
  homeFdr?: number;
  awayFdr?: number;
}

export interface IngestionOptions {
  playersSource: ArrayBuffer | Buffer | string | any[];
  statusData?: StatusEnrichmentData | string;
  fixturesSource?: ArrayBuffer | Buffer | string | any[];
}

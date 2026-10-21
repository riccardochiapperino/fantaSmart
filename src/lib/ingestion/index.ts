import { Player, Fixture, ScheduleGrid, LeagueConfig, Role } from '@/lib/types';
import { StatusEnrichmentData } from './types';
import { parsePlayersListone } from './excelParser';
import { enrichPlayerRecords } from './statusEnricher';
import { loadFixturesSchedule } from './fixturesLoader';
import {
  MOCK_LEAGUE_CONFIG,
  calculateAllPlayerScores,
  calculateRoleBaselines,
  calculateVORP,
  calculateInitialSlotBudgets,
  calculateDynamicTargetPriceForPlayer,
} from '@/lib/advisor';

export * from './types';
export * from './teamMapper';
export * from './excelParser';
export * from './statusEnricher';
export * from './fixturesLoader';

export interface BuildDatasetOptions {
  playersSource: ArrayBuffer | Buffer | string | any[];
  statusData?: StatusEnrichmentData | string;
  fixturesSource?: ArrayBuffer | Buffer | string | any[];
  config?: Partial<LeagueConfig>;
}

/**
 * Orchestratore principale della pipeline di Ingestion & Normalizzazione Dati.
 * 1. Parsa il listone Excel/CSV
 * 2. Arricchisce i dati con titolarità, rigoristi, piazzati, infortuni (Name + Team matching)
 * 3. Calcola xFM, CPS, VORP e Prezzi Target Dinamici tramite i moduli dell'advisor
 * 4. Carica il calendario 38 giornate e la matrice FDR
 * 5. Restituisce il dataset completo totalmente istanziato per useAuctionAdvisor
 */
export async function buildCompleteDataset(options: BuildDatasetOptions): Promise<{
  players: Player[];
  fixtures: Fixture[];
  schedule: ScheduleGrid;
  leagueConfig: LeagueConfig;
}> {
  // 1. Configurazione Lega con fallback su MOCK_LEAGUE_CONFIG se non fornito
  const leagueConfig: LeagueConfig = {
    ...MOCK_LEAGUE_CONFIG,
    ...(options.config || {}),
  };

  // 2. Parsing Listone Ufficiale (Excel, CSV, JSON)
  const rawPlayers = parsePlayersListone(options.playersSource);

  // 3. Status Enrichment (Qualitativo & Fuzzy Matching su Nome + Squadra)
  let parsedStatusData: StatusEnrichmentData | undefined;
  if (typeof options.statusData === 'string' && (options.statusData.startsWith('{') || options.statusData.startsWith('['))) {
    try {
      parsedStatusData = JSON.parse(options.statusData);
    } catch {
      parsedStatusData = undefined;
    }
  } else if (typeof options.statusData !== 'string') {
    parsedStatusData = options.statusData;
  }

  const enrichedPlayers = enrichPlayerRecords(rawPlayers, parsedStatusData);

  // 4. Calcolo Punteggi Matematici (xFM, CPS, VORP, TargetPrice)
  const scoresMap = calculateAllPlayerScores(enrichedPlayers);
  const baselines = calculateRoleBaselines(enrichedPlayers, leagueConfig);
  const slotBudgets = calculateInitialSlotBudgets(leagueConfig);

  const availableByRole: Record<Role, Player[]> = {
    P: enrichedPlayers.filter(p => p.role === 'P'),
    D: enrichedPlayers.filter(p => p.role === 'D'),
    C: enrichedPlayers.filter(p => p.role === 'C'),
    A: enrichedPlayers.filter(p => p.role === 'A'),
  };

  const finalPlayers: Player[] = enrichedPlayers.map(player => {
    const scoreObj = scoresMap.get(player.id) || { xfm: 6.0, cps: 5.0 };
    const vorp = calculateVORP(scoreObj.cps, baselines[player.role]);
    const openAllocations = slotBudgets[player.role].filter(s => s.status === 'open');

    const targetPrice = calculateDynamicTargetPriceForPlayer(
      player,
      vorp,
      availableByRole[player.role],
      openAllocations,
      scoresMap,
      baselines
    );

    return {
      ...player,
      cps: scoreObj.cps,
      vorp,
      targetPrice,
      starterScore: player.titolarita,
    };
  });

  // 5. Caricamento Calendario 38 Giornate e Matrice FDR
  const { fixtures, schedule } = loadFixturesSchedule(options.fixturesSource);

  return {
    players: finalPlayers,
    fixtures,
    schedule,
    leagueConfig,
  };
}

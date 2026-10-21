import { Player, ScheduleGrid, LeagueConfig, PairingMatrix } from '@/lib/types';
import { REAL_PLAYERS_2026, REAL_SCHEDULE_2026, REAL_PAIRING_MATRIX_2026, REAL_DATASET_2026 } from '@/lib/mock/realDataset2026';

export const MOCK_LEAGUE_CONFIG: LeagueConfig = {
  numTeams: 8,
  initialBudget: 500,
  defenseModifier: true,
  slotsPerRole: {
    P: 3,
    D: 8,
    C: 8,
    A: 6,
  },
};

export const MOCK_PLAYERS: Player[] = REAL_PLAYERS_2026;

export function generateMockSchedule(): ScheduleGrid {
  return REAL_SCHEDULE_2026;
}

export const MOCK_SCHEDULE_GRID: ScheduleGrid = REAL_SCHEDULE_2026;
export const MOCK_PAIRING_MATRIX: PairingMatrix = REAL_PAIRING_MATRIX_2026;
export { REAL_DATASET_2026, REAL_PLAYERS_2026, REAL_SCHEDULE_2026, REAL_PAIRING_MATRIX_2026 };

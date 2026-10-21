import * as XLSX from 'xlsx';
import { Fixture, ScheduleGrid } from '@/lib/types';
import { RawFixtureRecord } from './types';
import { normalizeTeamCode } from './teamMapper';

/**
 * Valutazione forza relativa squadre Serie A 2026/2027 (1 = Debole/Neopromossa, 5 = Top Squadra)
 */
export const DEFAULT_TEAM_STRENGTHS: Record<string, number> = {
  INT: 5,
  MIL: 5,
  JUV: 5,
  NAP: 4,
  ATA: 4,
  ROM: 4,
  LAZ: 4,
  FIO: 4,
  BOL: 3,
  TOR: 3,
  GEN: 3,
  UDI: 3,
  MON: 2,
  CAG: 2,
  EMP: 2,
  VER: 2,
  PAR: 2,
  COM: 2,
  VEN: 1,
  LEC: 2,
  FRO: 1,
  SAS: 2,
  PIS: 1,
  SPE: 1,
  CRE: 1,
  SAM: 1,
};

/**
 * Calcola dinamicamente il Fixture Difficulty Rating (FDR 1-5) per la partita
 */
export function calculateFDR(
  teamCode: string,
  opponentCode: string,
  isHome: boolean,
  teamStrengths: Record<string, number> = DEFAULT_TEAM_STRENGTHS
): number {
  const opponentStrength = teamStrengths[opponentCode] ?? 3;

  if (isHome) {
    // In casa l'avversaria fa meno paura (-0.5 sul rating avversario)
    return Math.max(1, Math.min(5, Math.round(opponentStrength - 0.5)));
  } else {
    // In trasferta la partita è più difficile (+0.5 sul rating avversario)
    return Math.max(1, Math.min(5, Math.round(opponentStrength + 0.5)));
  }
}

/**
 * Carica e normalizza il calendario 38 giornate della Serie A
 */
export function loadFixturesSchedule(
  source?: ArrayBuffer | Buffer | string | any[],
  customTeamStrengths?: Record<string, number>
): { fixtures: Fixture[]; schedule: ScheduleGrid } {
  const teamStrengths = { ...DEFAULT_TEAM_STRENGTHS, ...customTeamStrengths };
  let rawFixtures: RawFixtureRecord[] = [];

  if (!source) {
    // Genera un calendario di default valido se non fornito in input
    return generateDefaultSchedule(teamStrengths);
  }

  if (Array.isArray(source)) {
    rawFixtures = source;
  } else if (typeof source === 'object' && source !== null && (source as any).giornate) {
    const obj = source as any;
    for (const g of obj.giornate) {
      for (const p of g.partite) {
        rawFixtures.push({
          matchday: g.giornata,
          homeTeam: p.casa,
          awayTeam: p.trasferta,
        });
      }
    }
  } else if (typeof source === 'string' && (source.startsWith('[') || source.startsWith('{'))) {
    try {
      const parsed = JSON.parse(source);
      if (Array.isArray(parsed)) {
        rawFixtures = parsed;
      } else if (parsed.giornate && Array.isArray(parsed.giornate)) {
        for (const g of parsed.giornate) {
          for (const p of g.partite) {
            rawFixtures.push({
              matchday: g.giornata,
              homeTeam: p.casa,
              awayTeam: p.trasferta,
            });
          }
        }
      }
    } catch {
      return generateDefaultSchedule(teamStrengths);
    }
  } else {
    try {
      let workbook: XLSX.WorkBook;
      if (typeof source === 'string') {
        if (source.includes('\n') || source.includes(',')) {
          workbook = XLSX.read(source, { type: 'string' });
        } else {
          workbook = XLSX.readFile(source);
        }
      } else if (Buffer.isBuffer(source)) {
        workbook = XLSX.read(source, { type: 'buffer' });
      } else {
        workbook = XLSX.read(source, { type: 'array' });
      }

      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      if (sheet) {
        rawFixtures = XLSX.utils.sheet_to_json<RawFixtureRecord>(sheet);
      }
    } catch {
      return generateDefaultSchedule(teamStrengths);
    }
  }

  if (rawFixtures.length === 0) {
    return generateDefaultSchedule(teamStrengths);
  }

  const allFixtures: Fixture[] = [];
  const scheduleGrid: ScheduleGrid = {};

  for (const raw of rawFixtures) {
    const matchday = Number(raw.matchday || 1);
    const homeTeam = normalizeTeamCode(raw.homeTeam);
    const awayTeam = normalizeTeamCode(raw.awayTeam);

    if (!homeTeam || !awayTeam || homeTeam === 'UNK' || awayTeam === 'UNK') continue;

    const homeFdr = raw.homeFdr ?? calculateFDR(homeTeam, awayTeam, true, teamStrengths);
    const awayFdr = raw.awayFdr ?? calculateFDR(awayTeam, homeTeam, false, teamStrengths);

    // Fixture per la squadra di casa
    const homeFix: Fixture = {
      matchday,
      opponent: awayTeam,
      isHome: true,
      fdr: homeFdr,
    };
    allFixtures.push(homeFix);

    if (!scheduleGrid[homeTeam]) scheduleGrid[homeTeam] = [];
    scheduleGrid[homeTeam].push(homeFix);

    // Fixture per la squadra in trasferta
    const awayFix: Fixture = {
      matchday,
      opponent: homeTeam,
      isHome: false,
      fdr: awayFdr,
    };
    allFixtures.push(awayFix);

    if (!scheduleGrid[awayTeam]) scheduleGrid[awayTeam] = [];
    scheduleGrid[awayTeam].push(awayFix);
  }

  // Ordina giornate per ciascuna squadra
  Object.keys(scheduleGrid).forEach(team => {
    scheduleGrid[team].sort((a, b) => a.matchday - b.matchday);
  });

  return { fixtures: allFixtures, schedule: scheduleGrid };
}

/**
 * Genera un calendario sintetico 38 giornate per le 20 squadre della Serie A
 * in caso di mancanza del file calendario originale.
 */
export function generateDefaultSchedule(
  teamStrengths: Record<string, number> = DEFAULT_TEAM_STRENGTHS
): { fixtures: Fixture[]; schedule: ScheduleGrid } {
  const teams = Object.keys(teamStrengths).slice(0, 20);
  const scheduleGrid: ScheduleGrid = {};
  const allFixtures: Fixture[] = [];

  teams.forEach((team, teamIdx) => {
    const teamFixtures: Fixture[] = [];

    for (let g = 1; g <= 38; g++) {
      const isHome = teamIdx % 2 === 0 ? g % 2 === 1 : g % 2 === 0;
      const opponentIdx = (teamIdx + g) % teams.length;
      const opponent = teams[opponentIdx] || 'INT';

      const fdr = calculateFDR(team, opponent, isHome, teamStrengths);

      const fix: Fixture = {
        matchday: g,
        opponent,
        isHome,
        fdr,
      };

      teamFixtures.push(fix);
      allFixtures.push(fix);
    }

    scheduleGrid[team] = teamFixtures;
  });

  return { fixtures: allFixtures, schedule: scheduleGrid };
}

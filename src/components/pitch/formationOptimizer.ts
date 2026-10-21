import { Player, Role, ScheduleGrid, PairingMatrix } from '@/lib/types';
import { calculateCPS, calculateXFM } from '@/lib/advisor/scoring';

export type SupportedFormation = '3-4-3' | '4-3-3' | '3-5-2' | '4-4-2' | '4-2-3-1' | '3-4-2-1';

export interface FormationStructure {
  formation: SupportedFormation;
  defenders: number;
  midfielders: number;
  attackers: number;
  lines: {
    role: Role;
    count: number;
    label: string;
  }[];
}

export const FORMATIONS: Record<SupportedFormation, FormationStructure> = {
  '3-4-3': {
    formation: '3-4-3',
    defenders: 3,
    midfielders: 4,
    attackers: 3,
    lines: [
      { role: 'P', count: 1, label: 'Portiere' },
      { role: 'D', count: 3, label: 'Difesa a 3' },
      { role: 'C', count: 4, label: 'Centrocampo a 4' },
      { role: 'A', count: 3, label: 'Tridente d\'Attacco' },
    ],
  },
  '4-3-3': {
    formation: '4-3-3',
    defenders: 4,
    midfielders: 3,
    attackers: 3,
    lines: [
      { role: 'P', count: 1, label: 'Portiere' },
      { role: 'D', count: 4, label: 'Difesa a 4' },
      { role: 'C', count: 3, label: 'Centrocampo a 3' },
      { role: 'A', count: 3, label: 'Tridente d\'Attacco' },
    ],
  },
  '3-5-2': {
    formation: '3-5-2',
    defenders: 3,
    midfielders: 5,
    attackers: 2,
    lines: [
      { role: 'P', count: 1, label: 'Portiere' },
      { role: 'D', count: 3, label: 'Difesa a 3' },
      { role: 'C', count: 5, label: 'Centrocampo a 5' },
      { role: 'A', count: 2, label: 'Coppia d\'Attacco' },
    ],
  },
  '4-4-2': {
    formation: '4-4-2',
    defenders: 4,
    midfielders: 4,
    attackers: 2,
    lines: [
      { role: 'P', count: 1, label: 'Portiere' },
      { role: 'D', count: 4, label: 'Difesa a 4' },
      { role: 'C', count: 4, label: 'Centrocampo a 4' },
      { role: 'A', count: 2, label: 'Coppia d\'Attacco' },
    ],
  },
  '4-2-3-1': {
    formation: '4-2-3-1',
    defenders: 4,
    midfielders: 5,
    attackers: 1,
    lines: [
      { role: 'P', count: 1, label: 'Portiere' },
      { role: 'D', count: 4, label: 'Difesa a 4' },
      { role: 'C', count: 5, label: 'Mediana & Trequarti' },
      { role: 'A', count: 1, label: 'Punta Unica' },
    ],
  },
  '3-4-2-1': {
    formation: '3-4-2-1',
    defenders: 3,
    midfielders: 6,
    attackers: 1,
    lines: [
      { role: 'P', count: 1, label: 'Portiere' },
      { role: 'D', count: 3, label: 'Difesa a 3' },
      { role: 'C', count: 6, label: 'Centrocampo & Doppia Trequarti' },
      { role: 'A', count: 1, label: 'Punta Centrale' },
    ],
  },
};

export interface OptimizedTeam {
  formation: SupportedFormation;
  starters: Player[];
  bench: Player[];
  startersByLine: Record<Role, Player[]>;
  totalXFM: number;
  totalCPS: number;
  startersCost: number;
  benchCost: number;
}

export interface RosterAlert {
  id: string;
  type: 'danger' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  suggestion?: string;
}

/**
 * Calcola l'undici titolare ottimale massimizzando il CPS
 */
export function optimizeFormation(
  roster: Player[],
  formationKey: SupportedFormation = '3-4-3'
): OptimizedTeam {
  const structure = FORMATIONS[formationKey] || FORMATIONS['3-4-3'];

  // Separa per ruolo e ordina per CPS decrescente
  const byRole: Record<Role, Player[]> = {
    P: [...roster.filter(p => p.role === 'P')].sort((a, b) => (b.cps ?? calculateCPS(b)) - (a.cps ?? calculateCPS(a))),
    D: [...roster.filter(p => p.role === 'D')].sort((a, b) => (b.cps ?? calculateCPS(b)) - (a.cps ?? calculateCPS(a))),
    C: [...roster.filter(p => p.role === 'C')].sort((a, b) => (b.cps ?? calculateCPS(b)) - (a.cps ?? calculateCPS(a))),
    A: [...roster.filter(p => p.role === 'A')].sort((a, b) => (b.cps ?? calculateCPS(b)) - (a.cps ?? calculateCPS(a))),
  };

  const reqCount: Record<Role, number> = {
    P: 1,
    D: structure.defenders,
    C: structure.midfielders,
    A: structure.attackers,
  };

  const starters: Player[] = [];
  const startersByLine: Record<Role, Player[]> = { P: [], D: [], C: [], A: [] };
  const bench: Player[] = [];

  (['P', 'D', 'C', 'A'] as Role[]).forEach(role => {
    const playersInRole = byRole[role];
    const needed = reqCount[role];

    const selectedStarters = playersInRole.slice(0, needed);
    const selectedBench = playersInRole.slice(needed);

    starters.push(...selectedStarters);
    startersByLine[role] = selectedStarters;
    bench.push(...selectedBench);
  });

  const totalXFM = starters.reduce((sum, p) => sum + (p.expectedBaseScore ?? calculateXFM(p)), 0);
  const totalCPS = starters.reduce((sum, p) => sum + (p.cps ?? calculateCPS(p)), 0);
  const startersCost = starters.reduce((sum, p) => sum + (p.boughtFor ?? 0), 0);
  const benchCost = bench.reduce((sum, p) => sum + (p.boughtFor ?? 0), 0);

  return {
    formation: formationKey,
    starters,
    bench,
    startersByLine,
    totalXFM: Number(totalXFM.toFixed(1)),
    totalCPS: Number(totalCPS.toFixed(1)),
    startersCost,
    benchCost,
  };
}

/**
 * Trova il modulo migliore (Best Formation) che massimizza il CPS totale della rosa
 */
export function findBestFormation(roster: Player[]): OptimizedTeam {
  const allFormations = Object.keys(FORMATIONS) as SupportedFormation[];
  let best = optimizeFormation(roster, '3-4-3');

  for (const form of allFormations) {
    const candidate = optimizeFormation(roster, form);
    if (candidate.totalCPS > best.totalCPS) {
      best = candidate;
    }
  }

  return best;
}

/**
 * Analizza le vulnerabilità e i buchi di copertura nella rosa
 */
export function detectRosterVulnerabilities(
  roster: Player[],
  schedule?: ScheduleGrid,
  pairingMatrix?: PairingMatrix
): RosterAlert[] {
  const alerts: RosterAlert[] = [];

  const goalkeepers = roster.filter(p => p.role === 'P');
  const defenders = roster.filter(p => p.role === 'D');
  const midfielders = roster.filter(p => p.role === 'C');
  const attackers = roster.filter(p => p.role === 'A');

  // 1. Alert Portieri
  if (goalkeepers.length === 1) {
    alerts.push({
      id: 'gk-single',
      type: 'warning',
      title: 'Coppia Portieri Incompleta',
      message: `Hai acquistato solo ${goalkeepers[0].name} (${goalkeepers[0].team}).`,
      suggestion: 'Acquista il 2° portiere con alternanza Casa/Trasferta ≥ 85% per garantire sempre una partita casalinga.',
    });
  } else if (goalkeepers.length >= 2) {
    const g1 = goalkeepers[0];
    const g2 = goalkeepers[1];
    const alt = pairingMatrix?.goalkeeperAlternation?.[g1.team]?.[g2.team] ?? 0.5;
    if (alt >= 0.9) {
      alerts.push({
        id: 'gk-perfect-pair',
        type: 'success',
        title: 'Coppia Portieri Perfetta',
        message: `${g1.team} e ${g2.team} offrono un\'alternanza casa/fuori del ${(alt * 100).toFixed(0)}%.`,
      });
    }
  }

  // 2. Alert Difesa e Modificatore
  const titularDefenders = defenders.filter(d => (d.starterScore ?? d.titolarita ?? 0.6) >= 0.70);
  if (defenders.length >= 4 && titularDefenders.length < 3) {
    alerts.push({
      id: 'def-mod-risk',
      type: 'danger',
      title: 'Modificatore Difesa a Rischio',
      message: `Hai solo ${titularDefenders.length} difensori titolari sicuri su ${defenders.length}.`,
      suggestion: 'Prioritizza almeno un centrale con titolarità ≥80% per non rischiare di giocare in inferiorità numerica.',
    });
  }

  // 3. Alert Attacco
  const titularAttackers = attackers.filter(a => (a.starterScore ?? a.titolarita ?? 0.6) >= 0.65);
  if (attackers.length >= 3 && titularAttackers.length < 2) {
    alerts.push({
      id: 'att-starter-gap',
      type: 'warning',
      title: 'Profondità d\'Attacco Ridotta',
      message: `Solo ${titularAttackers.length} attaccanti hanno titolarità solida (≥65%).`,
      suggestion: 'Punta su una seconda punta titolare o un rigorista di squadra media nei prossimi slot.',
    });
  }

  // 4. Alert Rigoristi e Piazzati
  const penaltyTakers = roster.filter(p => (p.penaltyTier && p.penaltyTier > 0) || p.isPenaltyTaker);
  if (roster.length >= 10 && penaltyTakers.length === 0) {
    alerts.push({
      id: 'no-penalty-takers',
      type: 'warning',
      title: 'Nessun Rigorista in Rosa',
      message: 'Non hai ancora acquistato un 1° o 2° rigorista designato.',
      suggestion: 'I calci di rigore garantiscono +1.5 di xFM: cerca un rigorista a centrocampo o in attacco.',
    });
  }

  return alerts;
}

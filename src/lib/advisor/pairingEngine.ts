import { Player, ScheduleGrid, PairingScore, PairingMatrix, Role } from '@/lib/types';
import { calculateCPS } from './scoring';

/**
 * Calcola la percentuale di alternanza perfetta Casa/Trasferta (Alt ∈ [0, 1]) su 38 giornate
 * tra due squadre di Serie A.
 */
export function calculateGoalkeeperAlternation(
  teamA: string,
  teamB: string,
  schedule: ScheduleGrid
): number {
  const codeA = teamA.toUpperCase();
  const codeB = teamB.toUpperCase();

  if (codeA === codeB) {
    // Stessa squadra = alternanza 100% poiché gioca sempre il portiere di quella squadra
    return 1.0;
  }

  const fixA = schedule[codeA];
  const fixB = schedule[codeB];

  if (!fixA || !fixB || fixA.length === 0 || fixB.length === 0) {
    return 0.5; // Valore predefinito neutrale se calendario assente
  }

  const matchdaysCount = Math.min(38, Math.min(fixA.length, fixB.length));
  let perfectCount = 0;

  for (let g = 0; g < matchdaysCount; g++) {
    const isHomeA = fixA[g].isHome;
    const isHomeB = fixB[g].isHome;

    // Alternanza perfetta quando una gioca in Casa e l'altra in Trasferta
    if (isHomeA !== isHomeB) {
      perfectCount++;
    }
  }

  return Number((perfectCount / matchdaysCount).toFixed(3));
}

/**
 * Calcola l'FDR Complementare (Fixture Difficulty Rating) per Difensori e Centrocampisti
 * su 38 giornate: media di min(FDR_A(g), FDR_B(g)).
 * Più il punteggio è basso, più è facile schierare sempre almeno un giocatore con partita favorevole!
 */
export function calculateComplementaryFDR(
  teamA: string,
  teamB: string,
  schedule: ScheduleGrid
): number {
  const codeA = teamA.toUpperCase();
  const codeB = teamB.toUpperCase();

  const fixA = schedule[codeA];
  const fixB = schedule[codeB];

  if (!fixA || !fixB || fixA.length === 0 || fixB.length === 0) {
    return 3.0; // Valore predefinito FDR medio neutrale
  }

  const matchdaysCount = Math.min(38, Math.min(fixA.length, fixB.length));
  let minFdrSum = 0;

  for (let g = 0; g < matchdaysCount; g++) {
    const fdrA = fixA[g].fdr;
    const fdrB = fixB[g].fdr;

    minFdrSum += Math.min(fdrA, fdrB);
  }

  return Number((minFdrSum / matchdaysCount).toFixed(2));
}

/**
 * Pre-calcola le matrici 20x20 per l'Alternanza Portieri e la Complementarità FDR
 */
export function computePairingMatrix(schedule: ScheduleGrid): PairingMatrix {
  const teams = Object.keys(schedule);
  const goalkeeperAlternation: Record<string, Record<string, number>> = {};
  const complementaryFDR: Record<string, Record<string, number>> = {};

  for (const tA of teams) {
    goalkeeperAlternation[tA] = {};
    complementaryFDR[tA] = {};
    for (const tB of teams) {
      goalkeeperAlternation[tA][tB] = calculateGoalkeeperAlternation(tA, tB, schedule);
      complementaryFDR[tA][tB] = calculateComplementaryFDR(tA, tB, schedule);
    }
  }

  return {
    goalkeeperAlternation,
    complementaryFDR,
  };
}

/**
 * Lookup O(1): Restituisce i migliori portieri liberi ordinati per alternanza casa/trasferta
 * rispetto ai portieri già presenti in rosa.
 */
export function getBestGoalkeeperPairings(
  myTeamCodes: string[],
  availablePlayers: Player[],
  pairingMatrix?: PairingMatrix,
  schedule?: ScheduleGrid,
  limit: number = 8
): PairingScore[] {
  const availableGoalkeepers = availablePlayers.filter(
    p => p.role === 'P' && p.boughtFor === undefined && !p.isLost
  );

  if (availableGoalkeepers.length === 0 || myTeamCodes.length === 0) {
    return [];
  }

  const normalizedMyTeams = myTeamCodes.map(t => t.toUpperCase());

  const scored = availableGoalkeepers.map(gk => {
    const gkTeam = gk.team.toUpperCase();

    // Trova la migliore combinazione con uno dei portieri già in rosa
    let bestAlt = 0;
    let bestFdr = 5.0;
    let partnerTeam = normalizedMyTeams[0];

    for (const myTeam of normalizedMyTeams) {
      let alt = 0.5;
      let fdr = 3.0;

      if (pairingMatrix?.goalkeeperAlternation?.[myTeam]?.[gkTeam] !== undefined) {
        alt = pairingMatrix.goalkeeperAlternation[myTeam][gkTeam];
        fdr = pairingMatrix.complementaryFDR[myTeam][gkTeam] ?? 3.0;
      } else if (schedule) {
        alt = calculateGoalkeeperAlternation(myTeam, gkTeam, schedule);
        fdr = calculateComplementaryFDR(myTeam, gkTeam, schedule);
      }

      if (alt > bestAlt || (alt === bestAlt && fdr < bestFdr)) {
        bestAlt = alt;
        bestFdr = fdr;
        partnerTeam = myTeam;
      }
    }

    const cps = gk.cps ?? calculateCPS(gk);
    const compatibilityScore = Number(((bestAlt * 70) + ((5 - bestFdr) * 20) + (cps * 2)).toFixed(2));

    let notes = '';
    if (bestAlt >= 0.85) {
      notes = `Alternanza Casa/Trasferta eccellente (${(bestAlt * 100).toFixed(0)}%) con ${partnerTeam}`;
    } else if (bestAlt === 1.0) {
      notes = `Alternanza perfetta 100% con ${partnerTeam}`;
    } else {
      notes = `Alternanza ${(bestAlt * 100).toFixed(0)}% con ${partnerTeam} (FDR Min: ${bestFdr})`;
    }

    // Costruisce dummy PlayerA con la squadra partner
    const dummyPlayerA: Player = {
      id: 0,
      name: `Portiere (${partnerTeam})`,
      team: partnerTeam,
      role: 'P',
      qtA: 0,
      fvm: 0,
      estPrice: 0,
      slot: 1,
      tier: 1,
      isTitular: true,
    };

    return {
      playerA: dummyPlayerA,
      playerB: gk,
      alternationPct: bestAlt,
      averageMinFdr: bestFdr,
      compatibilityScore,
      notes,
    };
  });

  return scored.sort((a, b) => b.compatibilityScore - a.compatibilityScore).slice(0, limit);
}

/**
 * Lookup O(1): Restituisce i migliori difensori o centrocampisti liberi ordinati per
 * minimizzazione dell'FDR complementare rispetto ai giocatori già in rosa.
 */
export function getBestOutfieldPairings(
  myTeamCodes: string[],
  role: 'D' | 'C',
  availablePlayers: Player[],
  pairingMatrix?: PairingMatrix,
  schedule?: ScheduleGrid,
  limit: number = 8
): { player: Player; complementaryFdr: number; alternationPct: number; partnerTeam: string; score: number }[] {
  const availableInRole = availablePlayers.filter(
    p => p.role === role && p.boughtFor === undefined && !p.isLost
  );

  if (availableInRole.length === 0 || myTeamCodes.length === 0) {
    return [];
  }

  const normalizedMyTeams = myTeamCodes.map(t => t.toUpperCase());

  const scored = availableInRole.map(player => {
    const playerTeam = player.team.toUpperCase();

    let bestFdr = 5.0;
    let bestAlt = 0.5;
    let partnerTeam = normalizedMyTeams[0];

    for (const myTeam of normalizedMyTeams) {
      let fdr = 3.0;
      let alt = 0.5;

      if (pairingMatrix?.complementaryFDR?.[myTeam]?.[playerTeam] !== undefined) {
        fdr = pairingMatrix.complementaryFDR[myTeam][playerTeam];
        alt = pairingMatrix.goalkeeperAlternation[myTeam][playerTeam] ?? 0.5;
      } else if (schedule) {
        fdr = calculateComplementaryFDR(myTeam, playerTeam, schedule);
        alt = calculateGoalkeeperAlternation(myTeam, playerTeam, schedule);
      }

      if (fdr < bestFdr) {
        bestFdr = fdr;
        bestAlt = alt;
        partnerTeam = myTeam;
      }
    }

    const cps = player.cps ?? calculateCPS(player);
    const fdrAdvantage = Math.max(0, 5 - bestFdr);
    const score = Number(((fdrAdvantage * 25) + (bestAlt * 15) + (cps * 4)).toFixed(2));

    return {
      player,
      complementaryFdr: bestFdr,
      alternationPct: bestAlt,
      partnerTeam,
      score,
    };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

/**
 * Trigger Ricorsivo per singolo calciatore: ordina i giocatori liberi
 * in base al punteggio di compatibilità calendario.
 */
export function findBestPairingsForPlayer(
  player: Player,
  availablePlayers: Player[],
  schedule: ScheduleGrid,
  limit: number = 5
): PairingScore[] {
  const candidates = availablePlayers.filter(p => {
    if (p.id === player.id) return false;
    if (p.boughtFor !== undefined || p.isLost) return false;

    if (player.role === 'P') return p.role === 'P';
    if (player.role === 'D') return p.role === 'D' || p.role === 'C';
    if (player.role === 'C') return p.role === 'C' || p.role === 'D';
    return p.role === 'A';
  });

  const scoredPairings: PairingScore[] = candidates.map(candidate => {
    const alternationPct = calculateGoalkeeperAlternation(player.team, candidate.team, schedule);
    const averageMinFdr = calculateComplementaryFDR(player.team, candidate.team, schedule);
    const candidateCps = calculateCPS(candidate);

    let compatibilityScore = 0;
    let notes = '';

    if (player.role === 'P') {
      compatibilityScore = (alternationPct * 70) + ((5 - averageMinFdr) * 20) + (candidateCps * 2);
      if (alternationPct >= 0.85) {
        notes = `Alternanza Casa/Trasferta eccellente (${(alternationPct * 100).toFixed(0)}%)`;
      } else if (player.team.toUpperCase() === candidate.team.toUpperCase()) {
        notes = `Coppia portieri stessa squadra (${player.team})`;
      } else {
        notes = `Alternanza Casa/Trasferta del ${(alternationPct * 100).toFixed(0)}%`;
      }
    } else {
      const fdrAdvantage = Math.max(0, 5 - averageMinFdr);
      compatibilityScore = (fdrAdvantage * 25) + (alternationPct * 15) + (candidateCps * 4);
      notes = `FDR Minimo Medio: ${averageMinFdr} (Alternanza: ${(alternationPct * 100).toFixed(0)}%)`;
    }

    return {
      playerA: player,
      playerB: candidate,
      alternationPct,
      averageMinFdr,
      compatibilityScore: Number(compatibilityScore.toFixed(2)),
      notes,
    };
  });

  return scoredPairings
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
    .slice(0, limit);
}

// Re-export Roster Completion & Intelligent Pairing Engine
export {
  getDepartmentCompletionMatches,
  getExternalFlankPairings,
} from './rosterCompletionEngine';


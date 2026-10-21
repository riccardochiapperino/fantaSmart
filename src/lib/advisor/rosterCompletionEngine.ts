import {
  Player,
  Role,
  ScheduleGrid,
  PairingMatrix,
  RankedMatch,
  RecommendedPairing,
} from '@/lib/types';
import { calculateCPS } from './scoring';
import {
  calculateGoalkeeperAlternation,
  calculateComplementaryFDR,
} from './pairingEngine';

export type { RecommendedPairing, RankedMatch };


export interface CompletionEngineOptions {
  weights?: {
    quality?: number;
    calendar?: number;
    budget?: number;
    tactical?: number;
  };
}

/**
 * Motore Algoritmico di Roster Completion & Pairing Intelligente
 */
export function getDepartmentCompletionMatches(
  role: Role,
  myRoster: Player[],
  availablePlayers: Player[],
  remainingSlotBudget: number = 20,
  schedule?: ScheduleGrid,
  pairingMatrix?: PairingMatrix,
  limit: number = 4,
  options?: CompletionEngineOptions
): RankedMatch[] {
  const wQuality = options?.weights?.quality ?? 0.35;
  const wCalendar = options?.weights?.calendar ?? 0.35;
  const wBudget = options?.weights?.budget ?? 0.20;
  const wTactical = options?.weights?.tactical ?? 0.10;

  // Calciatori acquistati in questo reparto
  const ownedInRole = myRoster.filter(p => p.role === role && p.boughtFor !== undefined);

  // Calciatori disponibili liberi in questo reparto
  const candidates = availablePlayers.filter(
    p => p.role === role && p.boughtFor === undefined && !p.isLost
  );

  if (candidates.length === 0) return [];

  // Calcolo CPS massimo per normalizzazione Quality
  let maxCpsInRole = 1;
  for (const c of candidates) {
    const cps = c.cps ?? calculateCPS(c);
    if (cps > maxCpsInRole) maxCpsInRole = cps;
  }

  // CASO A: REPARTO VUOTO (0 Calciatori Acquistati) -> Fallback Top Scelte Iniziali
  if (ownedInRole.length === 0) {
    const initialRankings: RankedMatch[] = candidates.map(player => {
      const cps = player.cps ?? calculateCPS(player);
      const price = player.targetPrice || player.estPrice || 1;
      const qualityScore = Number(((cps / maxCpsInRole) * 100).toFixed(1));

      // Rapporto Qualità / Prezzo
      const qpRatio = (cps / Math.max(1, price)) * 10;
      const budgetFit = price <= remainingSlotBudget
        ? Math.max(50, 100 - (Math.abs(price - remainingSlotBudget) / remainingSlotBudget) * 30)
        : Math.max(10, 100 - ((price - remainingSlotBudget) / remainingSlotBudget) * 100);

      const score = Number(((qualityScore * 0.6) + (budgetFit * 0.4)).toFixed(1));

      let badge = 'Top Scelta Iniziale';
      if (player.penaltyOrder === 1 || player.penaltyTier === 3) badge = '🎯 1° Rigorista';
      else if (player.slot === 1) badge = '👑 1° Slot Titolare';
      else if (player.isPenaltyTaker) badge = '🎯 Rigorista';
      else if ((player.titolarita ?? 0.7) >= 0.9) badge = '🛡️ Titolare Fisso';

      return {
        player,
        pairingScore: score,
        score,
        qualityScore,
        calendarSynergy: 50,
        budgetFitness: Number(budgetFit.toFixed(1)),
        tacticalSynergy: 50,
        tacticalRole: player.tacticalRole,
        badge,
        notes: `Target base reparto • CPS ${(cps).toFixed(1)} • Stima ${price} cr`,
      };
    });

    return initialRankings.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  // CASO B: REPARTO ATTIVO (>= 1 Calciatore Acquistato) -> Matching di Complementarietà
  const rankedMatches: RankedMatch[] = candidates.map(player => {
    const playerTeam = player.team.toUpperCase();
    const cps = player.cps ?? calculateCPS(player);
    const targetPrice = player.targetPrice || player.estPrice || 1;

    // 1. Quality Score (0-100)
    const qualityScore = Number(((cps / maxCpsInRole) * 100).toFixed(1));

    // 2. Calendar Synergy (0-100)
    let calendarSynergy = 50;
    let partnerPlayer: Player | undefined;
    let partnerTeam: string | undefined;
    let bestAlt = 0;
    let bestFdr = 5.0;
    let badge = 'Abbinamento Consigliato';

    if (role === 'P') {
      // PORTIERI: Alternanza Casa/Trasferta
      for (const owned of ownedInRole) {
        const ownedTeam = owned.team.toUpperCase();
        let alt = 0.5;

        if (pairingMatrix?.goalkeeperAlternation?.[ownedTeam]?.[playerTeam] !== undefined) {
          alt = pairingMatrix.goalkeeperAlternation[ownedTeam][playerTeam];
        } else if (schedule) {
          alt = calculateGoalkeeperAlternation(ownedTeam, playerTeam, schedule);
        }

        if (alt > bestAlt) {
          bestAlt = alt;
          partnerPlayer = owned;
          partnerTeam = owned.team;
        }
      }

      calendarSynergy = Number((bestAlt * 100).toFixed(1));
      if (player.penaltyOrder === 1 || player.penaltyTier === 3) {
        badge = '🎯 1° Rigorista';
      } else if (bestAlt >= 0.95) {
        badge = '🔒 100% Alternanza';
      } else if (bestAlt >= 0.85) {
        badge = `⚡ ${(bestAlt * 100).toFixed(0)}% Alternanza C/T`;
      } else if (playerTeam === partnerTeam?.toUpperCase()) {
        badge = '🧤 Stessa Squadra (Coppia)';
        calendarSynergy = 100;
      } else {
        badge = `🧤 Alternanza ${(bestAlt * 100).toFixed(0)}%`;
      }
    } else {
      // D / C / A: Riduzione FDR combinato su 38 giornate
      let maxFdrGain = 0;

      for (const owned of ownedInRole) {
        const ownedTeam = owned.team.toUpperCase();
        let fdr = 3.0;
        let alt = 0.5;

        if (pairingMatrix?.complementaryFDR?.[ownedTeam]?.[playerTeam] !== undefined) {
          fdr = pairingMatrix.complementaryFDR[ownedTeam][playerTeam];
          alt = pairingMatrix.goalkeeperAlternation?.[ownedTeam]?.[playerTeam] ?? 0.5;
        } else if (schedule) {
          fdr = calculateComplementaryFDR(ownedTeam, playerTeam, schedule);
          alt = calculateGoalkeeperAlternation(ownedTeam, playerTeam, schedule);
        }

        const fdrGain = Math.max(0, 4.0 - fdr);
        if (fdrGain > maxFdrGain || (fdrGain === maxFdrGain && alt > bestAlt)) {
          maxFdrGain = fdrGain;
          bestFdr = fdr;
          bestAlt = alt;
          partnerPlayer = owned;
          partnerTeam = owned.team;
        }
      }

      // Converti FDR in scala 0-100 (fdr 2.0 = 100, fdr 4.0 = 20)
      calendarSynergy = Number(Math.min(100, Math.max(10, (4.5 - bestFdr) * 40)).toFixed(1));

      const favorableDays = Math.min(38, Math.round(38 - (bestFdr * 4)));
      if (player.penaltyOrder === 1 || player.penaltyTier === 3) {
        badge = '🎯 1° Rigorista';
      } else if (bestFdr <= 2.8) {
        badge = `🔥 ${favorableDays}/38 FDR Favorevole`;
      } else if (bestAlt >= 0.85) {
        badge = `🔄 Incrocio C/T ${(bestAlt * 100).toFixed(0)}%`;
      } else {
        badge = `📅 Incrocio con ${partnerTeam}`;
      }
    }

    // 3. Tactical Synergy (0-100) - Terzini/Corsie & Moduli
    let tacticalSynergy = 50;
    const isFlankPlayer = player.tacticalRole === 'WB' || player.tacticalRole === 'W' || player.slot <= 3;
    const hasOppositeFlankInRoster = ownedInRole.some(p =>
      (p.tacticalRole === 'WB' || p.tacticalRole === 'W') && p.team.toUpperCase() !== playerTeam
    );

    if (role === 'D' && isFlankPlayer && hasOppositeFlankInRoster) {
      tacticalSynergy = 90;
      if (bestAlt >= 0.8) {
        badge = '⚡ Corsia Opposta & Alternanza';
      }
    } else if (player.isPenaltyTaker) {
      tacticalSynergy = 85;
    } else if ((player.titolarita ?? 0.7) >= 0.85) {
      tacticalSynergy = 75;
    }

    // 4. Budget Fitness (0-100)
    let budgetFitness = 50;
    const priceDiff = remainingSlotBudget - targetPrice;

    if (priceDiff >= 0) {
      // Entra perfettamente nel budget pianificato
      budgetFitness = Math.min(100, 70 + (priceDiff / Math.max(1, remainingSlotBudget)) * 30);
    } else {
      // Supera il budget pianificato: penalità
      const deficitRatio = Math.abs(priceDiff) / Math.max(1, remainingSlotBudget);
      budgetFitness = Math.max(10, 70 - (deficitRatio * 60));
    }

    // Formula Punteggio Composito
    const compositeScore = Number(
      (
        qualityScore * wQuality +
        calendarSynergy * wCalendar +
        budgetFitness * wBudget +
        tacticalSynergy * wTactical
      ).toFixed(1)
    );

    let notes = '';
    if (partnerPlayer) {
      notes = `Incrocio ideale con ${partnerPlayer.name} (${partnerTeam}) • Budget fit: ${targetPrice} cr`;
    } else {
      notes = `Target complementare • Prezzo cons: ${targetPrice} cr`;
    }

    const favorableDaysCount = Math.min(38, Math.round(38 - (bestFdr * 4)));

    return {
      player,
      pairingScore: compositeScore,
      score: compositeScore,
      qualityScore,
      calendarSynergy,
      budgetFitness: Number(budgetFitness.toFixed(1)),
      tacticalSynergy,
      alternationPct: bestAlt,
      fdrAdvantageDays: role !== 'P' ? favorableDaysCount : undefined,
      isFlankComplement: role === 'D' && isFlankPlayer && hasOppositeFlankInRoster,
      tacticalRole: player.tacticalRole,
      partnerPlayer,
      partnerTeam,
      badge,
      notes,
    };
  });

  return rankedMatches.sort((a, b) => b.score - a.score).slice(0, limit);
}

/**
 * Pairing specifico per Terzini, Braccetti e Corsie Esterne
 */
export function getExternalFlankPairings(
  myRoster: Player[],
  availablePlayers: Player[],
  schedule?: ScheduleGrid,
  pairingMatrix?: PairingMatrix,
  limit: number = 4
): RankedMatch[] {
  const ownedDefenders = myRoster.filter(p => p.role === 'D' && p.boughtFor !== undefined);
  const availableDefenders = availablePlayers.filter(
    p => p.role === 'D' && p.boughtFor === undefined && !p.isLost
  );

  return getDepartmentCompletionMatches(
    'D',
    ownedDefenders,
    availableDefenders,
    25,
    schedule,
    pairingMatrix,
    limit,
    {
      weights: {
        quality: 0.30,
        calendar: 0.40,
        tactical: 0.20,
        budget: 0.10,
      },
    }
  );
}

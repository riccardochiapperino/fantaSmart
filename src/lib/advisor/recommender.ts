import {
  Player,
  Role,
  SlotBudgetAllocation,
  ReplacementRecommendation,
  NominationRecommendation,
} from '@/lib/types';
import { calculateCPS, calculateAllPlayerScores } from './scoring';
import { calculateVORP } from './vorpEngine';

/**
 * Algoritmo Nearest-Neighbors (k-NN) a peso euclideo per trovare i migliori sostituti
 * diretti quando un target viene acquistato da un rivale.
 * Formula Dist(A, B) = w1 * |CPS_A - CPS_B| + w2 * |TargetPrice_A - TargetPrice_B| + w3 * |Tier_A - Tier_B|
 */
export function getNearestNeighborsReplacements(
  lostPlayer: Player,
  availablePlayers: Player[],
  cpsMap: Map<number, number>,
  targetPriceMap: Map<number, number>,
  k: number = 3
): ReplacementRecommendation[] {
  const lostCps = cpsMap.get(lostPlayer.id) ?? calculateCPS(lostPlayer);
  const lostPrice = targetPriceMap.get(lostPlayer.id) ?? lostPlayer.estPrice;
  const lostTier = lostPlayer.tier ?? 3;

  // Filtra candidati liberi nello stesso ruolo
  const candidates = availablePlayers.filter(p => {
    if (p.id === lostPlayer.id) return false;
    if (p.role !== lostPlayer.role) return false;
    if (p.boughtFor !== undefined || p.isLost) return false;
    return true;
  });

  // Pesi della distanza euclidea
  const w1 = 0.45; // Peso differenziale CPS
  const w2 = 0.35; // Peso differenziale Prezzo Target
  const w3 = 0.20; // Peso differenziale Tier

  const scoredCandidates: ReplacementRecommendation[] = candidates.map(candidate => {
    const candCps = cpsMap.get(candidate.id) ?? calculateCPS(candidate);
    const candPrice = targetPriceMap.get(candidate.id) ?? candidate.estPrice;
    const candTier = candidate.tier ?? 3;

    const cpsDiff = Math.abs(lostCps - candCps);
    const priceDiff = Math.abs(lostPrice - candPrice);
    const tierDiff = Math.abs(lostTier - candTier);

    // Distanza euclidea pesata
    const distance = Number(
      Math.sqrt(
        w1 * Math.pow(cpsDiff * 10, 2) +
        w2 * Math.pow(priceDiff, 2) +
        w3 * Math.pow(tierDiff * 5, 2)
      ).toFixed(3)
    );

    let matchReason = '';
    if (candTier === lostTier && cpsDiff < 0.5) {
      matchReason = 'Stesso Tier e rendimento sovrapponibile';
    } else if (priceDiff <= 2) {
      matchReason = 'Target Price quasi identico';
    } else if (candCps >= lostCps) {
      matchReason = 'CPS superiore a prezzo contenuto';
    } else {
      matchReason = 'Sostituto naturale di reparto';
    }

    return {
      targetPlayer: lostPlayer,
      replacement: candidate,
      distance,
      cpsDiff: Number(cpsDiff.toFixed(2)),
      priceDiff: Number(priceDiff.toFixed(1)),
      tierDiff,
      matchReason,
    };
  });

  return scoredCandidates
    .sort((a, b) => a.distance - b.distance)
    .slice(0, k);
}

/**
 * Genera suggerimenti di chiamata strategica durante l'asta:
 * 1. Chiamata Target: Miglior profilo qualità/prezzo per completare i propri slot aperti.
 * 2. Chiamata Esca/Drenaggio: Giocatori ad alto FVM/hype ma basso CPS reale per far drenare budget ai rivali.
 */
export function getStrategicNominations(
  availablePlayers: Player[],
  myRoster: Player[],
  targetBudgets: Record<Role, SlotBudgetAllocation[]>,
  baselines: Record<Role, number>,
  filterRole?: Role,
  limit: number = 4
): NominationRecommendation[] {
  const scoresMap = calculateAllPlayerScores(availablePlayers);
  const candidates = availablePlayers.filter(p => {
    if (p.boughtFor !== undefined || p.isLost) return false;
    if (filterRole && p.role !== filterRole) return false;

    // Se ho già completato gli slot per quel ruolo, non suggerire chiamate target per quel ruolo
    const myCountInRole = myRoster.filter(r => r.role === p.role).length;
    const openSlotsInRole = targetBudgets[p.role]?.filter(s => s.status === 'open').length || 0;
    if (myCountInRole >= (targetBudgets[p.role]?.length || 8) || openSlotsInRole === 0) {
      return false;
    }

    return true;
  });

  const recommendations: NominationRecommendation[] = [];

  // Trova Chiamate Target (Alta efficienza CPS / Prezzo)
  const targetCandidates = [...candidates]
    .map(p => {
      const scoreObj = scoresMap.get(p.id) || { xfm: 6.0, cps: 5.0 };
      const vorp = calculateVORP(scoreObj.cps, baselines[p.role]);

      // Rapporto Qualità/Prezzo
      const price = p.targetPrice || p.estPrice || 1;
      const efficiency = (vorp * 10 + scoreObj.cps) / price;

      return {
        player: p,
        type: 'target' as const,
        reason: `Alta efficienza (CPS ${scoreObj.cps}, VORP +${vorp.toFixed(1)} a soli ${p.targetPrice || p.estPrice} cr)`,
        estimatedDynamicPrice: p.targetPrice || p.estPrice,
        cps: scoreObj.cps,
        hypeIndex: Number((p.fvm / (scoreObj.cps * 10 || 1)).toFixed(2)),
        efficiency,
      };
    })
    .sort((a, b) => b.efficiency - a.efficiency)
    .slice(0, Math.ceil(limit / 2));

  recommendations.push(...targetCandidates.map(({ efficiency, ...rest }) => rest));

  // Trova Chiamate Esca (Alto FVM/hype ma basso CPS reale o alto rischio infortuni)
  const baitCandidates = [...availablePlayers]
    .filter(p => {
      if (p.boughtFor !== undefined || p.isLost) return false;
      if (filterRole && p.role !== filterRole) return false;
      return true;
    })
    .map(p => {
      const scoreObj = scoresMap.get(p.id) || { xfm: 6.0, cps: 5.0 };

      // Hype Index: Rapporto tra FVM nominale e CPS reale
      const hypeIndex = Number((p.fvm / (scoreObj.cps * 10 || 1)).toFixed(2));

      const injuryRisk = p.injuryRisk ?? 1;
      const titolarita = p.titolarita ?? (p.isTitular ? 0.85 : 0.4);

      // Punteggio Esca: Alto FVM, Alto Prezzo Stimato, ma CPS deludente o Titolarità incerta o Fragilità
      const baitScore = (p.fvm * 0.4) + ((p.targetPrice || p.estPrice) * 0.4) - (scoreObj.cps * 10) + (injuryRisk * 3);

      let reason = `Hype elevato (FVM ${p.fvm}) ma CPS reale basso (${scoreObj.cps})`;
      if (injuryRisk >= 6) {
        reason += ` e alto rischio infortuni (${injuryRisk}/10)`;
      } else if (titolarita < 0.7) {
        reason += ` e titolarità non garantita (${(titolarita * 100).toFixed(0)}%)`;
      }

      return {
        player: p,
        type: 'bait' as const,
        reason,
        estimatedDynamicPrice: p.targetPrice || p.estPrice,
        cps: scoreObj.cps,
        hypeIndex,
        baitScore,
      };
    })
    .sort((a, b) => b.baitScore - a.baitScore)
    .slice(0, Math.floor(limit / 2));

  recommendations.push(...baitCandidates.map(({ baitScore, ...rest }) => rest));

  return recommendations;
}

import { Player, Role, LeagueConfig, SlotBudgetAllocation } from '@/lib/types';
import { calculateAllPlayerScores } from './scoring';

// Ratio decadimento budget per slot (1° slot -> N° slot) per ciascun reparto
export const SLOT_DECAY_CURVES: Record<Role, number[]> = {
  P: [0.70, 0.25, 0.05],
  D: [0.32, 0.22, 0.16, 0.11, 0.08, 0.05, 0.04, 0.02],
  C: [0.35, 0.24, 0.16, 0.10, 0.06, 0.04, 0.03, 0.02],
  A: [0.46, 0.28, 0.14, 0.07, 0.03, 0.02],
};

// Quote budget standard per reparto (Percentuale del budget elastico)
export function getRoleBudgetShares(defenseModifier: boolean): Record<Role, number> {
  if (defenseModifier) {
    return {
      P: 0.08, // +15% boost portieri
      D: 0.18, // +38% boost difensori per Modificatore Difesa
      C: 0.26,
      A: 0.48,
    };
  }
  return {
    P: 0.07,
    D: 0.13,
    C: 0.28,
    A: 0.52,
  };
}

/**
 * Calcola il punteggio CPS del giocatore di rimpiazzo (Baseline) per ogni ruolo.
 * K_r = N_squadre * Slot_r (es. 8 squadre x 8 difensori = 64° giocatore).
 */
export function calculateRoleBaselines(
  players: Player[],
  config: LeagueConfig,
  precomputedScores?: Map<number, { xfm: number; cps: number }>
): Record<Role, number> {
  const scoresMap = precomputedScores ?? calculateAllPlayerScores(players);
  const roles: Role[] = ['P', 'D', 'C', 'A'];
  const baselines: Record<Role, number> = { P: 0, D: 0, C: 0, A: 0 };

  for (const role of roles) {
    const rolePlayers = players.filter(p => p.role === role);
    const sortedScores = rolePlayers
      .map(p => scoresMap.get(p.id)?.cps ?? 0)
      .sort((a, b) => b - a);

    const replacementIndex = Math.max(0, config.numTeams * config.slotsPerRole[role] - 1);
    if (sortedScores.length > 0) {
      baselines[role] = sortedScores[Math.min(replacementIndex, sortedScores.length - 1)] ?? 0;
    } else {
      baselines[role] = 0;
    }
  }

  return baselines;
}

/**
 * Calcola il VORP (Value Over Replacement Player) per un singolo giocatore:
 * VORP_i = max(0, CPS_i - Baseline_r)
 */
export function calculateVORP(playerCps: number, baselineCps: number): number {
  return Math.max(0, Number((playerCps - baselineCps).toFixed(3)));
}

/**
 * Genera l'allocazione teorica del budget per slot (1° -> N° per reparto)
 * considerando il budget iniziale della squadra e il flag Modificatore Difesa.
 */
export function calculateInitialSlotBudgets(config: LeagueConfig): Record<Role, SlotBudgetAllocation[]> {
  const result: Record<Role, SlotBudgetAllocation[]> = {
    P: [],
    D: [],
    C: [],
    A: [],
  };

  const totalSlots = Object.values(config.slotsPerRole).reduce((a, b) => a + b, 0);
  const reservedMinimum = totalSlots * 1; // 1 credito minimo riservato per ogni slot
  const elasticBudget = Math.max(0, config.initialBudget - reservedMinimum);
  const shares = getRoleBudgetShares(config.defenseModifier);

  const roles: Role[] = ['P', 'D', 'C', 'A'];

  for (const role of roles) {
    const numSlots = config.slotsPerRole[role];
    const roleElasticBudget = elasticBudget * shares[role];
    const decayCurve = SLOT_DECAY_CURVES[role] || Array(numSlots).fill(1 / numSlots);

    // Normalizza i pesi del decadimento sulla quantità effettiva di slot
    const curveSum = decayCurve.slice(0, numSlots).reduce((a, b) => a + b, 0);

    for (let s = 1; s <= numSlots; s++) {
      const weight = (decayCurve[s - 1] ?? (1 / numSlots)) / curveSum;
      const allocatedPrice = Math.round(1 + roleElasticBudget * weight);

      result[role].push({
        role,
        slot: s,
        baseTargetPrice: allocatedPrice,
        dynamicTargetPrice: allocatedPrice,
        status: 'open',
      });
    }
  }

  return result;
}

/**
 * Dynamic Budget Rebalancing: Ricalcola i budget residui degli slot aperti a seguito
 * dell'acquisto di un calciatore a un prezzo reale diverso dal target.
 * - Surplus (Delta > 0): redistribuisce il risparmio sugli slot aperti a maggior VORP.
 * - Deficit (Delta < 0): assorbe il sovrapprezzo riducendo i tetti dei riscalzati/ultimi slot.
 */
export function rebalanceSlotBudgets(
  currentAllocations: Record<Role, SlotBudgetAllocation[]>,
  boughtRole: Role,
  boughtSlot: number,
  actualPrice: number,
  myRoster: Player[],
  allPlayers: Player[],
  config: LeagueConfig
): Record<Role, SlotBudgetAllocation[]> {
  // Deep clone
  const updated: Record<Role, SlotBudgetAllocation[]> = {
    P: currentAllocations.P.map(s => ({ ...s })),
    D: currentAllocations.D.map(s => ({ ...s })),
    C: currentAllocations.C.map(s => ({ ...s })),
    A: currentAllocations.A.map(s => ({ ...s })),
  };

  const roleSlots = updated[boughtRole];
  const targetSlotObj = roleSlots.find(s => s.slot === boughtSlot && s.status === 'open') || roleSlots.find(s => s.status === 'open');

  if (!targetSlotObj) return updated;

  const oldTargetPrice = targetSlotObj.dynamicTargetPrice;
  targetSlotObj.status = 'filled';
  targetSlotObj.boughtPrice = actualPrice;

  const delta = oldTargetPrice - actualPrice; // Delta > 0 = Risparmio, Delta < 0 = Sovrapprezzo

  if (delta === 0) return updated;

  // Raccogli tutti gli slot ancora aperti
  const openSlots: SlotBudgetAllocation[] = [];
  const roles: Role[] = ['P', 'D', 'C', 'A'];
  for (const r of roles) {
    for (const s of updated[r]) {
      if (s.status === 'open') {
        openSlots.push(s);
      }
    }
  }

  if (openSlots.length === 0) return updated;

  if (delta > 0) {
    // SURPLUS: Redistribuisci il risparmio proporzionalmente al target price degli slot aperti
    const totalOpenTarget = openSlots.reduce((sum, s) => sum + s.dynamicTargetPrice, 0);
    if (totalOpenTarget > 0) {
      for (const s of openSlots) {
        const share = s.dynamicTargetPrice / totalOpenTarget;
        s.dynamicTargetPrice = Math.max(1, Math.round(s.dynamicTargetPrice + delta * share));
      }
    } else {
      // Distribuzione equa se target totali azzerati
      const equalShare = Math.floor(delta / openSlots.length);
      for (const s of openSlots) {
        s.dynamicTargetPrice += equalShare;
      }
    }
  } else {
    // DEFICIT: Assorbi il deficit riducendo i tetti degli slot ultimi/riserve (dall'ultimo slot N° al 1°)
    let deficitToAbsorb = Math.abs(delta);

    // Ordina slot aperti dal meno prioritario (slot più alto) a quello più prioritario
    const sortedForDeficit = [...openSlots].sort((a, b) => {
      if (a.role === b.role) return b.slot - a.slot; // Slot 8 prima di Slot 1
      const rolePriority: Record<Role, number> = { P: 4, D: 3, C: 2, A: 1 };
      return rolePriority[a.role] - rolePriority[b.role];
    });

    for (const s of sortedForDeficit) {
      if (deficitToAbsorb <= 0) break;
      const reducible = Math.max(0, s.dynamicTargetPrice - 1); // Non scendere mai sotto 1 credito
      const deduction = Math.min(deficitToAbsorb, reducible);
      s.dynamicTargetPrice -= deduction;
      deficitToAbsorb -= deduction;
    }
  }

  return updated;
}

/**
 * Calcola il prezzo target dinamico ideale per ogni calciatore libero sul mercato
 * basandosi sul suo VORP, sulla disponibilità di slot nella mia rosa e sulle variazioni del budget.
 */
export function calculateDynamicTargetPriceForPlayer(
  player: Player,
  playerVorp: number,
  availablePlayersInRole: Player[],
  openSlotAllocationsInRole: SlotBudgetAllocation[],
  scoresMap: Map<number, { xfm: number; cps: number }>,
  baselines: Record<Role, number>
): number {
  if (openSlotAllocationsInRole.length === 0) return 1;

  // Trova lo slot ideale per il calciatore (basato sulla sua posizione di classifica VORP nel reparto)
  const sortedAvailable = [...availablePlayersInRole].sort((a, b) => {
    const cpsA = scoresMap.get(a.id)?.cps ?? 0;
    const cpsB = scoresMap.get(b.id)?.cps ?? 0;
    return cpsB - cpsA;
  });

  const rankInRole = sortedAvailable.findIndex(p => p.id === player.id);
  const targetSlotIdx = rankInRole >= 0 ? Math.min(rankInRole, openSlotAllocationsInRole.length - 1) : 0;
  const slotAllocation = openSlotAllocationsInRole[targetSlotIdx] || openSlotAllocationsInRole[0];

  const basePrice = slotAllocation.dynamicTargetPrice;

  // Calcola somma VORP del reparto disponibile per modulazione fine
  const totalRoleVorp = sortedAvailable.reduce((sum, p) => {
    const cps = scoresMap.get(p.id)?.cps ?? 0;
    return sum + calculateVORP(cps, baselines[player.role]);
  }, 0);

  if (totalRoleVorp <= 0 || playerVorp <= 0) {
    return Math.max(1, basePrice);
  }

  // Modulazione elastica in base al VORP relativo
  const vorpRatio = playerVorp / (totalRoleVorp / sortedAvailable.length);
  const adjustedPrice = Math.max(1, Math.round(basePrice * Math.min(1.4, Math.max(0.6, vorpRatio))));

  return adjustedPrice;
}

// Peso della quotazione di mercato (FVM) rispetto al rendimento atteso (VORP) nel prezzo consigliato.
// L'FVM rappresenta quanto il mercato è disposto a pagare un giocatore, il VORP quanto rende
// rispetto al rimpiazzo: il prezzo di asta dipende da entrambi.
export const PRICE_FVM_WEIGHT = 0.5;

export interface FixedPricing {
  targetPrice: number;
  cps: number;
  vorp: number;
}

/**
 * Prezzo consigliato FISSO di ogni calciatore, stabilito in base alle regole della lega.
 *
 * Dipende SOLO da: budget iniziale, numero di squadre, slot per reparto, modificatore difesa
 * e caratteristiche dei giocatori (FVM, titolarità, rigori, infortuni).
 * NON dipende da acquisti, perse o crediti rimasti: pagare Malen a un prezzo qualsiasi non
 * cambia il prezzo consigliato di Lautaro.
 *
 * Modello: in ogni reparto la lega spende in totale
 *   numSquadre * (budget - 1 credito per slot) * quotaReparto
 * e questo denaro viene ripartito tra i `numSquadre * slot` giocatori che verranno acquistati,
 * in proporzione al loro peso (media tra quota FVM e quota VORP). Ogni giocatore parte da 1 credito.
 */
export function calculateFixedPricing(
  players: Player[],
  config: LeagueConfig
): Map<number, FixedPricing> {
  const result = new Map<number, FixedPricing>();
  const scoresMap = calculateAllPlayerScores(players);
  const baselines = calculateRoleBaselines(players, config, scoresMap);

  const totalSlots = Object.values(config.slotsPerRole).reduce((a, b) => a + b, 0);
  const elasticPerTeam = Math.max(0, config.initialBudget - totalSlots);
  // Nessun giocatore può costare più di quanto una squadra possa spendere lasciando 1 cr agli altri slot
  const maxPrice = Math.max(1, config.initialBudget - Math.max(0, totalSlots - 1));
  const shares = getRoleBudgetShares(config.defenseModifier);
  const roles: Role[] = ['P', 'D', 'C', 'A'];

  for (const role of roles) {
    const pool = players.filter(p => p.role === role);
    if (pool.length === 0) continue;

    const maxFvm = Math.max(1, ...pool.map(p => p.fvm || 0));
    const maxCps = Math.max(0.001, ...pool.map(p => scoresMap.get(p.id)?.cps ?? 0));

    const ranked = pool
      .map(p => {
        const cps = scoresMap.get(p.id)?.cps ?? 0;
        return {
          player: p,
          cps,
          vorp: calculateVORP(cps, baselines[role]),
          rankScore: PRICE_FVM_WEIGHT * ((p.fvm || 0) / maxFvm) + (1 - PRICE_FVM_WEIGHT) * (cps / maxCps),
        };
      })
      .sort((a, b) => b.rankScore - a.rankScore);

    const buyers = Math.max(1, config.numTeams * (config.slotsPerRole[role] ?? 0));
    const top = ranked.slice(0, buyers);
    const sumFvm = top.reduce((s, e) => s + (e.player.fvm || 0), 0);
    const sumVorp = top.reduce((s, e) => s + e.vorp, 0);
    const roleMoney = config.numTeams * elasticPerTeam * shares[role];

    top.forEach(e => {
      const fvmShare = sumFvm > 0 ? (e.player.fvm || 0) / sumFvm : 1 / top.length;
      const vorpShare = sumVorp > 0 ? e.vorp / sumVorp : 1 / top.length;
      const weight = PRICE_FVM_WEIGHT * fvmShare + (1 - PRICE_FVM_WEIGHT) * vorpShare;
      const price = Math.min(maxPrice, Math.max(1, Math.round(1 + roleMoney * weight)));
      result.set(e.player.id, { targetPrice: price, cps: e.cps, vorp: e.vorp });
    });

    // Giocatori fuori dai "comprati attesi": prezzo minimo
    for (const e of ranked.slice(buyers)) {
      result.set(e.player.id, { targetPrice: 1, cps: e.cps, vorp: e.vorp });
    }
  }

  return result;
}

/**
 * Applica a ogni giocatore prezzo consigliato, CPS e VORP calcolati con le regole attuali della lega.
 * Restituisce nuovi oggetti solo quando i valori cambiano.
 */
export function applyFixedPricing(players: Player[], config: LeagueConfig): Player[] {
  const pricing = calculateFixedPricing(players, config);
  return players.map(p => {
    const info = pricing.get(p.id);
    if (!info) return p;
    if (p.targetPrice === info.targetPrice && p.cps === info.cps && p.vorp === info.vorp) return p;
    return { ...p, targetPrice: info.targetPrice, cps: info.cps, vorp: info.vorp };
  });
}

/**
 * Credito massimo che posso offrire per un giocatore: devo lasciare almeno 1 credito
 * per ognuno degli slot ancora da riempire dopo di lui.
 */
export function calculateMaxBid(remainingBudget: number, slotsToFill: number): number {
  return Math.max(0, remainingBudget - Math.max(0, slotsToFill - 1));
}

/**
 * Calcola il tasso di inflazione attuale del mercato d'asta.
 * Ratio > 1.0 significa che la lega sta strapagando i calciatori rispetto alle stime.
 */
export function calculateMarketInflation(allPlayers: Player[]): number {
  const boughtPlayers = allPlayers.filter(p => p.boughtFor !== undefined && p.boughtFor > 0);
  if (boughtPlayers.length === 0) return 1.0;

  const totalSpent = boughtPlayers.reduce((sum, p) => sum + (p.boughtFor ?? 0), 0);
  const totalEst = boughtPlayers.reduce((sum, p) => sum + (p.targetPrice ?? p.estPrice ?? 1), 0);

  if (totalEst <= 0) return 1.0;
  return Number((totalSpent / totalEst).toFixed(2));
}

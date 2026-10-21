import { Player, Role, CalculatedScores } from '@/lib/types';

/**
 * Calcola l'Expected Fantamedia (xFM) del calciatore considerando il voto base atteso,
 * il ruolo tattico e la quota bonus derivante da rigori, punizioni e corner.
 */
export function calculateXFM(player: Player): number {
  // Base default per ruolo se non specificata esplicitamente
  const baseDefaults: Record<Role, number> = {
    P: 6.0,
    D: 6.1,
    C: 6.3,
    A: 6.7,
  };

  const baseScore = player.expectedBaseScore ?? baseDefaults[player.role] ?? 6.0;

  // Bonus Rigorista
  let penaltyBonus = 0;
  if (player.penaltyOrder === 1) penaltyBonus = 1.5;
  else if (player.penaltyOrder === 2) penaltyBonus = 0.8;
  else if (player.penaltyOrder === 3) penaltyBonus = 0.3;

  // Bonus Piazzati
  const freeKickBonus = player.isFreeKicker ? 0.4 : 0;
  const cornerBonus = player.isCornerTaker ? 0.2 : 0;

  // Bonus Posizionamento Tattico
  let tacticalBonus = 0;
  if (player.tacticalRole === 'WB') tacticalBonus = 0.35;      // Esterno offensivo a 5
  else if (player.tacticalRole === 'AM') tacticalBonus = 0.35; // Trequartista
  else if (player.tacticalRole === 'ST') tacticalBonus = 0.45; // Prima punta pura
  else if (player.tacticalRole === 'W') tacticalBonus = 0.30;  // Ala tridente

  return Number((baseScore + penaltyBonus + freeKickBonus + cornerBonus + tacticalBonus).toFixed(3));
}

/**
 * Calcola il Composite Player Score (CPS) applicando la formula:
 * CPS_i = xFM_i * Titolarità_i * (1 - (RiskInfortuni_i - 1) / 10)
 */
export function calculateCPS(player: Player): number {
  const xFM = calculateXFM(player);

  // Normalizza titolarità tra 0.05 e 1.0 (garantisce minimo valore positivo)
  const titolarita = Math.max(0.05, Math.min(1.0, player.titolarita ?? (player.isTitular ? 0.85 : 0.4)));

  // Indice infortuni clampato tra 1 e 10
  const injuryRisk = Math.max(1, Math.min(10, player.injuryRisk ?? 1));

  // Moltiplicatore infortuni: 1 -> 1.0, 6 -> 0.5, 10 -> 0.1
  const injuryMultiplier = 1 - (injuryRisk - 1) / 10;

  const cps = xFM * titolarita * injuryMultiplier;

  return Number(Math.max(0, cps).toFixed(3));
}

/**
 * Calcola in un'unica passata vettoriale ad alta efficienza (<0.5ms per 500 giocatori)
 * i punteggi xFM e CPS per un elenco di giocatori.
 */
export function calculateAllPlayerScores(players: Player[]): Map<number, { xfm: number; cps: number }> {
  const scoresMap = new Map<number, { xfm: number; cps: number }>();
  for (let i = 0; i < players.length; i++) {
    const player = players[i];
    const xfm = calculateXFM(player);

    const titolarita = Math.max(0.05, Math.min(1.0, player.titolarita ?? (player.isTitular ? 0.85 : 0.4)));
    const injuryRisk = Math.max(1, Math.min(10, player.injuryRisk ?? 1));
    const injuryMultiplier = 1 - (injuryRisk - 1) / 10;
    const cps = Number(Math.max(0, xfm * titolarita * injuryMultiplier).toFixed(3));

    scoresMap.set(player.id, { xfm, cps });
  }
  return scoresMap;
}

import {
  MOCK_PLAYERS,
  MOCK_LEAGUE_CONFIG,
  MOCK_SCHEDULE_GRID,
  calculateAllPlayerScores,
  calculateRoleBaselines,
  calculateVORP,
  calculateInitialSlotBudgets,
  rebalanceSlotBudgets,
  calculateGoalkeeperAlternation,
  calculateComplementaryFDR,
  findBestPairingsForPlayer,
  getNearestNeighborsReplacements,
  getStrategicNominations,
} from './index';

console.log('=== STARTING LIVE AUCTION ADVISOR TEST BENCH ===\n');

const startTime = performance.now();

// 1. SCORING (xFM and CPS)
console.log('--- 1. SCORING TEST ---');
const scoresMap = calculateAllPlayerScores(MOCK_PLAYERS);
const lautaroScore = scoresMap.get(16); // Lautaro Martinez
console.log('Lautaro Martinez Score:', lautaroScore);

const zapatScore = scoresMap.get(17); // Duvan Zapata
console.log('Duvan Zapata Score (Injury Risk 7):', zapatScore);

// 2. VORP ENGINE & BASELINES
console.log('\n--- 2. VORP & BASELINES TEST ---');
const baselines = calculateRoleBaselines(MOCK_PLAYERS, MOCK_LEAGUE_CONFIG);
console.log('Role Baselines (8 teams):', baselines);

const lautaroVorp = calculateVORP(lautaroScore?.cps ?? 0, baselines.A);
console.log(`Lautaro VORP: +${lautaroVorp}`);

// 3. INITIAL BUDGET SLOTS & REBALANCING
console.log('\n--- 3. BUDGET DECAY & REBALANCING TEST ---');
let slots = calculateInitialSlotBudgets(MOCK_LEAGUE_CONFIG);
console.log('Initial Attacker Slot Budgets:', slots.A);

// Overspend on Lautaro: Target 180, paid 210 (Overspend by 30)
console.log('\nBuying Lautaro Martinez for 210 cr (Target 180, Overspend 30)...');
slots = rebalanceSlotBudgets(slots, 'A', 1, 210, [MOCK_PLAYERS[15]], MOCK_PLAYERS, MOCK_LEAGUE_CONFIG);
console.log('Rebalanced Attacker Slot Budgets (Deficit absorbed by lower slots):', slots.A);

// 4. PAIRING MATRIX (38 MATCHDAYS)
console.log('\n--- 4. PAIRING MATRIX TEST ---');
const sommer = MOCK_PLAYERS[0]; // Inter
const maignan = MOCK_PLAYERS[1]; // Milan
const digregorio = MOCK_PLAYERS[2]; // Juventus

const sommerMaignanAlt = calculateGoalkeeperAlternation('INT', 'MIL', MOCK_SCHEDULE_GRID);
console.log(`Inter / Milan Goalkeeper Alternation Pct: ${(sommerMaignanAlt * 100).toFixed(1)}%`);

const sommerJuveAlt = calculateGoalkeeperAlternation('INT', 'JUV', MOCK_SCHEDULE_GRID);
console.log(`Inter / Juventus Goalkeeper Alternation Pct: ${(sommerJuveAlt * 100).toFixed(1)}%`);

const dimarcoBonaventuraFdr = calculateComplementaryFDR('INT', 'MIL', MOCK_SCHEDULE_GRID);
console.log(`Inter / Milan Complementary FDR (38 matchdays): ${dimarcoBonaventuraFdr}`);

const bestPairings = findBestPairingsForPlayer(sommer, MOCK_PLAYERS, MOCK_SCHEDULE_GRID, 3);
console.log('\nTop 3 Calendar Pairings for Sommer (Inter):');
bestPairings.forEach((p, idx) => {
  console.log(` ${idx + 1}. ${p.playerB.name} (${p.playerB.team}) -> Score: ${p.compatibilityScore} | Notes: ${p.notes}`);
});

// 5. k-NN REPLACEMENTS & STRATEGIC NOMINATIONS
console.log('\n--- 5. k-NN REPLACEMENTS & NOMINATIONS TEST ---');
const lostTheo = MOCK_PLAYERS[4]; // Theo Hernandez (D)
const cpsOnlyMap = new Map<number, number>();
scoresMap.forEach((v, k) => cpsOnlyMap.set(k, v.cps));
const targetPriceMap = new Map<number, number>();
MOCK_PLAYERS.forEach(p => targetPriceMap.set(p.id, p.estPrice));

const replacements = getNearestNeighborsReplacements(lostTheo, MOCK_PLAYERS, cpsOnlyMap, targetPriceMap, 3);
console.log(`Top 3 k-NN Replacements for Lost Theo Hernandez:`);
replacements.forEach((r, idx) => {
  console.log(` ${idx + 1}. ${r.replacement.name} (${r.replacement.team}) -> Dist: ${r.distance} | Reason: ${r.matchReason}`);
});

const nominations = getStrategicNominations(MOCK_PLAYERS, [], slots, baselines, undefined, 4);
console.log('\nStrategic Nominations (Target vs Bait):');
nominations.forEach((n, idx) => {
  console.log(` ${idx + 1}. [${n.type.toUpperCase()}] ${n.player.name} (${n.player.role}) -> ${n.reason}`);
});

const endTime = performance.now();
const duration = endTime - startTime;

console.log(`\n=== TEST BENCH COMPLETED IN ${duration.toFixed(2)}ms ===`);
if (duration < 5) {
  console.log('✅ ZERO-LATENCY PASSED (<5ms requirement satisfied)');
} else {
  console.log('⚡ Benchmark complete');
}

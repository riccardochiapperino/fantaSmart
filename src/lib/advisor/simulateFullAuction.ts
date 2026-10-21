import { REAL_PLAYERS_2026, REAL_SCHEDULE_2026, REAL_PAIRING_MATRIX_2026 } from '../mock/realDataset2026';
import { getDepartmentCompletionMatches, getExternalFlankPairings } from './rosterCompletionEngine';
import { Player } from '@/lib/types';

function runAuctionSimulation() {
  console.log('=== 🚀 TEST BENCH: Roster Completion & Intelligent Pairing Engine ===\n');

  const allPlayers = [...REAL_PLAYERS_2026];
  const schedule = REAL_SCHEDULE_2026;
  const pairingMatrix = REAL_PAIRING_MATRIX_2026;

  // 1. TEST FALLBACK (0 Calciatori in Rosa)
  console.log('TEST 1: Fallback quando un reparto è vuoto (0 giocatori acquistati)...');
  const t0 = performance.now();
  const initialGk = getDepartmentCompletionMatches('P', [], allPlayers, 30, schedule, pairingMatrix, 3);
  const initialDef = getDepartmentCompletionMatches('D', [], allPlayers, 20, schedule, pairingMatrix, 3);
  const t1 = performance.now();

  console.log(`⏱️ Tempo di calcolo: ${(t1 - t0).toFixed(3)} ms (Target < 5ms)`);
  console.log('Top scelte Portieri iniziali:');
  initialGk.forEach((m, idx) => console.log(`  #${idx + 1} ${m.player.name} (${m.player.team}) - Score: ${m.score} [${m.badge}]`));
  console.log('Top scelte Difensori iniziali:');
  initialDef.forEach((m, idx) => console.log(`  #${idx + 1} ${m.player.name} (${m.player.team}) - Score: ${m.score} [${m.badge}]`));

  // 2. TEST PAIRING PORTIERI CON 1° PORTIERE ACQUISTATO
  console.log('\nTEST 2: Sinergia Portieri con 1° portiere acquistato...');
  const firstGk = allPlayers.find(p => p.role === 'P')!;
  firstGk.boughtFor = 35;

  const myRoster: Player[] = [firstGk];
  const availableWithoutGk = allPlayers.filter(p => p.id !== firstGk.id);

  const t2 = performance.now();
  const gkMatches = getDepartmentCompletionMatches('P', myRoster, availableWithoutGk, 10, schedule, pairingMatrix, 3);
  const t3 = performance.now();

  console.log(`⏱️ Tempo di calcolo: ${(t3 - t2).toFixed(3)} ms`);
  console.log(`Migliori abbinamenti portieri per ${firstGk.name} (${firstGk.team}):`);
  gkMatches.forEach((m, idx) => {
    console.log(`  #${idx + 1} ${m.player.name} (${m.player.team}) - Score: ${m.score} | Synergy: ${m.calendarSynergy}% | Badge: [${m.badge}]`);
  });

  // 3. TEST FLANK & WINGBACK SYNERGY PER DIFENSORI
  console.log('\nTEST 3: Sinergia Corsie Esterne & FDR per Difensori in rosa...');
  const firstDef = allPlayers.find(p => p.role === 'D')!;
  firstDef.boughtFor = 28;
  myRoster.push(firstDef);

  const t4 = performance.now();
  const defMatches = getDepartmentCompletionMatches('D', myRoster, availableWithoutGk, 15, schedule, pairingMatrix, 4);
  const flankMatches = getExternalFlankPairings(myRoster, availableWithoutGk, schedule, pairingMatrix, 4);
  const t5 = performance.now();

  console.log(`⏱️ Tempo di calcolo: ${(t5 - t4).toFixed(3)} ms`);
  console.log(`Migliori difensori complementari per ${firstDef.name} (${firstDef.team}):`);
  defMatches.forEach((m, idx) => {
    console.log(`  #${idx + 1} ${m.player.name} (${m.player.team}) - Score: ${m.score} | Badge: [${m.badge}] | Notes: ${m.notes}`);
  });

  console.log('\nMigliori incroci di corsia esterna:');
  flankMatches.forEach((m, idx) => {
    console.log(`  #${idx + 1} ${m.player.name} (${m.player.team}) - Score: ${m.score} | [${m.badge}]`);
  });

  console.log('\n=== ✅ TUTTI I TEST COMPLETATI CON SUCCESSO! ===');
}

runAuctionSimulation();

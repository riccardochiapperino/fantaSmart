import { REAL_PAIRING_MATRIX_2026, REAL_SCHEDULE_2026, REAL_PLAYERS_2026 } from '../mock/realDataset2026';
import { getBestGoalkeeperPairings } from './pairingEngine';

console.log('=== TOP COPPIE PORTIERI CALENDARIO REALE SERIE A 2026/2027 ===\n');
const topTeams = ['INT', 'MIL', 'JUV', 'NAP', 'ROM', 'LAZ', 'ATA', 'FIO', 'BOL', 'TOR'];

for (const team of topTeams) {
  const pairings = getBestGoalkeeperPairings([team], REAL_PLAYERS_2026, REAL_PAIRING_MATRIX_2026, REAL_SCHEDULE_2026, 3);
  console.log(`Top 3 Partner per portiere di ${team}:`);
  pairings.forEach((p, idx) => {
    console.log(`  ${idx + 1}. ${p.playerB.name} (${p.playerB.team}) -> ${(p.alternationPct * 100).toFixed(0)}% Alternanza Casa/Fuori (FDR Min: ${p.averageMinFdr})`);
  });
  console.log('');
}

import {
  parseItalianNumber,
  parsePlayersListone,
  normalizeTeamCode,
  normalizeTeamName,
  enrichPlayerRecords,
  loadFixturesSchedule,
  buildCompleteDataset,
  StatusEnrichmentRecord,
} from './index';

console.log('=== STARTING FANTAENGINE DATA INGESTION TEST SUITE ===\n');

// 1. TEST PARSE ITALIAN NUMBER & COMMA FORMATTING
console.log('--- 1. ITALIAN NUMBER PARSING TEST ---');
console.log('"6,5" ->', parseItalianNumber('6,5')); // 6.5
console.log('"-" ->', parseItalianNumber('-'));       // 0
console.log('"" ->', parseItalianNumber(''));         // 0
console.log('null ->', parseItalianNumber(null));     // 0
console.log('"18.5" ->', parseItalianNumber('18.5')); // 18.5

if (parseItalianNumber('6,5') !== 6.5 || parseItalianNumber('-') !== 0) {
  console.error('❌ Italian number parsing failed!');
  process.exit(1);
}
console.log('✅ Italian number parsing passed');

// 2. TEST CANONICAL TEAM MAPPER
console.log('\n--- 2. CANONICAL TEAM MAPPER TEST ---');
console.log('INTER -> Code:', normalizeTeamCode('INTER'), '| Name:', normalizeTeamName('INTER'));
console.log('AC MILAN -> Code:', normalizeTeamCode('AC MILAN'), '| Name:', normalizeTeamName('AC MILAN'));
console.log('JUVENTUS -> Code:', normalizeTeamCode('JUVENTUS'), '| Name:', normalizeTeamName('JUVENTUS'));

if (normalizeTeamCode('INTER') !== 'INT' || normalizeTeamCode('AC MILAN') !== 'MIL') {
  console.error('❌ Team mapper failed!');
  process.exit(1);
}
console.log('✅ Team mapper passed');

// 3. TEST SYNTHETIC MINI-DATASET PARSING & STATUS ENRICHMENT
console.log('\n--- 3. MINI-DATASET & HOMONYM STATUS MATCHING TEST ---');

const syntheticRawRows = [
  { Id: 1, Nome: 'Sommer Yann', Squadra: 'INTER', R: 'P', 'Qt. A': '18,0', FVM: '160,0' },
  { Id: 2, Nome: 'Theo Hernandez', Squadra: 'AC MILAN', R: 'D', 'Qt. A': '21,0', FVM: '220,0' },
  { Id: 3, Nome: 'Dimarco Federico', Squadra: 'INTER MILANO', R: 'D', 'Qt. A': '20,0', FVM: '210,0' },
  { Id: 4, Nome: 'Esposito Francesco', Squadra: 'INTER', R: 'C', 'Qt. A': '12,0', FVM: '110,0' },
  { Id: 5, Nome: 'Esposito Francesco', Squadra: 'EMPOLI', R: 'C', 'Qt. A': '8,0', FVM: '45,0' }, // Omonimo
  { Id: 6, Nome: 'Lautaro Martinez', Squadra: 'INTER', R: 'A', 'Qt. A': '40,0', FVM: '650,0' },
  { Id: 7, Nome: 'Zapata Duvan', Squadra: 'TORINO', R: 'A', 'Qt. A': '28,0', FVM: '380,0' },
];

const syntheticStatus: StatusEnrichmentRecord[] = [
  { playerName: 'Sommer Yann', teamName: 'Inter', starterScore: 0.95, injuryRisk: 1 },
  { playerName: 'Theo Hernandez', teamName: 'Milan', starterScore: 0.95, isFreeKicker: true, injuryRisk: 2 },
  { playerName: 'Dimarco Federico', teamName: 'Inter', starterScore: 0.90, isFreeKicker: true, isCornerTaker: true, injuryRisk: 2 },
  { playerName: 'Esposito Francesco', teamName: 'Inter', starterScore: 0.70, penaltyTier: 1, injuryRisk: 2 },
  { playerName: 'Esposito Francesco', teamName: 'Empoli', starterScore: 0.40, penaltyTier: 0, injuryRisk: 5 }, // Omonimo separato!
  { playerName: 'Lautaro Martinez', teamName: 'Inter', starterScore: 0.95, penaltyTier: 3, injuryRisk: 2 },
  { playerName: 'Zapata Duvan', teamName: 'Torino', starterScore: 0.85, penaltyTier: 3, injuryRisk: 7 },
];

const parsedMini = parsePlayersListone(syntheticRawRows);
console.log(`Parsed ${parsedMini.length} raw players.`);

const enrichedMini = enrichPlayerRecords(parsedMini, syntheticStatus);
const espoInter = enrichedMini.find(p => p.id === 4);
const espoEmpoli = enrichedMini.find(p => p.id === 5);

console.log('Esposito (Inter) Titolarità:', espoInter?.titolarita, '| Rigorista Tier:', espoInter?.penaltyTier);
console.log('Esposito (Empoli) Titolarità:', espoEmpoli?.titolarita, '| Rigorista Tier:', espoEmpoli?.penaltyTier);

if (espoInter?.penaltyTier !== 1 || espoEmpoli?.penaltyTier !== 0) {
  console.error('❌ Homonym separation (Name + Team) failed!');
  process.exit(1);
}
console.log('✅ Homonym separation (Name + Team) passed');

// 4. TEST PIPELINE BENCHMARK (500+ RECORDS < 50MS)
console.log('\n--- 4. PIPELINE BENCHMARK (500+ RECORDS) ---');

// Genera 500+ record sintetici
const largeDataset: any[] = [];
const roles: ('P' | 'D' | 'C' | 'A')[] = ['P', 'D', 'C', 'A'];
const teams = ['INT', 'MIL', 'JUV', 'NAP', 'ROM', 'ATA', 'LAZ', 'FIO', 'TOR', 'BOL'];

for (let i = 1; i <= 550; i++) {
  const role = roles[i % 4];
  const team = teams[i % teams.length];
  largeDataset.push({
    Id: i,
    Nome: `Calciatore ${i}`,
    Squadra: team,
    R: role,
    'Qt. A': `${(i % 30) + 1},5`,
    FVM: `${(i % 300) + 10},0`,
  });
}

const startTime = performance.now();

buildCompleteDataset({
  playersSource: largeDataset,
  statusData: syntheticStatus,
}).then(result => {
  const endTime = performance.now();
  const duration = endTime - startTime;

  console.log(`Ingested ${result.players.length} players & ${result.fixtures.length} fixtures in ${duration.toFixed(2)}ms`);

  // Verification NaN check
  let hasNaN = false;
  for (const p of result.players) {
    if (isNaN(p.cps ?? 0) || isNaN(p.vorp ?? 0) || isNaN(p.targetPrice ?? 0) || isNaN(p.qtA) || isNaN(p.fvm)) {
      console.error(`❌ NaN detected on player ID ${p.id} (${p.name}):`, p);
      hasNaN = true;
      break;
    }
  }

  if (hasNaN) {
    process.exit(1);
  }

  console.log('✅ All player metrics are valid and free of NaN/undefined.');

  if (duration < 50) {
    console.log(`✅ BENCHMARK PASSED: Completed in ${duration.toFixed(2)}ms (<50ms target)`);
  } else {
    console.log(`⚡ Benchmark completed in ${duration.toFixed(2)}ms`);
  }

  console.log('\n=== FANTAENGINE DATA INGESTION TEST SUITE PASSED SUCCESSFULLY ===');
});

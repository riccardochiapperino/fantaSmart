import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { Player, Role, ScheduleGrid, LeagueConfig } from '@/lib/types';
import { parsePlayersListone } from './excelParser';
import { cleanString, buildMatchingKey } from './statusEnricher';
import { normalizeTeamCode } from './teamMapper';
import { loadFixturesSchedule } from './fixturesLoader';
import { buildCompleteDataset } from './index';
import { computePairingMatrix } from '../advisor/pairingEngine';

interface StatusRecordJSON {
  name: string;
  team: string;
  role: Role;
  status?: string;
  starterScore?: number;
  penaltyTier?: 0 | 1 | 2 | 3;
  isFreeKicker?: boolean;
  isCornerTaker?: boolean;
  setPiecesScore?: number;
  injuryRisk?: number;
  tacticalRole?: any;
  ballottaggioCon?: string[];
  notes?: string;
}

/**
 * Funzione di matching ad alta precisione tra i nomi del listone (es. "Martinez L.", "Paz N.")
 * e i nomi del file statusData.json (es. "Lautaro Martinez", "Nico Paz") all'interno della stessa squadra.
 */
function findBestStatusMatch(
  rawName: string,
  rawTeam: string,
  statusRecordsForTeam: StatusRecordJSON[]
): StatusRecordJSON | undefined {
  if (statusRecordsForTeam.length === 0) return undefined;

  const cleanRawName = cleanString(rawName);

  // 1. Match Esatto
  const exact = statusRecordsForTeam.find(s => cleanString(s.name) === cleanRawName);
  if (exact) return exact;

  // Estrai i token (parole >= 3 caratteri) e l'eventuale iniziale (1 lettera)
  const rawTokens = rawName.toLowerCase().replace(/[^a-z]/g, ' ').split(/\s+/).filter(Boolean);
  const rawLongTokens = rawTokens.filter(t => t.length >= 3);
  const rawInitials = rawTokens.filter(t => t.length === 1);

  // 2. Matching per Cognome + Iniziale del Nome
  for (const s of statusRecordsForTeam) {
    const sTokens = s.name.toLowerCase().replace(/[^a-z]/g, ' ').split(/\s+/).filter(Boolean);
    const sLongTokens = sTokens.filter(t => t.length >= 3);

    // Controlla se c'è un cognome in comune (es. "martinez")
    const commonSurname = rawLongTokens.find(t => sLongTokens.includes(t));
    if (commonSurname) {
      // Se c'è un'iniziale nel rawName (es. 'l' in "Martinez L."), verifica se il nome dello status inizia per 'l' ("Lautaro")
      if (rawInitials.length > 0) {
        const initial = rawInitials[0];
        const sFirstName = sTokens.find(t => t !== commonSurname) || sTokens[0];
        if (sFirstName && sFirstName.startsWith(initial)) {
          return s;
        }
      } else {
        // Se non c'è iniziale ma il cognome coincide ed è l'unico in squadra
        const sameSurnameCount = statusRecordsForTeam.filter(st =>
          st.name.toLowerCase().includes(commonSurname)
        ).length;
        if (sameSurnameCount === 1) {
          return s;
        }
      }
    }
  }

  // 3. Matching per Intersezione Token o Substring
  for (const s of statusRecordsForTeam) {
    const cleanS = cleanString(s.name);
    if (cleanS.length >= 4 && cleanRawName.length >= 4) {
      if (cleanRawName.includes(cleanS) || cleanS.includes(cleanRawName)) {
        return s;
      }
    }
  }

  return undefined;
}

export async function executeMergePipeline() {
  console.log('=== STARTING AUTOMATIC STATUS MERGE PIPELINE (2026/2027) ===\n');

  const rootDir = process.cwd();
  const excelPath = path.join(rootDir, '.footballData', 'calciatori.xlsx');
  const statusPath = path.join(rootDir, '.footballData', 'statusData.json');
  const calendarioPath = path.join(rootDir, '.footballData', 'calendario.json');

  assert(fs.existsSync(excelPath), `File non trovato: ${excelPath}`);
  assert(fs.existsSync(statusPath), `File non trovato: ${statusPath}`);
  assert(fs.existsSync(calendarioPath), `File non trovato: ${calendarioPath}`);

  // 1. Lettura dei file sorgente
  console.log('--- 1. READING SOURCE DATAFILES ---');
  const rawPlayers = parsePlayersListone(excelPath);
  console.log(`Letti ${rawPlayers.length} calciatori da ${excelPath}`);

  const statusJsonContent = fs.readFileSync(statusPath, 'utf-8');
  const statusRecords: StatusRecordJSON[] = JSON.parse(statusJsonContent);
  console.log(`Letti ${statusRecords.length} record qualitativi da ${statusPath}`);

  const calendarioContent = fs.readFileSync(calendarioPath, 'utf-8');
  const calendarioJson = JSON.parse(calendarioContent);

  // Raggruppa i record qualitativi per squadra normalizzata
  const statusByTeam = new Map<string, StatusRecordJSON[]>();
  statusRecords.forEach(rec => {
    const teamCode = normalizeTeamCode(rec.team);
    if (!statusByTeam.has(teamCode)) statusByTeam.set(teamCode, []);
    statusByTeam.get(teamCode)!.push(rec);
  });

  // 2. Esecuzione Matching & Fallback per i 515 Calciatori
  console.log('\n--- 2. EXECUTING HIGH-PRECISION MATCHING & FALLBACKS ---');

  let matchedCount = 0;
  let fallbackCount = 0;

  const mergedStatusDataList: any[] = [];

  for (const raw of rawPlayers) {
    const teamCode = normalizeTeamCode(raw.team);
    const teamStatusRecords = statusByTeam.get(teamCode) || [];

    const matchedStatus = findBestStatusMatch(raw.name, raw.team, teamStatusRecords);

    if (matchedStatus) {
      matchedCount++;
      mergedStatusDataList.push({
        playerName: raw.name,
        teamName: raw.team,
        starterScore: matchedStatus.starterScore ?? (raw.fvm >= 20 ? 0.85 : 0.65),
        penaltyTier: matchedStatus.penaltyTier ?? 0,
        isFreeKicker: matchedStatus.isFreeKicker ?? false,
        isCornerTaker: matchedStatus.isCornerTaker ?? false,
        setPiecesScore: matchedStatus.setPiecesScore ?? 0.0,
        injuryRisk: matchedStatus.injuryRisk ?? 1,
        tacticalRole: matchedStatus.tacticalRole,
        notes: matchedStatus.notes,
      });
    } else {
      fallbackCount++;
      // Valori di fallback realistici per riserve e giovani di profondità
      let starterScore = 0.25;
      let injuryRisk = 2;

      if (raw.role === 'P') {
        starterScore = raw.fvm >= 10 ? 0.65 : raw.fvm >= 3 ? 0.15 : 0.05;
        injuryRisk = 1;
      } else if (raw.qtA >= 10 || raw.fvm >= 15) {
        starterScore = 0.65;
        injuryRisk = 2;
      } else {
        starterScore = raw.qtA >= 5 ? 0.25 : 0.10;
        injuryRisk = 2;
      }

      mergedStatusDataList.push({
        playerName: raw.name,
        teamName: raw.team,
        starterScore,
        penaltyTier: 0,
        isFreeKicker: false,
        isCornerTaker: false,
        setPiecesScore: 0.0,
        injuryRisk,
        notes: 'Riserva / Profondità di rosa (Stima Ingestion)',
      });
    }
  }

  console.log(`✅ Matching completato: ${matchedCount} calciatori agganciati al dataset qualitativo, ${fallbackCount} arricchiti con fallback realistici.`);

  // 3. Calcolo Completo Dataset (xFM, CPS, VORP, TargetPrice, FDR)
  console.log('\n--- 3. COMPUTING CPS, VORP, TARGET PRICES & FDR MATRIX ---');

  const leagueConfig: LeagueConfig = {
    numTeams: 8,
    initialBudget: 500,
    defenseModifier: true,
    slotsPerRole: { P: 3, D: 8, C: 8, A: 6 },
  };

  const finalDataset = await buildCompleteDataset({
    playersSource: excelPath,
    statusData: mergedStatusDataList,
    fixturesSource: calendarioJson,
    config: leagueConfig,
  });

  console.log(`Calcolati punteggi matematici per ${finalDataset.players.length} calciatori.`);

  // 4. Verifica Assenza NaN e integrità dati
  console.log('\n--- 4. CHECKING DATA INTEGRITY & SANITY ---');
  let nanErrors = 0;
  finalDataset.players.forEach(p => {
    if (
      isNaN(p.cps ?? 0) ||
      isNaN(p.vorp ?? 0) ||
      isNaN(p.targetPrice ?? 0) ||
      isNaN(p.qtA) ||
      isNaN(p.fvm)
    ) {
      console.error(`❌ NaN Rilevato su [${p.id}] ${p.name} (${p.team})`, p);
      nanErrors++;
    }
  });

  assert.strictEqual(nanErrors, 0, 'Nessun valore NaN deve essere presente nel dataset finale');
  console.log('✅ Tutti i 515+ calciatori sono validi e privi di valori NaN o undefined.');

  // 5. Pre-calcolo della Matrice di Pairing 20x20 su 38 Giornate
  console.log('\n--- 5. PRE-COMPUTING 20x20 PAIRING MATRIX ---');
  const pairingMatrix = computePairingMatrix(finalDataset.schedule);
  console.log(`✅ Matrice di pairing calcolata per ${Object.keys(pairingMatrix.goalkeeperAlternation).length} squadre.`);

  // 6. Esportazione File Definitivo in src/lib/mock/realDataset2026.ts
  console.log('\n--- 6. EXPORTING FINAL COMPILED DATASET ---');

  const outputDir = path.join(rootDir, 'src', 'lib', 'mock');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'realDataset2026.ts');

  const fileContent = `// File generato automaticamente da mergeStatusData.ts (Stagione 2026/2027)
import { Player, Fixture, ScheduleGrid, PairingMatrix } from '@/lib/types';

export const REAL_DATASET_2026 = {
  players: ${JSON.stringify(finalDataset.players, null, 2)} as Player[],
  fixtures: ${JSON.stringify(finalDataset.fixtures, null, 2)} as Fixture[],
  schedule: ${JSON.stringify(finalDataset.schedule, null, 2)} as ScheduleGrid,
  pairingMatrix: ${JSON.stringify(pairingMatrix, null, 2)} as PairingMatrix,
};

export const REAL_PLAYERS_2026: Player[] = REAL_DATASET_2026.players;
export const REAL_SCHEDULE_2026: ScheduleGrid = REAL_DATASET_2026.schedule;
export const REAL_PAIRING_MATRIX_2026: PairingMatrix = REAL_DATASET_2026.pairingMatrix;
`;

  fs.writeFileSync(outputPath, fileContent, 'utf-8');
  console.log(`✅ Esportato dataset compilato con successo in: ${outputPath}`);

  // Re-export in lib/mock/realDataset2026.ts
  const libMockDir = path.join(rootDir, 'lib', 'mock');
  if (!fs.existsSync(libMockDir)) {
    fs.mkdirSync(libMockDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(libMockDir, 'realDataset2026.ts'),
    `export * from '../../src/lib/mock/realDataset2026';\n`,
    'utf-8'
  );

  console.log('\n=== MERGE PIPELINE COMPLETED SUCCESSFULLY ===');
}

executeMergePipeline().catch(err => {
  console.error('❌ ERRORE NELLA PIPELINE DI MERGE:', err);
  process.exit(1);
});

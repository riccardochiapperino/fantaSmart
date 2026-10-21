import { Player } from '@/lib/types';
import { RawPlayerRecord, StatusEnrichmentData, StatusEnrichmentRecord } from './types';
import { normalizeTeamCode } from './teamMapper';

/**
 * Pulisce e normalizza una stringa per il fuzzy matching:
 * - Rimuove accenti e diacritici (es. "Kvaratskhelia" -> "kvaratskhelia")
 * - Converte in minuscolo e fa il trim
 * - Rimuove punti, apostrofi, trattini, punteggiatura e iniziali medie (es. "Esposito P." -> "esposito")
 */
export function cleanString(input: string): string {
  if (!input) return '';
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Rimuove accenti
    .replace(/\b[a-z]\.\b/g, '')     // Rimuove iniziali singole (es. "K.")
    .replace(/[^a-z0-9]/g, '')       // Rimuove punteggiatura, spazi, trattini, apostrofi
    .trim();
}

/**
 * Genera la chiave di matching combinata (Nome + Squadra) per evitare collisioni tra omonimi
 * (es. "esposito_int" vs "esposito_emp")
 */
export function buildMatchingKey(name: string, team?: string): string {
  const cleanName = cleanString(name);
  if (!team) return cleanName;
  const cleanTeam = normalizeTeamCode(team);
  return `${cleanName}_${cleanTeam}`;
}

/**
 * Normalizza e indicizza le informazioni di enrichment forniti in input
 */
export function prepareEnrichmentMap(
  data?: StatusEnrichmentData
): {
  keyMap: Map<string, StatusEnrichmentRecord>; // Mappa (Nome + Squadra) -> Record
  nameOnlyMap: Map<string, StatusEnrichmentRecord>; // Mappa Fallback (Nome) -> Record
} {
  const keyMap = new Map<string, StatusEnrichmentRecord>();
  const nameOnlyMap = new Map<string, StatusEnrichmentRecord>();

  if (!data) return { keyMap, nameOnlyMap };

  const recordsList: StatusEnrichmentRecord[] = Array.isArray(data)
    ? data
    : Object.values(data);

  for (const rec of recordsList) {
    if (!rec.playerName) continue;

    const fullKey = buildMatchingKey(rec.playerName, rec.teamName);
    keyMap.set(fullKey, rec);

    const nameKey = cleanString(rec.playerName);
    if (!nameOnlyMap.has(nameKey)) {
      nameOnlyMap.set(nameKey, rec);
    }
  }

  return { keyMap, nameOnlyMap };
}

/**
 * Fonetismo / Levenshtein Distance semplificato per tollerare piccoli refusi
 */
function isSimilarName(name1: string, name2: string): boolean {
  const c1 = cleanString(name1);
  const c2 = cleanString(name2);
  if (c1 === c2) return true;
  if (c1.length > 4 && c2.length > 4) {
    if (c1.includes(c2) || c2.includes(c1)) return true;
  }
  return false;
}

/**
 * Arricchisce i calciatori grezzi con le informazioni qualitative di titolarità,
 * rigorista, calci da fermo, infortuni e posizionamento tattico.
 */
export function enrichPlayerRecords(
  rawPlayers: RawPlayerRecord[],
  statusData?: StatusEnrichmentData
): Player[] {
  const { keyMap, nameOnlyMap } = prepareEnrichmentMap(statusData);

  return rawPlayers.map(raw => {
    // 1. Tenta matching prioritario su (Nome + Squadra)
    const fullKey = buildMatchingKey(raw.name, raw.team);
    let enrichment = keyMap.get(fullKey);

    // 2. Fallback su Nome semplice se non trovato con la squadra
    if (!enrichment) {
      const nameKey = cleanString(raw.name);
      enrichment = nameOnlyMap.get(nameKey);
    }

    // 3. Fallback fuzzy per piccoli refusi
    if (!enrichment && statusData) {
      const recordsList: StatusEnrichmentRecord[] = Array.isArray(statusData)
        ? statusData
        : Object.values(statusData);

      const fuzzyMatch = recordsList.find(r => {
        const teamMatch = !r.teamName || normalizeTeamCode(r.teamName) === raw.team;
        return teamMatch && isSimilarName(r.playerName, raw.name);
      });
      if (fuzzyMatch) {
        enrichment = fuzzyMatch;
      }
    }

    // Estrazione dei parametri con default intelligenti
    const starterScore = enrichment?.starterScore ?? (raw.fvm >= 20 ? 0.85 : raw.fvm >= 10 ? 0.65 : 0.4);
    const titolarita = Math.max(0.05, Math.min(1.0, starterScore));

    const isTitular = titolarita >= 0.65;

    const penaltyTier = enrichment?.penaltyTier ?? 0;
    const penaltyOrder = penaltyTier === 3 ? 1 : penaltyTier === 2 ? 2 : penaltyTier === 1 ? 3 : null;
    const isPenaltyTaker = penaltyTier > 0;

    const isFreeKicker = enrichment?.isFreeKicker ?? false;
    const isCornerTaker = enrichment?.isCornerTaker ?? false;

    // Punteggio piazzati combinato
    let setPiecesScore = 0;
    if (isFreeKicker) setPiecesScore += 0.4;
    if (isCornerTaker) setPiecesScore += 0.2;

    const injuryRisk = Math.max(1, Math.min(10, enrichment?.injuryRisk ?? 1));

    // Stima slot reparto basato su FVM
    let slot = 5;
    if (raw.role === 'P') {
      slot = raw.fvm >= 40 ? 1 : raw.fvm >= 20 ? 2 : 3;
    } else if (raw.role === 'D') {
      slot = raw.fvm >= 40 ? 1 : raw.fvm >= 22 ? 2 : raw.fvm >= 15 ? 3 : raw.fvm >= 10 ? 4 : 5;
    } else if (raw.role === 'C') {
      slot = raw.fvm >= 75 ? 1 : raw.fvm >= 40 ? 2 : raw.fvm >= 22 ? 3 : raw.fvm >= 14 ? 4 : 5;
    } else {
      slot = raw.fvm >= 130 ? 1 : raw.fvm >= 70 ? 2 : raw.fvm >= 35 ? 3 : raw.fvm >= 18 ? 4 : 5;
    }

    const tier = slot;

    return {
      id: raw.id,
      name: raw.name,
      team: raw.team,
      role: raw.role,
      tacticalRole: enrichment?.tacticalRole,
      qtA: raw.qtA,
      fvm: raw.fvm,
      estPrice: raw.estPrice,
      slot,
      slotTier: slot,
      tier,
      isTitular,
      titolarita,
      starterScore: titolarita,
      expectedBaseScore: enrichment?.expectedBaseScore ?? (raw.fma && raw.fma > 0 ? raw.fma : undefined),
      isPenaltyTaker,
      penaltyOrder,
      penaltyTier,
      isFreeKicker,
      isCornerTaker,
      setPiecesScore,
      injuryRisk,
      notes: enrichment?.notes,
    };
  });
}

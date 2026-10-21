export interface TeamInfo {
  code: string;  // Codice a 3 lettere canonico (es. "INT")
  name: string;  // Nome esteso canonico (es. "Inter")
  aliases: string[]; // Variazioni e abbreviazioni
}

export const CANONICAL_TEAMS: Record<string, TeamInfo> = {
  INT: { code: 'INT', name: 'Inter', aliases: ['INTER', 'INTER MILANO', 'INT', 'FC INTER'] },
  MIL: { code: 'MIL', name: 'Milan', aliases: ['MILAN', 'AC MILAN', 'MIL'] },
  JUV: { code: 'JUV', name: 'Juventus', aliases: ['JUVENTUS', 'JUVE', 'JUV'] },
  NAP: { code: 'NAP', name: 'Napoli', aliases: ['NAPOLI', 'NAP', 'SSC NAPOLI'] },
  ROM: { code: 'ROM', name: 'Roma', aliases: ['ROMA', 'ROM', 'AS ROMA'] },
  ATA: { code: 'ATA', name: 'Atalanta', aliases: ['ATALANTA', 'ATA', 'ATALANTA BC'] },
  LAZ: { code: 'LAZ', name: 'Lazio', aliases: ['LAZIO', 'LAZ', 'SS LAZIO'] },
  FIO: { code: 'FIO', name: 'Fiorentina', aliases: ['FIORENTINA', 'FIO', 'ACF FIORENTINA'] },
  TOR: { code: 'TOR', name: 'Torino', aliases: ['TORINO', 'TOR', 'TORINO FC'] },
  BOL: { code: 'BOL', name: 'Bologna', aliases: ['BOLOGNA', 'BOL', 'BOLOGNA FC'] },
  EMP: { code: 'EMP', name: 'Empoli', aliases: ['EMPOLI', 'EMP', 'EMPOLI FC'] },
  VER: { code: 'VER', name: 'Verona', aliases: ['VERONA', 'HELLAS VERONA', 'VER', 'HELLAS'] },
  MON: { code: 'MON', name: 'Monza', aliases: ['MONZA', 'MON', 'AC MONZA'] },
  CAG: { code: 'CAG', name: 'Cagliari', aliases: ['CAGLIARI', 'CAG', 'CAGLIARI CALCIO'] },
  UDI: { code: 'UDI', name: 'Udinese', aliases: ['UDINESE', 'UDI', 'UDINESE CALCIO'] },
  PAR: { code: 'PAR', name: 'Parma', aliases: ['PARMA', 'PAR', 'PARMA CALCIO'] },
  COM: { code: 'COM', name: 'Como', aliases: ['COMO', 'COM', 'COMO 1907'] },
  VEN: { code: 'VEN', name: 'Venezia', aliases: ['VENEZIA', 'VEN', 'VENEZIA FC'] },
  GEN: { code: 'GEN', name: 'Genoa', aliases: ['GENOA', 'GEN', 'GENOA CFC'] },
  LEC: { code: 'LEC', name: 'Lecce', aliases: ['LECCE', 'LEC', 'US LECCE'] },
  FRO: { code: 'FRO', name: 'Frosinone', aliases: ['FROSINONE', 'FRO'] },
  SAS: { code: 'SAS', name: 'Sassuolo', aliases: ['SASSUOLO', 'SAS'] },
  PIS: { code: 'PIS', name: 'Pisa', aliases: ['PISA', 'PIS'] },
  SPE: { code: 'SPE', name: 'Spezia', aliases: ['SPEZIA', 'SPE'] },
  CRE: { code: 'CRE', name: 'Cremonese', aliases: ['CREMONESE', 'CRE'] },
  SAM: { code: 'SAM', name: 'Sampdoria', aliases: ['SAMPDORIA', 'SAM'] },
};

/**
 * Pulisce e normalizza una stringa di nome/sigla squadra
 */
function cleanTeamString(input: string): string {
  return (input || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Rimuove accenti
    .replace(/[^A-Z0-9]/g, '')      // Rimuove spazi, punti, trattini
    .trim();
}

// Mappa pre-calcolata per lookup veloce O(1)
const SEARCH_MAP: Record<string, TeamInfo> = {};

Object.values(CANONICAL_TEAMS).forEach(info => {
  SEARCH_MAP[cleanTeamString(info.code)] = info;
  SEARCH_MAP[cleanTeamString(info.name)] = info;
  info.aliases.forEach(alias => {
    SEARCH_MAP[cleanTeamString(alias)] = info;
  });
});

/**
 * Restituisce il codice a 3 lettere canonico (es. "INTER" -> "INT")
 */
export function normalizeTeamCode(teamStr: string): string {
  if (!teamStr) return 'UNK';
  const clean = cleanTeamString(teamStr);
  const found = SEARCH_MAP[clean];
  if (found) return found.code;

  // Fallback: prime 3 lettere in maiuscolo
  return clean.slice(0, 3) || 'UNK';
}

/**
 * Restituisce il nome esteso canonico (es. "INT" -> "Inter")
 */
export function normalizeTeamName(teamStr: string): string {
  if (!teamStr) return 'Sconosciuta';
  const clean = cleanTeamString(teamStr);
  const found = SEARCH_MAP[clean];
  if (found) return found.name;

  // Fallback: prima lettera maiuscola
  const rawClean = teamStr.trim();
  return rawClean.charAt(0).toUpperCase() + rawClean.slice(1).toLowerCase();
}

/**
 * Restituisce l'oggetto TeamInfo completo
 */
export function getTeamInfo(teamStr: string): TeamInfo {
  const code = normalizeTeamCode(teamStr);
  const name = normalizeTeamName(teamStr);
  return CANONICAL_TEAMS[code] || { code, name, aliases: [teamStr] };
}

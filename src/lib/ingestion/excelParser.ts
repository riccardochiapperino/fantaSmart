import * as XLSX from 'xlsx';
import { Role } from '@/lib/types';
import { RawPlayerRecord } from './types';
import { normalizeTeamCode } from './teamMapper';

/**
 * Converte in modo sicuro qualsiasi input numerico (inclusi numeri italiani con virgola "6,5",
 * trattini "-", stringhe vuote o null/undefined) in un number valido senza produrre mai NaN.
 */
export function parseItalianNumber(val: any, fallback: number = 0): number {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'number') {
    return isNaN(val) || !isFinite(val) ? fallback : val;
  }

  const str = String(val).trim();
  if (str === '' || str === '-' || str === '--' || str === 'N/D' || str === 'nd') {
    return fallback;
  }

  // Sostituisce la virgola italiana con il punto decimale
  const normalizedStr = str.replace(',', '.').replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(normalizedStr);

  if (isNaN(parsed) || !isFinite(parsed)) {
    return fallback;
  }
  return parsed;
}

/**
 * Mappatura flessibile degli header del file Excel/CSV per tollerare le variazioni
 * dei file ufficiali Fantacalcio (es. "Qt. A", "Qt.A", "FVM", "Id", "Nome", ecc.)
 */
const COLUMN_ALIASES = {
  id: ['Id', 'ID', 'Codice', 'id', 'Code'],
  name: ['Nome', 'Calciatore', 'Giocatore', 'Player', 'name'],
  team: ['Squadra', 'Club', 'Team', 'team'],
  role: ['R', 'Ruolo', 'Role', 'role'],
  qtA: ['Qt. A', 'Qt.A', 'Qt', 'Quotazione', 'Prezzo', 'fvm', 'qtA'],
  fvm: ['FVM', 'FVM M', 'FvM', 'fvm', 'Qt. A', 'Qt.A'],
  fma: ['FMA', 'FM', 'Fantamedia', 'Media', 'fma'],
};

/**
 * Trova il valore della colonna corrispondente cercando negli alias supportati
 */
function getColumnValue(row: Record<string, any>, aliases: string[]): any {
  for (const alias of aliases) {
    if (row[alias] !== undefined && row[alias] !== null) {
      return row[alias];
    }

    // Ricerca case-insensitive sulle chiavi dell'oggetto riga
    const matchingKey = Object.keys(row).find(
      k => k.trim().toLowerCase() === alias.trim().toLowerCase()
    );
    if (matchingKey && row[matchingKey] !== undefined && row[matchingKey] !== null) {
      return row[matchingKey];
    }
  }
  return undefined;
}

/**
 * Valida e normalizza il ruolo nel formato standard 'P' | 'D' | 'C' | 'A'
 */
export function normalizeRole(rawRole: any): Role | null {
  if (!rawRole) return null;
  const str = String(rawRole).trim().toUpperCase();
  if (str === 'P' || str === 'POR' || str === 'PORTIERE') return 'P';
  if (str === 'D' || str === 'DIF' || str === 'DIFENSORE') return 'D';
  if (str === 'C' || str === 'CEN' || str === 'CENTROCAMPISTA') return 'C';
  if (str === 'A' || str === 'ATT' || str === 'ATTACCANTE') return 'A';
  return null;
}

/**
 * Parser universale per file Excel (.xlsx, .xls), file CSV o array di oggetti già parsati.
 */
export function parsePlayersListone(
  source: ArrayBuffer | Buffer | string | any[]
): RawPlayerRecord[] {
  let rawRows: Record<string, any>[] = [];

  if (Array.isArray(source)) {
    // Array di oggetti già parsati
    rawRows = source;
  } else if (typeof source === 'string' && (source.startsWith('[') || source.startsWith('{'))) {
    // JSON String
    try {
      rawRows = JSON.parse(source);
    } catch {
      rawRows = [];
    }
  } else {
    // Parsing tramite libreria XLSX (supporta Buffer, ArrayBuffer, o file path string)
    let workbook: XLSX.WorkBook;
    if (typeof source === 'string') {
      // Se è un percorso di file sul filesystem server-side o contenuto CSV
      if (source.includes('\n') || source.includes(',')) {
        workbook = XLSX.read(source, { type: 'string' });
      } else {
        workbook = XLSX.readFile(source);
      }
    } else if (Buffer.isBuffer(source)) {
      workbook = XLSX.read(source, { type: 'buffer' });
    } else {
      workbook = XLSX.read(source, { type: 'array' });
    }

    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) return [];
    const worksheet = workbook.Sheets[firstSheetName];

    // Cerca la riga di header se il file contiene righe di intestazione descrittive prima dei dati (es. header=1)
    const jsonOptions: XLSX.Sheet2JSONOpts = { defval: '' };
    const rawJson = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, jsonOptions);

    // Ispeziona le prime 5 righe per rilevare se gli header sono presenti alla riga 0 o riga 1
    if (rawJson.length > 0) {
      const firstRow = rawJson[0];
      const hasStandardHeader = getColumnValue(firstRow, COLUMN_ALIASES.name) !== undefined ||
                                getColumnValue(firstRow, COLUMN_ALIASES.role) !== undefined;

      if (!hasStandardHeader) {
        // Riprova con range headerOffset = 1
        jsonOptions.range = 1;
        rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, jsonOptions);
      } else {
        rawRows = rawJson;
      }
    }
  }

  const validPlayers: RawPlayerRecord[] = [];
  let autoIdCounter = 1;

  for (const row of rawRows) {
    const rawRole = getColumnValue(row, COLUMN_ALIASES.role);
    const role = normalizeRole(rawRole);

    // Ignora righe che non rappresentano calciatori validi
    if (!role) continue;

    const rawName = getColumnValue(row, COLUMN_ALIASES.name);
    if (!rawName) continue;
    const name = String(rawName).trim();

    const rawTeam = getColumnValue(row, COLUMN_ALIASES.team) || 'Sconosciuta';
    const team = normalizeTeamCode(String(rawTeam));

    const rawId = getColumnValue(row, COLUMN_ALIASES.id);
    const id = rawId ? parseItalianNumber(rawId, autoIdCounter) : autoIdCounter++;

    const qtA = parseItalianNumber(getColumnValue(row, COLUMN_ALIASES.qtA), 1);
    const fvm = parseItalianNumber(getColumnValue(row, COLUMN_ALIASES.fvm), qtA);

    // Prezzo stimato iniziale se non specificato
    const estPrice = Math.max(1, Math.round(fvm * 0.35));

    // Fantamedia storica fma
    const rawFma = getColumnValue(row, COLUMN_ALIASES.fma);
    let fma: number | undefined;
    if (rawFma !== undefined && rawFma !== null && String(rawFma).trim() !== '') {
      fma = parseItalianNumber(rawFma, 0);
    } else {
      // Fallback conservativo se FMA assente: Stima basata sulla quotazione
      fma = Number((qtA / 3.5 + 2.0).toFixed(2));
    }

    validPlayers.push({
      id,
      name,
      team,
      role,
      qtA,
      fvm,
      estPrice,
      fma,
      rawRole: String(rawRole),
      raw: row,
    });
  }

  return validPlayers;
}

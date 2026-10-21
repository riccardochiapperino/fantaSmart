import { Player, Role } from '@/lib/types';
import { calculateCPS, calculateXFM } from '@/lib/advisor/scoring';

/**
 * Esporta la rosa in formato CSV scaricabile dal browser
 */
export function exportRosterToCSV(roster: Player[], filename: string = 'mia_rosa_2026.csv'): void {
  if (typeof window === 'undefined') return;

  const headers = ['Ruolo', 'Nome', 'Squadra', 'Prezzo Pagato', 'CPS', 'xFM'];
  const rows: string[] = [headers.join(',')];

  // Ordina calciatori per Ruolo (P, D, C, A) e poi per Prezzo Pagato decrescente
  const rolePriority: Record<Role, number> = { P: 1, D: 2, C: 3, A: 4 };
  const sortedRoster = [...roster].sort((a, b) => {
    if (rolePriority[a.role] !== rolePriority[b.role]) {
      return rolePriority[a.role] - rolePriority[b.role];
    }
    return (b.boughtFor ?? 0) - (a.boughtFor ?? 0);
  });

  for (const p of sortedRoster) {
    const cps = p.cps ?? calculateCPS(p);
    const xfm = calculateXFM(p);
    const price = p.boughtFor ?? 0;

    // Pulisce campi da virgole per sintassi CSV sicura
    const cleanName = `"${p.name.replace(/"/g, '""')}"`;
    const cleanTeam = `"${p.team.replace(/"/g, '""')}"`;

    rows.push(`${p.role},${cleanName},${cleanTeam},${price},${cps},${xfm}`);
  }

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(rows.join('\n'));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', csvContent);
  downloadAnchor.setAttribute('download', filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Genera il testo formattato sintetico per la condivisione della rosa in chat (WhatsApp/Telegram/Discord)
 */
export function formatRosterForChat(roster: Player[], totalSpent: number, initialBudget: number = 500): string {
  const roles: Role[] = ['P', 'D', 'C', 'A'];
  const roleNames: Record<Role, string> = {
    P: '🧤 PORTIERI',
    D: '🛡️ DIFENSORI',
    C: '⚙️ CENTROCAMPISTI',
    A: '⚽ ATTACCANTI',
  };

  let text = `🏆 *MIA ROSA FANTACALCIO 2026/2027*\n`;
  text += `💰 Spesi: ${totalSpent}/${initialBudget} cr | Residuo: ${initialBudget - totalSpent} cr\n\n`;

  for (const role of roles) {
    const playersInRole = roster
      .filter(p => p.role === role)
      .sort((a, b) => (b.boughtFor ?? 0) - (a.boughtFor ?? 0));

    const roleSpent = playersInRole.reduce((sum, p) => sum + (p.boughtFor ?? 0), 0);

    text += `${roleNames[role]} (${playersInRole.length}) - Spesi: ${roleSpent} cr\n`;

    if (playersInRole.length === 0) {
      text += `  • (Nessun giocatore)\n`;
    } else {
      playersInRole.forEach(p => {
        const price = p.boughtFor ?? 0;
        text += `  • ${p.name} (${p.team}) - ${price} cr\n`;
      });
    }
    text += `\n`;
  }

  return text.trim();
}

/**
 * Copia il testo formattato della rosa negli appunti
 */
export async function copyRosterToClipboard(
  roster: Player[],
  totalSpent: number,
  initialBudget: number = 500
): Promise<boolean> {
  if (typeof window === 'undefined' || !navigator.clipboard) return false;
  try {
    const formatted = formatRosterForChat(roster, totalSpent, initialBudget);
    await navigator.clipboard.writeText(formatted);
    return true;
  } catch (err) {
    console.error('Errore durante la copia negli appunti:', err);
    return false;
  }
}

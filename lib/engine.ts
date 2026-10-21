import { Player, Role } from './types';

export const MAX_SLOTS: Record<Role, number> = {
    P: 3,
    D: 8,
    C: 8,
    A: 6
};

// Calcola la sostituzione ideale
export function getBestReplacements(
    lostPlayer: Player,
    allPlayers: Player[],
    userSquad: Player[],
    remainingBudget: number
): Player[] {
    // 1. Prendi la lista dei team già occupati dall'utente nello stesso ruolo
    const userRoleTeams = new Set(
        userSquad.filter(p => p.role === lostPlayer.role).map(p => p.team.toUpperCase())
    );

    // 2. Filtra i giocatori disponibili
    const candidates = allPlayers.filter(p => {
        if (p.role !== lostPlayer.role) return false;
        if (p.boughtFor !== undefined) return false; // Già comprato da me
        if (p.isLost) return false;                  // Già soffiato
        // Evita duplicati di squadra nello stesso reparto (Tranne se è lo stesso team del perso)
        if (userRoleTeams.has(p.team.toUpperCase()) && p.team.toUpperCase() !== lostPlayer.team.toUpperCase()) {
            return false;
        }
        return true;
    });

    // 3. Calcola il Punteggio di Sostituzione (Matching per Slot, FVM e Titolarità)
    return candidates
        .map(p => {
            const slotDiff = Math.abs(p.slot - lostPlayer.slot);
            const fvmDiff = Math.abs(p.fvm - lostPlayer.fvm);

            // Score più basso = migliore affinità
            const score = (slotDiff * 100) + (fvmDiff * 0.5) - (p.isTitular ? 20 : 0);
            return { player: p, score };
        })
        .sort((a, b) => a.score - b.score)
        .map(item => item.player)
        .slice(0, 4); // Ritorna i migliori 4
}
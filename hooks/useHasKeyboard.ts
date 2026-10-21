'use client';

import { useSyncExternalStore } from 'react';

// Mouse/trackpad + hover = desktop con tastiera. Su smartphone e tablet touch la query non combacia.
const KEYBOARD_QUERY = '(hover: hover) and (pointer: fine)';

function subscribe(onChange: () => void): () => void {
  const mql = window.matchMedia(KEYBOARD_QUERY);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

const getSnapshot = () => window.matchMedia(KEYBOARD_QUERY).matches;

// Lato server (e prima dell'idratazione) si assume "senza tastiera": mai suggerimenti da tastiera su mobile
const getServerSnapshot = () => false;

/**
 * Indica se il dispositivo ha un puntatore preciso (desktop/laptop), cioè dove ha senso
 * mostrare e attivare le scorciatoie da tastiera.
 */
export function useHasKeyboard(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

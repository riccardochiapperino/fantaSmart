'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Player, OpponentTeam } from '@/lib/types';
import { Search, UserCheck, UserX, Command, ArrowRight, Users, AlertTriangle, Wallet } from 'lucide-react';
import { cleanString } from '@/lib/ingestion';
import { useHasKeyboard } from '@/hooks/useHasKeyboard';

interface Props {
  availablePlayers: Player[];
  selectedPlayer: Player | null;
  opponents?: OpponentTeam[];
  /** Crediti rimasti nella mia squadra */
  remainingBudget: number;
  /** Massimo offribile ora (lascia 1 cr per ogni slot ancora da riempire) */
  maxBid: number;
  /** Slot della mia rosa ancora da riempire */
  slotsToFill: number;
  onSelectPlayer: (player: Player) => void;
  onBuyMine: (player: Player, price: number) => void;
  onBuyOther: (player: Player, price?: number, buyerId?: string) => void;
  onUndo: () => void;
}

export function QuickActionBar({
  availablePlayers,
  selectedPlayer,
  opponents = [],
  remainingBudget,
  maxBid,
  slotsToFill,
  onSelectPlayer,
  onBuyMine,
  onBuyOther,
  onUndo,
}: Props) {
  const [query, setQuery] = useState('');
  const [priceInput, setPriceInput] = useState<string>('');
  const [selectedBuyerId, setSelectedBuyerId] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // Scorciatoie da tastiera attive e visibili solo su desktop (mai su smartphone/tablet touch)
  const hasKeyboard = useHasKeyboard();

  // Prezzo digitato e verifica budget in tempo reale
  const typedPrice = Number(priceInput) || 0;
  const remainingAfter = remainingBudget - typedPrice;
  const overBudget = !!selectedPlayer && typedPrice > maxBid;
  const overBy = typedPrice - maxBid;

  const searchInputRef = useRef<HTMLInputElement>(null);
  const priceInputRef = useRef<HTMLInputElement>(null);

  // Aggiorna il prezzo di default quando cambia il giocatore selezionato
  useEffect(() => {
    if (selectedPlayer) {
      setPriceInput((selectedPlayer.targetPrice || selectedPlayer.estPrice || 1).toString());
    } else {
      setPriceInput('');
    }
  }, [selectedPlayer]);

  // Fast In-Memory Search con normalizzazione per autocomplete istantaneo (0ms latency)
  const filteredPlayers = useMemo(() => {
    const q = cleanString(query);
    if (!q) return availablePlayers.slice(0, 8);

    return availablePlayers
      .filter(p => {
        const cleanName = cleanString(p.name);
        const cleanTeam = cleanString(p.team);
        return cleanName.includes(q) || cleanTeam.includes(q);
      })
      .slice(0, 10);
  }, [availablePlayers, query]);

  // Keyboard Shortcuts Global Listener (Cmd+K, Enter, Shift+Enter, Ctrl+Z) - solo desktop
  useEffect(() => {
    if (!hasKeyboard) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd + K / Ctrl + K -> Focus Search
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsDropdownOpen(true);
        return;
      }

      // Ctrl + Z -> Undo
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        onUndo();
        return;
      }

      // Enter o Shift + Enter quando c'è un giocatore selezionato
      if (e.key === 'Enter' && selectedPlayer) {
        if (document.activeElement !== searchInputRef.current || !isDropdownOpen) {
          e.preventDefault();
          const price = Number(priceInput) || selectedPlayer.targetPrice || selectedPlayer.estPrice || 1;

          if (e.shiftKey) {
            // Shift + Enter -> Preso da Altro
            onBuyOther(selectedPlayer, price, selectedBuyerId || undefined);
          } else {
            // Enter -> Preso da Me (bloccato se supera i crediti disponibili)
            if (price > maxBid) return;
            onBuyMine(selectedPlayer, price);
          }
          setQuery('');
          setIsDropdownOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasKeyboard, selectedPlayer, priceInput, selectedBuyerId, isDropdownOpen, maxBid, onBuyMine, onBuyOther, onUndo]);

  const handleSelect = (player: Player) => {
    onSelectPlayer(player);
    setQuery(`${player.name} (${player.team})`);
    setIsDropdownOpen(false);
    priceInputRef.current?.focus();
  };

  const handleBuyMineClick = () => {
    if (!selectedPlayer) return;
    const price = Number(priceInput) || selectedPlayer.targetPrice || selectedPlayer.estPrice || 1;
    if (price > maxBid) return;
    onBuyMine(selectedPlayer, price);
    setQuery('');
  };

  const handleBuyOtherClick = () => {
    if (!selectedPlayer) return;
    const price = Number(priceInput) || selectedPlayer.targetPrice || selectedPlayer.estPrice || 1;
    onBuyOther(selectedPlayer, price, selectedBuyerId || undefined);
    setQuery('');
  };

  return (
    <section className="bg-slate-900 border border-cyan-900/60 rounded-2xl p-4 shadow-2xl space-y-3 relative z-30">
      <div className="flex items-center justify-between text-xs font-bold text-cyan-400">
        <span className="flex items-center gap-1.5">
          <Command className="w-4 h-4 text-cyan-400" /> ASTA LIVE • CHIAMATA CALCIATORE
        </span>
        {hasKeyboard && (
          <span className="text-[11px] text-slate-400 font-semibold">
            Premi <kbd className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-cyan-400">Cmd+K</kbd> per cercare
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 items-center">
        {/* Input Ricerca Giocatore (5 Colonne) */}
        <div className="sm:col-span-5 relative">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Cerca calciatore o squadra..."
              value={query}
              onChange={e => {
                setQuery(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              className="w-full bg-slate-950 text-slate-100 placeholder-slate-500 font-semibold text-base sm:text-xs pl-9 pr-12 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500 transition-all shadow-inner min-h-[44px] sm:min-h-0"
            />
            {hasKeyboard && (
              <span className="absolute right-3 top-2.5 bg-slate-800 text-[10px] font-bold text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                ⌘K
              </span>
            )}
          </div>

          {/* Autocomplete Dropdown List */}
          {isDropdownOpen && filteredPlayers.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-slate-950 border border-cyan-800/80 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-60 overflow-y-auto divide-y divide-slate-800">
              {filteredPlayers.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelect(p)}
                  className="w-full p-2.5 text-left hover:bg-slate-800/80 flex items-center justify-between transition-all group active:bg-slate-800"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                        p.role === 'P'
                          ? 'bg-amber-500 text-black'
                          : p.role === 'D'
                          ? 'bg-blue-600 text-white'
                          : p.role === 'C'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-rose-600 text-white'
                      }`}
                    >
                      {p.role}
                    </span>
                    <span className="font-bold text-xs text-white group-hover:text-cyan-300 truncate max-w-[120px] sm:max-w-none">
                      {p.name}
                    </span>
                    <span className="text-[11px] text-slate-400">({p.team})</span>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 text-[11px]">
                    <span className="text-cyan-400 font-bold">
                      {p.targetPrice || p.estPrice} cr
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input Prezzo Battuto & Selettore Rivale in 2 colonne affiancate su Mobile */}
        <div className="sm:col-span-4 grid grid-cols-2 gap-2">
          {/* Input Prezzo */}
          <div>
            <input
              ref={priceInputRef}
              type="number"
              min={1}
              max={1000}
              placeholder="Prezzo cr"
              value={priceInput}
              onChange={e => setPriceInput(e.target.value)}
              className={`w-full bg-slate-950 font-black text-base text-center py-2 sm:py-2.5 rounded-xl border focus:outline-none shadow-inner min-h-[44px] sm:min-h-0 ${
                overBudget
                  ? 'text-rose-300 border-rose-500 focus:border-rose-400'
                  : 'text-cyan-300 border-slate-700 focus:border-cyan-500'
              }`}
            />
          </div>

          {/* Selettore Rivale */}
          <div>
            <select
              value={selectedBuyerId}
              onChange={e => setSelectedBuyerId(e.target.value)}
              className="w-full bg-slate-950 text-slate-200 text-xs py-2 sm:py-2.5 px-2 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500 truncate font-semibold min-h-[44px] sm:min-h-0"
              title="Seleziona squadra rivale acquirente"
            >
              <option value="">Rivale Auto</option>
              {opponents.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name} ({team.remainingBudget} cr)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Pulsanti Rapidi Azione (3 Colonne) */}
        <div className="sm:col-span-3 flex gap-2">
          <button
            type="button"
            disabled={!selectedPlayer || overBudget}
            onClick={handleBuyMineClick}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-xs py-2.5 px-2 rounded-xl transition-all shadow-lg flex items-center justify-center gap-1 active:scale-95 min-h-[48px]"
            title={
              overBudget
                ? `Budget superato: puoi offrire al massimo ${maxBid} cr`
                : hasKeyboard
                ? 'Premi Invio per registrare acquisto in mia rosa'
                : 'Registra acquisto in mia rosa'
            }
          >
            <UserCheck className="w-4 h-4" /> PRESO{hasKeyboard && ' (Invio)'}
          </button>

          <button
            type="button"
            disabled={!selectedPlayer}
            onClick={handleBuyOtherClick}
            className="flex-1 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-xs py-2.5 px-2 rounded-xl transition-all shadow-lg flex items-center justify-center gap-1 active:scale-95 min-h-[48px]"
            title={hasKeyboard ? 'Premi Shift+Invio per registrare acquisto da rivale' : 'Registra acquisto da rivale'}
          >
            <UserX className="w-4 h-4" /> PERSO{hasKeyboard && ' (Shift)'}
          </button>
        </div>
      </div>

      {/* Crediti rimasti e controllo sforamento budget in tempo reale */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[11px] font-semibold border-t border-slate-800 pt-2">
        <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-slate-300">
          <Wallet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="whitespace-nowrap">
            Crediti rimasti:{' '}
            <strong className="text-emerald-300 text-xs" suppressHydrationWarning>{remainingBudget} cr</strong>
          </span>
          <span className="text-slate-500" suppressHydrationWarning>
            {slotsToFill > 0
              ? `· ${slotsToFill} slot da riempire · max offerta ${maxBid} cr`
              : '· rosa completa'}
          </span>
        </span>

        {selectedPlayer && overBudget && (
          <span className="flex items-center gap-1 text-rose-300 font-bold" role="alert">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            Sfori il budget di {overBy} cr: puoi offrire al massimo {maxBid} cr
          </span>
        )}
        {selectedPlayer && !overBudget && typedPrice > 0 && (
          <span className="text-slate-400">
            Dopo l&apos;acquisto: <strong className="text-cyan-300">{remainingAfter} cr</strong>
          </span>
        )}
      </div>
    </section>
  );
}

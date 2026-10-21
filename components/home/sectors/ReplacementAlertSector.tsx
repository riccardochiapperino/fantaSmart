import React from 'react';
import { Player, TabType } from '@/lib/types';
import { getBestReplacements } from '@/lib/engine';
import { RefreshCw, AlertTriangle, ChevronRight, Sparkles } from 'lucide-react';

interface Props {
  players: Player[];
  squad: Player[];
  remainingBudget: number;
  selectedLostPlayer: Player | null;
  setSelectedLostPlayer: (player: Player) => void;
  onBuy: (player: Player, price: number) => void;
  onNavigateTab: (tab: TabType) => void;
}

export function ReplacementAlertSector({
  players,
  squad,
  remainingBudget,
  selectedLostPlayer,
  setSelectedLostPlayer,
  onBuy,
  onNavigateTab,
}: Props) {
  const lostPlayers = players.filter(p => p.isLost);
  const activeLostPlayer = selectedLostPlayer || lostPlayers[0] || null;

  const replacements = activeLostPlayer
    ? getBestReplacements(activeLostPlayer, players, squad, remainingBudget)
    : [];

  return (
    <section className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl backdrop-blur-sm space-y-3">
      <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-rose-500/10 rounded-lg border border-rose-500/20 text-rose-400">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm">Settore Sostituti &amp; Occasioni</h3>
            <p className="text-[11px] text-slate-400">Sostituto ideale per i tuoi obiettivi persi</p>
          </div>
        </div>
        <button
          onClick={() => onNavigateTab('sostituto')}
          className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5"
        >
          Tutti i Sostituti <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {lostPlayers.length === 0 && !selectedLostPlayer ? (
        <div className="text-center py-5 bg-slate-800/40 rounded-lg border border-slate-800 flex flex-col items-center gap-1">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <p className="text-xs text-slate-300 font-semibold">Nessun obiettivo perso al momento!</p>
          <p className="text-[11px] text-slate-500">
            Quando un giocatore d'asta viene acquistato da un rivale, segnalalo come "Perso" per ricevere subito consigli.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Selettore rapido del giocatore perso */}
          <div className="bg-slate-800/70 p-2.5 rounded-lg border border-slate-700">
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Giocatore Perso da Rimpiazzare:
            </label>
            <select
              className="w-full bg-slate-900 text-xs p-2 rounded border border-slate-700 text-white font-medium focus:outline-none focus:border-cyan-500"
              value={activeLostPlayer?.id || ''}
              onChange={e => {
                const found = players.find(p => p.id === Number(e.target.value));
                if (found) setSelectedLostPlayer(found);
              }}
            >
              {lostPlayers.map(p => (
                <option key={p.id} value={p.id}>
                  [{p.role}] {p.name} ({p.team}) - Slot {p.slot}° (Soffiato)
                </option>
              ))}
              {players
                .filter(p => !p.isLost && p.boughtFor === undefined)
                .slice(0, 10)
                .map(p => (
                  <option key={p.id} value={p.id}>
                    [{p.role}] {p.name} ({p.team}) - Slot {p.slot}°
                  </option>
                ))}
            </select>
          </div>

          {/* Consigli di Sostituzione */}
          {activeLostPlayer && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Migliori alternative per {activeLostPlayer.name}:
              </span>
              <div className="space-y-2">
                {replacements.slice(0, 3).map(alt => (
                  <div
                    key={alt.id}
                    className="bg-slate-800/90 p-2.5 rounded-lg border border-cyan-900/60 flex justify-between items-center hover:border-cyan-700 transition-all"
                  >
                    <div>
                      <div className="font-bold text-xs text-cyan-300">
                        {alt.name} <span className="text-[10px] text-slate-400">({alt.team})</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Slot: {alt.slot}° | Stima: {alt.estPrice} cr {alt.isPenaltyTaker && '• 🎯 Rigorista'}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const price = prompt(`A quanto hai acquistato ${alt.name}?`, alt.estPrice.toString());
                        if (price) onBuy(alt, Number(price));
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-2.5 py-1.5 rounded shadow-sm"
                    >
                      Acquista
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

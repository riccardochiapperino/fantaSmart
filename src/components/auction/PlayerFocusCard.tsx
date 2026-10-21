'use client';

import React from 'react';
import { Player } from '@/lib/types';
import { calculateCPS, calculateXFM } from '@/lib/advisor/scoring';
import { Target, AlertTriangle, Shield, Activity, Star, Sparkles } from 'lucide-react';

interface Props {
  player: Player | null;
  onBuyMine: (player: Player, price: number) => void;
  onBuyOther: (player: Player) => void;
  onRelease?: (playerId: number) => void;
}

export function PlayerFocusCard({ player, onBuyMine, onBuyOther, onRelease }: Props) {
  if (!player) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[220px] space-y-2">
        <Sparkles className="w-8 h-8 text-slate-600 animate-bounce" />
        <h3 className="font-bold text-slate-300 text-sm">Nessun Calciatore in Battuta</h3>
        <p className="text-xs text-slate-500 max-w-sm">
          Digita il nome o la squadra nella barra in alto (<kbd className="text-cyan-400">Cmd+K</kbd>) per selezionare il calciatore attualmente all'asta.
        </p>
      </div>
    );
  }

  const cps = player.cps ?? calculateCPS(player);
  const xfm = calculateXFM(player);
  const vorp = player.vorp ?? 0;
  const targetPrice = player.targetPrice || player.estPrice || 1;
  const panicPriceCap = Math.round(targetPrice * 1.15) + 1; // Tetto massimo di sopravvalutazione (+15%)

  const isBoughtByMe = player.boughtFor !== undefined;
  const isLostByMe = !!player.isLost;

  return (
    <div className="bg-slate-900 border-2 border-cyan-500/80 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4 backdrop-blur-md relative overflow-hidden">
      {/* Glow Effect Sfondo */}
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Giocatore */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-xs font-black px-2.5 py-0.5 rounded-lg ${
                player.role === 'P'
                  ? 'bg-amber-500 text-black'
                  : player.role === 'D'
                  ? 'bg-blue-600 text-white'
                  : player.role === 'C'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-rose-600 text-white'
              }`}
            >
              {player.role}
            </span>
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wide">
              {player.team}
            </span>
            <span className="text-xs text-slate-400 font-semibold">• Slot {player.slot}°</span>
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight">{player.name}</h2>
        </div>

        {/* Status Indicators Badges */}
        <div className="flex flex-col items-end gap-1 text-[11px]">
          {player.isTitular && (
            <span className="bg-amber-500/20 border border-amber-500/40 text-amber-300 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-400" /> Titolare (
              {Math.round((player.titolarita ?? 0.85) * 100)}%)
            </span>
          )}
          {player.isPenaltyTaker && (
            <span className="bg-rose-500/20 border border-rose-500/40 text-rose-300 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
              <Target className="w-3 h-3 text-rose-400" /> Rigorista{' '}
              {player.penaltyOrder ? `(${player.penaltyOrder}°)` : ''}
            </span>
          )}
        </div>
      </div>

      {/* Se già acquistato o perso: Banner di Ripristino / Deselezione */}
      {(isBoughtByMe || isLostByMe) && (
        <div className={`p-3 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-2.5 ${
          isBoughtByMe
            ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
            : 'bg-rose-950/60 border-rose-500/50 text-rose-300'
        }`}>
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="text-base">{isBoughtByMe ? '🟢' : '🔴'}</span>
            <span>
              {isBoughtByMe
                ? `Acquistato in Mia Rosa a ${player.boughtFor} crediti`
                : 'Assegnato ad Avversario / Segnato come Perso'}
            </span>
          </div>

          {onRelease && (
            <button
              type="button"
              onClick={() => onRelease(player.id)}
              className="w-full sm:w-auto px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1"
            >
              <span>↩️ Deseleziona / Svincola (Torna Libero)</span>
            </button>
          )}
        </div>
      )}

      {/* Metriche Prestazionali (Rendimento, Fantamedia, Valore Extra) */}
      <div className="grid grid-cols-3 gap-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-center">
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rendimento</div>
          <div className="text-lg font-black text-cyan-400">{cps}</div>
        </div>
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Media Attesa</div>
          <div className="text-lg font-black text-amber-400">{xfm}</div>
        </div>
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Valore Extra</div>
          <div className="text-lg font-black text-emerald-400">+{vorp.toFixed(1)}</div>
        </div>
      </div>

      {/* Box Tetti Prezzo Consigliato vs Prezzo Massimo */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-cyan-950/40 border border-cyan-800/80 p-3 rounded-xl">
          <div className="text-[11px] font-bold text-cyan-400 flex items-center gap-1 mb-0.5">
            <Target className="w-3.5 h-3.5" /> Prezzo Consigliato
          </div>
          <div className="text-2xl font-black text-white">
            {targetPrice} <span className="text-xs text-cyan-400">cr</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">In base a budget e ruolo</p>
        </div>

        <div className="bg-rose-950/30 border border-rose-900/60 p-3 rounded-xl">
          <div className="text-[11px] font-bold text-rose-400 flex items-center gap-1 mb-0.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Prezzo Massimo
          </div>
          <div className="text-2xl font-black text-rose-200">
            {panicPriceCap} <span className="text-xs text-rose-400">cr</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Soglia massima consigliata</p>
        </div>
      </div>
    </div>
  );
}

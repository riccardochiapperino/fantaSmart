'use client';

import React, { useState } from 'react';
import { Player, Role } from '@/lib/types';
import { RefreshCw, Zap, Shield, Activity, Target } from 'lucide-react';
import { calculateCPS, calculateXFM } from '@/lib/advisor/scoring';

interface Props {
  player: Player | null;
  role: Role;
  slotIndex: number;
  availableSubstitutes?: Player[];
  onSwapPlayer?: (oldPlayer: Player, newPlayer: Player) => void;
  onAssignPlayer?: (newPlayer: Player) => void;
}

export function PlayerPitchNode({
  player,
  role,
  slotIndex,
  availableSubstitutes = [],
  onSwapPlayer,
  onAssignPlayer,
}: Props) {
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);

  const roleColors: Record<Role, { badge: string; bg: string; text: string }> = {
    P: { badge: 'bg-amber-500 text-black', bg: 'hover:border-amber-400', text: 'text-amber-300' },
    D: { badge: 'bg-blue-500 text-white', bg: 'hover:border-blue-400', text: 'text-blue-300' },
    C: { badge: 'bg-emerald-500 text-black', bg: 'hover:border-emerald-400', text: 'text-emerald-300' },
    A: { badge: 'bg-rose-500 text-white', bg: 'hover:border-rose-400', text: 'text-rose-300' },
  };

  const meta = roleColors[role];

  // Titolarità border color
  const starterScore = player ? (player.starterScore ?? player.titolarita ?? 0.65) : 0;
  const statusBorder =
    starterScore >= 0.8
      ? 'border-emerald-500 shadow-emerald-500/20'
      : starterScore >= 0.5
      ? 'border-amber-500 shadow-amber-500/20'
      : 'border-rose-500 shadow-rose-500/20';

  if (!player) {
    return (
      <div className="relative group flex flex-col items-center">
        <div
          onClick={() => setIsSubMenuOpen(!isSubMenuOpen)}
          className="w-14 sm:w-20 h-14 sm:h-20 rounded-2xl border-2 border-dashed border-white/30 hover:border-cyan-400 bg-black/40 backdrop-blur-md flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105"
        >
          <span className={`px-1 py-0.2 rounded text-[8px] sm:text-[9px] font-black ${meta.badge} mb-0.5`}>
            {role}
          </span>
          <span className="text-[9px] sm:text-[10px] text-white/70 font-semibold">Vuoto</span>
        </div>

        {/* Menu Assegnazione Giocatore */}
        {isSubMenuOpen && availableSubstitutes.length > 0 && (
          <div className="absolute top-full mt-1 w-44 sm:w-48 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 divide-y divide-slate-800 animate-in fade-in zoom-in-95">
            <div className="text-[10px] font-bold text-slate-400 p-1 uppercase">
              Seleziona {role}:
            </div>
            <div className="max-h-36 overflow-y-auto space-y-1 pt-1">
              {availableSubstitutes.map(sub => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => {
                    if (onAssignPlayer) onAssignPlayer(sub);
                    setIsSubMenuOpen(false);
                  }}
                  className="w-full p-1.5 rounded-lg text-left text-xs hover:bg-slate-800 flex justify-between items-center text-slate-200"
                >
                  <span className="font-bold truncate text-[11px]">{sub.name}</span>
                  <span className="text-[10px] text-cyan-400 font-mono">{(sub.cps ?? calculateCPS(sub)).toFixed(1)}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const cps = player.cps ?? calculateCPS(player);
  const xfm = player.expectedBaseScore ?? calculateXFM(player);

  return (
    <div className="relative group flex flex-col items-center select-none">
      {/* Node Card Principale */}
      <div
        onClick={() => setIsSubMenuOpen(!isSubMenuOpen)}
        className={`w-14 sm:w-22 p-1 sm:p-1.5 rounded-2xl bg-slate-950/90 backdrop-blur-md border-2 ${statusBorder} shadow-lg cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 text-center flex flex-col items-center`}
      >
        {/* Top Mini Badge Ruolo & Squadra */}
        <div className="flex items-center gap-0.5 w-full justify-between px-0.5">
          <span className={`px-1 rounded text-[7px] sm:text-[9px] font-black ${meta.badge}`}>
            {player.role}
          </span>
          <span className="text-[7px] sm:text-[9px] text-slate-300 font-bold uppercase truncate max-w-[32px] sm:max-w-[45px]">
            {player.team}
          </span>
        </div>

        {/* Nome Giocatore */}
        <span className="font-extrabold text-[9px] sm:text-xs text-white truncate w-full mt-0.5 leading-tight">
          {player.name}
        </span>

        {/* Metriche FM / Rating */}
        <div className="flex items-center justify-between w-full text-[8px] sm:text-[9px] text-slate-400 mt-0.5 border-t border-slate-800/80 pt-0.5 px-0.5">
          <span className="hidden sm:inline">FM <strong className="text-slate-200">{xfm.toFixed(1)}</strong></span>
          <span className="w-full sm:w-auto text-center sm:text-right">Rating <strong className="text-cyan-400 font-bold">{cps.toFixed(1)}</strong></span>
        </div>

        {/* Prezzo Pagato */}
        {player.boughtFor !== undefined && (
          <span className="text-[7px] sm:text-[8px] font-black text-emerald-400 mt-0.2">
            {player.boughtFor} cr
          </span>
        )}
      </div>

      {/* Dropdown Menu Sostituzione con Panchina */}
      {isSubMenuOpen && availableSubstitutes.length > 0 && (
        <div className="absolute top-full mt-2 w-52 bg-slate-950 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 divide-y divide-slate-800 animate-in fade-in zoom-in-95">
          <div className="text-[10px] font-bold text-slate-400 p-1.5 uppercase flex items-center justify-between">
            <span>Sostituisci con panchina:</span>
            <button
              onClick={e => {
                e.stopPropagation();
                setIsSubMenuOpen(false);
              }}
              className="text-slate-500 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="max-h-40 overflow-y-auto space-y-1 pt-1">
            {availableSubstitutes.map(sub => (
              <button
                key={sub.id}
                type="button"
                onClick={() => {
                  if (onSwapPlayer) onSwapPlayer(player, sub);
                  setIsSubMenuOpen(false);
                }}
                className="w-full p-1.5 rounded-lg text-left text-xs hover:bg-slate-800 flex justify-between items-center text-slate-200 transition-colors"
              >
                <div className="min-w-0">
                  <div className="font-bold truncate">{sub.name} <span className="text-[10px] text-slate-400 font-normal">({sub.team})</span></div>
                  <div className="text-[9px] text-slate-400">Tit: {Math.round((sub.starterScore ?? 0.65) * 100)}%</div>
                </div>
                <span className="text-xs text-cyan-400 font-bold ml-2">{(sub.cps ?? calculateCPS(sub)).toFixed(1)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

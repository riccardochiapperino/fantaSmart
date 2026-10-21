'use client';

import React, { useState, useMemo } from 'react';
import {
  Player,
  Role,
  ScheduleGrid,
  PairingMatrix,
  RankedMatch,
} from '@/lib/types';
import { getDepartmentCompletionMatches } from '@/src/lib/advisor/rosterCompletionEngine';
import {
  Target,
  Sparkles,
  PlusCircle,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Zap,
} from 'lucide-react';

interface Props {
  role: Role;
  myRoster: Player[];
  availablePlayers: Player[];
  remainingBudget: number;
  openSlotsCount: number;
  schedule?: ScheduleGrid;
  pairingMatrix?: PairingMatrix;
  onAddPlayer?: (playerId: number, price: number) => void;
  onFocusPlayer?: (player: Player) => void;
}

export function DepartmentCompletionWidget({
  role,
  myRoster,
  availablePlayers,
  remainingBudget,
  openSlotsCount,
  schedule,
  pairingMatrix,
  onAddPlayer,
  onFocusPlayer,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(true);

  const ownedInRole = useMemo(() => {
    return myRoster.filter(p => p.role === role && p.boughtFor !== undefined);
  }, [myRoster, role]);

  // Budget medio per slot residuo
  const estimatedSlotBudget = useMemo(() => {
    if (openSlotsCount <= 0) return 1;
    return Math.max(1, Math.round(remainingBudget / Math.max(1, 25 - myRoster.length)));
  }, [remainingBudget, openSlotsCount, myRoster.length]);

  // Calcolo delle Top 3-4 raccomandazioni di completamento
  const recommendations: RankedMatch[] = useMemo(() => {
    return getDepartmentCompletionMatches(
      role,
      myRoster,
      availablePlayers,
      estimatedSlotBudget,
      schedule,
      pairingMatrix,
      4
    );
  }, [role, myRoster, availablePlayers, estimatedSlotBudget, schedule, pairingMatrix]);

  if (openSlotsCount <= 0 || recommendations.length === 0) {
    return null;
  }

  const hasOwned = ownedInRole.length > 0;

  return (
    <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 space-y-2.5 shadow-inner">
      {/* Widget Accordion Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-1.5 text-xs font-black">
          {hasOwned ? (
            <>
              <Target className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-300">🎯 Abbinamenti Perfetti Consigliati ({openSlotsCount} slot liberi)</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-amber-300">👑 Top Scelte Iniziali di Reparto ({openSlotsCount} slot)</span>
            </>
          )}
        </div>

        <button
          type="button"
          className="text-slate-400 hover:text-white p-0.5 rounded transition-all"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Lista Cards Raccomandazioni */}
      {isExpanded && (
        <div className="grid grid-cols-1 gap-2 pt-1">
          {recommendations.map(match => {
            const player = match.player;
            const targetPrice = player.targetPrice || player.estPrice || 1;

            const isRigoristaBadge = match.badge.includes('Rigorista');
            const isFdrBadge = match.badge.includes('FDR');
            const isAlternanzaBadge = match.badge.includes('Alternanza');

            const badgeColorClass = isRigoristaBadge
              ? 'bg-rose-950/80 text-rose-300 border-rose-800/80'
              : isFdrBadge
              ? 'bg-amber-950/80 text-amber-300 border-amber-800/80'
              : isAlternanzaBadge
              ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800/80'
              : 'bg-indigo-950/80 text-indigo-300 border-indigo-800/80';

            return (
              <div
                key={player.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/60 rounded-xl p-2.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 transition-all shadow-sm group"
              >
                {/* Info & Badge Sinergia */}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-extrabold text-xs text-white truncate">
                      {player.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">
                      ({player.team})
                    </span>
                    <span className={`text-[9px] font-black border px-1.5 py-0.5 rounded shadow-sm ${badgeColorClass}`}>
                      {match.badge}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-slate-400 flex-wrap">
                    <span>
                      Rendimento: <strong className="text-cyan-400">{(player.cps ?? 6.0).toFixed(1)}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Prezzo Consigliato: <strong className="text-emerald-400">{targetPrice} cr</strong>
                    </span>
                    {match.partnerTeam && (
                      <>
                        <span>•</span>
                        <span className="text-slate-300">
                          Partner: <strong className="text-amber-400">{match.partnerTeam}</strong>
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Pulsanti Azione: Porta in Battuta & Compra Rapido */}
                <div className="flex items-center gap-1.5 shrink-0 ml-auto sm:ml-0">
                  {onFocusPlayer && (
                    <button
                      type="button"
                      onClick={() => onFocusPlayer(player)}
                      className="px-2.5 py-1.5 bg-cyan-500/15 hover:bg-cyan-500 border border-cyan-500/40 text-cyan-300 hover:text-black font-extrabold text-[11px] rounded-xl transition-all active:scale-95 flex items-center gap-1 shadow-sm"
                      title={`Porta ${player.name} nel focus del Live Cockpit`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Porta in Battuta</span>
                    </button>
                  )}

                  {onAddPlayer && (
                    <button
                      type="button"
                      onClick={() => onAddPlayer(player.id, targetPrice)}
                      className="px-2 py-1.5 bg-emerald-500/15 hover:bg-emerald-500 border border-emerald-500/30 text-emerald-300 hover:text-black font-extrabold text-[11px] rounded-xl transition-all active:scale-95 flex items-center gap-1 shadow-sm"
                      title={`Acquista subito ${player.name} a ${targetPrice} cr`}
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Compra</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


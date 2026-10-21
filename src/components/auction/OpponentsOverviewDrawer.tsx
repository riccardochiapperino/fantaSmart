'use client';

import React, { useState } from 'react';
import {
  OpponentTeam,
  MarketScarcity,
  Role,
  Player,
} from '@/lib/types';
import {
  Users,
  X,
  Flame,
  Shield,
  Zap,
  Activity,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Edit2,
  Check,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  opponents: OpponentTeam[];
  marketScarcity?: Record<Role, MarketScarcity>;
  onRenameOpponent?: (teamId: string, newName: string) => void;
  onReleasePlayer?: (playerId: number) => void;
}

export function OpponentsOverviewDrawer({
  isOpen,
  onClose,
  opponents,
  marketScarcity,
  onRenameOpponent,
  onReleasePlayer,
}: Props) {
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState<string>('');

  if (!isOpen) return null;

  const roles: Role[] = ['P', 'D', 'C', 'A'];
  const roleMeta: Record<Role, { name: string; icon: string; color: string }> = {
    P: { name: 'Portieri', icon: '🧤', color: 'text-amber-400' },
    D: { name: 'Difensori', icon: '🛡️', color: 'text-blue-400' },
    C: { name: 'Centrocampisti', icon: '⚙️', color: 'text-emerald-400' },
    A: { name: 'Attaccanti', icon: '⚽', color: 'text-rose-400' },
  };

  const handleStartRename = (team: OpponentTeam) => {
    setEditingTeamId(team.id);
    setEditNameValue(team.name);
  };

  const handleSaveRename = (teamId: string) => {
    if (editNameValue.trim() && onRenameOpponent) {
      onRenameOpponent(teamId, editNameValue.trim());
    }
    setEditingTeamId(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 w-full max-w-5xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] sm:max-h-[92vh] transition-colors duration-200 animate-in slide-in-from-bottom-5 sm:zoom-in-95">
        {/* Header Modal */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                OPPONENT TRACKER &amp; MARKET HEATMAP
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Monitoraggio spesa, slot residui e potere d'acquisto delle {opponents.length} squadre rivali.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Market Scarcity Heatmap Banner */}
        {marketScarcity && (
          <div className="bg-slate-50 dark:bg-slate-950 px-5 py-3 border-b border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {roles.map(role => {
              const scarcity = marketScarcity[role];
              const isHigh = scarcity?.scarcityRatio >= 1.2;
              const isMedium = scarcity?.scarcityRatio >= 0.8 && !isHigh;
              const meta = roleMeta[role];

              return (
                <div
                  key={role}
                  className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <span>{meta.icon}</span> {meta.name}
                    </span>
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${
                        isHigh
                          ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                          : isMedium
                          ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      }`}
                    >
                      {isHigh ? '🔥 Alta Scarsità' : isMedium ? '⚠️ Media' : '✅ Bassa'}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Acquirenti Attivi: <strong className="text-slate-900 dark:text-white">{scarcity.activeBuyers}</strong> | Top Liberi: <strong className="text-cyan-600 dark:text-cyan-400">{scarcity.remainingTopPlayers}</strong>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Max Budget Rivale: <strong className="text-emerald-600 dark:text-emerald-400">{scarcity.highestCompetitorBudget} cr</strong>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Griglia Squadre Rivale */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {opponents.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs italic">
              Nessuna squadra rivale configurata nella lega.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {opponents.map(team => {
                const isExpanded = expandedTeamId === team.id;
                const isEditing = editingTeamId === team.id;
                const totalRemainingSlots = team.slots.P + team.slots.D + team.slots.C + team.slots.A;
                const totalPurchased = team.roster.length;
                const avgPerSlot = totalRemainingSlots > 0 ? (team.remainingBudget / totalRemainingSlots).toFixed(1) : '0';

                return (
                  <div
                    key={team.id}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-3"
                  >
                    {/* Header Card Squadra */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={editNameValue}
                              onChange={e => setEditNameValue(e.target.value)}
                              className="bg-white dark:bg-slate-900 border border-cyan-500 rounded-lg px-2 py-0.5 text-xs text-slate-900 dark:text-white font-bold"
                              autoFocus
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleSaveRename(team.id);
                                if (e.key === 'Escape') setEditingTeamId(null);
                              }}
                            />
                            <button
                              onClick={() => handleSaveRename(team.id)}
                              className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                              {team.name}
                            </h3>
                            <button
                              onClick={() => handleStartRename(team)}
                              className="text-slate-400 hover:text-cyan-500 p-0.5 rounded"
                              title="Rinomina Squadra"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Acquistati: <strong className="text-slate-900 dark:text-white">{totalPurchased}</strong> | Slot Liberi: <strong className="text-cyan-600 dark:text-cyan-400">{totalRemainingSlots}</strong>
                        </div>
                      </div>

                      {/* Budget Badge */}
                      <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Budget Residuo</div>
                        <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400">
                          {team.remainingBudget} cr
                        </span>
                        <div className="text-[10px] text-slate-400">
                          Media: <strong>{avgPerSlot} cr/slot</strong>
                        </div>
                      </div>
                    </div>

                    {/* Badge Slot e Reparti */}
                    <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
                      {roles.map(role => {
                        const free = team.slots[role];
                        const max = team.maxSlots[role];
                        const filled = max - free;
                        const spentRole = team.spentByRole[role];

                        return (
                          <div
                            key={role}
                            className={`p-1.5 rounded-xl border text-[10px] font-bold ${
                              free > 0
                                ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                                : 'bg-slate-200/50 dark:bg-slate-900/40 border-transparent text-slate-400'
                            }`}
                          >
                            <div className="flex justify-between items-center text-[9px] text-slate-400 mb-0.5">
                              <span>{role}</span>
                              <span>{spentRole}cr</span>
                            </div>
                            <div className="font-extrabold text-[11px] text-slate-900 dark:text-white">
                              {filled}/{max}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Accordion Rosa Giocatori */}
                    {team.roster.length > 0 && (
                      <div>
                        <button
                          onClick={() => setExpandedTeamId(isExpanded ? null : team.id)}
                          className="w-full flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white pt-1 border-t border-slate-200 dark:border-slate-800/80 transition-colors"
                        >
                          <span>Mostra Rosa ({team.roster.length} Calciatori)</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        {isExpanded && (
                          <div className="mt-2 space-y-1 max-h-36 overflow-y-auto pr-1">
                            {team.roster.map(p => (
                              <div
                                key={p.id}
                                className="flex justify-between items-center bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800/80 text-[11px]"
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className={`px-1 rounded text-[9px] font-black ${
                                    p.role === 'P' ? 'bg-amber-500 text-black' :
                                    p.role === 'D' ? 'bg-blue-500 text-white' :
                                    p.role === 'C' ? 'bg-emerald-500 text-black' :
                                    'bg-rose-500 text-white'
                                  }`}>
                                    {p.role}
                                  </span>
                                  <span className="font-bold text-slate-900 dark:text-white truncate">{p.name}</span>
                                  <span className="text-[10px] text-slate-400">({p.team})</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                    {p.boughtFor} cr
                                  </span>
                                  {onReleasePlayer && (
                                    <button
                                      onClick={() => {
                                        if (confirm(`Rilasciare ${p.name} dalla squadra ${team.name}?`)) {
                                          onReleasePlayer(p.id);
                                        }
                                      }}
                                      className="text-slate-400 hover:text-rose-500 p-0.5 rounded"
                                      title="Rilascia e riapri slot"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50/50 dark:bg-slate-950/50">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl transition-colors"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}

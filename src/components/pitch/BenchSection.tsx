'use client';

import React from 'react';
import { Player, Role } from '@/lib/types';
import { Users, ArrowUpCircle } from 'lucide-react';
import { calculateCPS, calculateXFM } from '@/lib/advisor/scoring';

interface Props {
  bench: Player[];
  onPromoteToStarter?: (player: Player) => void;
}

export function BenchSection({ bench, onPromoteToStarter }: Props) {
  const roles: Role[] = ['P', 'D', 'C', 'A'];

  const roleMeta: Record<Role, { name: string; badge: string }> = {
    P: { name: 'Portieri Riserva', badge: 'bg-amber-500 text-black' },
    D: { name: 'Difensori Riserva', badge: 'bg-blue-500 text-white' },
    C: { name: 'Centrocampisti Riserva', badge: 'bg-emerald-500 text-black' },
    A: { name: 'Attaccanti Riserva', badge: 'bg-rose-500 text-white' },
  };

  return (
    <div className="bg-white/80 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3">
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2.5">
        <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
          <Users className="w-4 h-4 text-cyan-500" />
          <span>PANCHINA &amp; RISERVE ({bench.length} Giocatori)</span>
        </div>
      </div>

      {bench.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-500 italic">
          Nessun calciatore in panchina. Tutti i giocatori della rosa sono schierati nell'undici titolare.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {roles.map(role => {
            const roleBench = bench.filter(p => p.role === role);
            const meta = roleMeta[role];

            return (
              <div
                key={role}
                className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5"
              >
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-1">
                  <span>{meta.name}</span>
                  <span>{roleBench.length}</span>
                </div>

                {roleBench.length === 0 ? (
                  <div className="py-2 text-[10px] text-slate-400 italic text-center">Nessuna riserva</div>
                ) : (
                  <div className="space-y-1">
                    {roleBench.map(p => {
                      const cps = p.cps ?? calculateCPS(p);
                      const xfm = p.expectedBaseScore ?? calculateXFM(p);

                      return (
                        <div
                          key={p.id}
                          className="bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs hover:border-cyan-500/50 transition-all"
                        >
                          <div className="min-w-0 flex-1 pr-1">
                            <div className="flex items-center gap-1">
                              <span className={`px-1 rounded text-[8px] font-black ${meta.badge}`}>
                                {p.role}
                              </span>
                              <span className="font-bold text-slate-900 dark:text-white truncate text-[11px]">
                                {p.name}
                              </span>
                              <span className="text-[9px] text-slate-400 font-semibold">
                                ({p.team})
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[9px] text-slate-400 mt-0.5">
                              <span>xFM {xfm.toFixed(1)}</span>
                              <span>CPS <strong className="text-cyan-600 dark:text-cyan-400 font-bold">{cps.toFixed(1)}</strong></span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {p.boughtFor !== undefined && (
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                {p.boughtFor} cr
                              </span>
                            )}
                            {onPromoteToStarter && (
                              <button
                                onClick={() => onPromoteToStarter(p)}
                                className="p-1 text-slate-400 hover:text-cyan-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                title="Promuovi a Titolare"
                              >
                                <ArrowUpCircle className="w-3.5 h-3.5" />
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
          })}
        </div>
      )}
    </div>
  );
}

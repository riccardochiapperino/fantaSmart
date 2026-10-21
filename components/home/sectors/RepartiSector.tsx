import React from 'react';
import { Player, Role, TabType } from '@/lib/types';
import { MAX_SLOTS } from '@/lib/engine';
import { Shield, ShieldAlert, Award, Flame, ChevronRight } from 'lucide-react';

interface Props {
  squad: Player[];
  onNavigateTab: (tab: TabType) => void;
}

const ROLE_DETAILS: Record<Role, { label: string; icon: typeof Shield; color: string; badgeBg: string; border: string }> = {
  P: { label: 'Portieri', icon: Shield, color: 'text-amber-400', badgeBg: 'bg-amber-500/20 text-amber-300', border: 'border-amber-500/30' },
  D: { label: 'Difensori', icon: ShieldAlert, color: 'text-blue-400', badgeBg: 'bg-blue-500/20 text-blue-300', border: 'border-blue-500/30' },
  C: { label: 'Centrocampisti', icon: Award, color: 'text-emerald-400', badgeBg: 'bg-emerald-500/20 text-emerald-300', border: 'border-emerald-500/30' },
  A: { label: 'Attaccanti', icon: Flame, color: 'text-rose-400', badgeBg: 'bg-rose-500/20 text-rose-300', border: 'border-rose-500/30' },
};

export function RepartiSector({ squad, onNavigateTab }: Props) {
  const roles: Role[] = ['P', 'D', 'C', 'A'];

  return (
    <section className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl backdrop-blur-sm space-y-4">
      <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20 text-cyan-400">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm">Settore Reparti &amp; Completamento</h3>
            <p className="text-[11px] text-slate-400">Stato slot per singolo ruolo</p>
          </div>
        </div>
        <button
          onClick={() => onNavigateTab('rosa')}
          className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5"
        >
          Vedi Rosa <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {roles.map(r => {
          const roleConfig = ROLE_DETAILS[r];
          const Icon = roleConfig.icon;
          const roleSquad = squad.filter(p => p.role === r);
          const max = MAX_SLOTS[r];
          const count = roleSquad.length;
          const totalSpentRole = roleSquad.reduce((acc, p) => acc + (p.boughtFor || 0), 0);
          const percent = Math.min(100, Math.round((count / max) * 100));

          return (
            <div
              key={r}
              className={`bg-slate-800/60 border ${roleConfig.border} rounded-xl p-3 flex flex-col justify-between space-y-2 hover:bg-slate-800/90 transition-all`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-black ${roleConfig.badgeBg}`}>
                    {r}
                  </span>
                  <span className="text-sm font-bold text-slate-200">{roleConfig.label}</span>
                </div>
                <span className="text-xs font-bold text-slate-300">
                  {count} <span className="text-slate-500">/ {max}</span>
                </span>
              </div>

              <div className="space-y-1">
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-700/40">
                  <div
                    className={`h-full ${count === max ? 'bg-emerald-400' : 'bg-cyan-400'} transition-all duration-300`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-400 pt-0.5">
                  <span>Crediti spesi: <strong className="text-slate-200">{totalSpentRole} cr</strong></span>
                  {count === max ? (
                    <span className="text-emerald-400 font-semibold text-[10px]">Completato ✓</span>
                  ) : (
                    <span className="text-amber-400 font-semibold text-[10px]">{max - count} slot mancanti</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

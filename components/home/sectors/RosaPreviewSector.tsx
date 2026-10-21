import React from 'react';
import { Player, Role, TabType } from '@/lib/types';
import { Users, ChevronRight, Star } from 'lucide-react';

interface Props {
  squad: Player[];
  onNavigateTab: (tab: TabType) => void;
}

export function RosaPreviewSector({ squad, onNavigateTab }: Props) {
  const roles: Role[] = ['P', 'D', 'C', 'A'];

  return (
    <section className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl backdrop-blur-sm space-y-3">
      <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20 text-blue-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm">Settore Rosa &amp; Acquisti Top</h3>
            <p className="text-[11px] text-slate-400">Panoramica rapida dei giocatori in squadra</p>
          </div>
        </div>
        <button
          onClick={() => onNavigateTab('rosa')}
          className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5"
        >
          Vedi Rosa ({squad.length}/25) <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {squad.length === 0 ? (
        <div className="text-center py-6 bg-slate-800/40 rounded-lg border border-slate-800/60">
          <p className="text-xs text-slate-400 italic">Nessun giocatore acquistato al momento.</p>
          <button
            onClick={() => onNavigateTab('asta')}
            className="mt-2 text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-3 py-1.5 rounded-lg hover:bg-emerald-900/80"
          >
            Inizia l'Asta Ora
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {roles.map(r => {
            const roleSquad = squad.filter(p => p.role === r);
            return (
              <div key={r} className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-2.5 space-y-1">
                <div className="flex justify-between items-center border-b border-slate-700/50 pb-1 text-[11px] font-bold">
                  <span className="text-slate-300">Ruolo {r}</span>
                  <span className="text-cyan-400">{roleSquad.length} acquistati</span>
                </div>
                {roleSquad.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic py-1">Nessun acquisto</p>
                ) : (
                  <div className="space-y-1 pt-0.5">
                    {roleSquad.slice(0, 3).map(p => (
                      <div key={p.id} className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-200 truncate max-w-[140px]">
                          <strong>{p.name}</strong> <span className="text-slate-400 text-[10px]">({p.team})</span>
                        </span>
                        <span className="font-bold text-emerald-400">{p.boughtFor} cr</span>
                      </div>
                    ))}
                    {roleSquad.length > 3 && (
                      <p className="text-[10px] text-slate-400 text-right font-medium">
                        +{roleSquad.length - 3} altri...
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

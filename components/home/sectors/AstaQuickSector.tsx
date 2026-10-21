import React, { useState } from 'react';
import { Player, Role, TabType } from '@/lib/types';
import { Search, PlusCircle, ChevronRight, Zap } from 'lucide-react';

interface Props {
  players: Player[];
  onBuy: (player: Player, price: number) => void;
  onLost: (player: Player) => void;
  onNavigateTab: (tab: TabType) => void;
}

export function AstaQuickSector({ players, onBuy, onLost, onNavigateTab }: Props) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | Role>('ALL');

  const filteredAvailable = players.filter(p => {
    const isAvailable = p.boughtFor === undefined && !p.isLost;
    const matchesSearch =
      search.trim() === '' ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.team.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || p.role === roleFilter;
    return isAvailable && matchesSearch && matchesRole;
  });

  // Mostra al massimo 4 risultati in home per leggerezza
  const displayPlayers = filteredAvailable.slice(0, 4);

  return (
    <section className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl backdrop-blur-sm space-y-3">
      <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 text-amber-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm">Settore Asta Rapida</h3>
            <p className="text-[11px] text-slate-400">Cerca e acquista direttamente dalla Home</p>
          </div>
        </div>
        <button
          onClick={() => onNavigateTab('asta')}
          className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5"
        >
          Asta Live <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Input Ricerca e Filtro */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cerca giocatore o squadra..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-800 text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value as 'ALL' | Role)}
          className="bg-slate-800 text-xs px-2.5 py-2 rounded-lg border border-slate-700 text-white font-semibold"
        >
          <option value="ALL">Tutti</option>
          <option value="P">P</option>
          <option value="D">D</option>
          <option value="C">C</option>
          <option value="A">A</option>
        </select>
      </div>

      {/* Lista Risultati Rapidi */}
      <div className="space-y-2 pt-1">
        {displayPlayers.length === 0 ? (
          <div className="text-center py-4 bg-slate-800/40 rounded-lg border border-slate-800">
            <p className="text-xs text-slate-400">Nessun giocatore disponibile trovato</p>
          </div>
        ) : (
          displayPlayers.map(p => (
            <div
              key={p.id}
              className="p-2.5 rounded-lg border bg-slate-800/80 border-slate-700/80 flex justify-between items-center hover:border-slate-600 transition-all"
            >
              <div>
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
                  <span className="font-bold text-xs text-slate-100">{p.name}</span>
                  <span className="text-[11px] text-slate-400">({p.team})</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Slot: <strong className="text-slate-200">{p.slot}°</strong> | Stima:{' '}
                  <strong className="text-cyan-400">{p.estPrice} cr</strong>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    const price = prompt(`A quanto hai acquistato ${p.name}?`, p.estPrice.toString());
                    if (price) onBuy(p, Number(price));
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-2.5 py-1.5 rounded flex items-center gap-1 shadow-sm"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Compra
                </button>
                <button
                  onClick={() => onLost(p)}
                  className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs px-2 py-1.5 rounded"
                >
                  Perso
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

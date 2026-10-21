'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Player, Role } from '@/lib/types';
import {
  Settings,
  Download,
  Upload,
  RotateCcw,
  Search,
  Filter,
  Check,
  AlertTriangle,
  Flame,
  Activity,
  Shield,
  Save,
} from 'lucide-react';

interface Props {
  players: Player[];
  onUpdateStatus?: (playerId: number, updates: Partial<Player>) => void;
  onExport?: () => void;
  onImport?: (jsonStr: string) => void;
  onResetFactory?: () => void;
}

export function AdminTab({
  players,
  onUpdateStatus,
  onExport,
  onImport,
  onResetFactory,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'ALL'>('ALL');
  const [teamFilter, setTeamFilter] = useState<string>('ALL');

  // Elenco unico squadre
  const allTeams = useMemo(() => {
    const teams = Array.from(new Set(players.map(p => p.team))).sort();
    return teams;
  }, [players]);

  // Filtro calciatori
  const filteredPlayers = useMemo(() => {
    return players.filter(p => {
      if (roleFilter !== 'ALL' && p.role !== roleFilter) return false;
      if (teamFilter !== 'ALL' && p.team !== teamFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !p.team.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [players, roleFilter, teamFilter, searchTerm]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImport) {
      const reader = new FileReader();
      reader.onload = event => {
        if (event.target?.result) {
          onImport(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Backup Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              PANNELLO ADMIN &amp; OVERRIDE DATI (515 Calciatori)
            </h2>
            <div className="text-xs text-slate-400">
              Modifica titolarità, rigoristi, infortuni e ricalcola in tempo reale $CPS$ e $TargetPrice$.
            </div>
          </div>
        </div>

        {/* Azioni Backup & Reset */}
        <div className="flex items-center gap-2">
          {onExport && (
            <button
              onClick={onExport}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all"
            >
              <Download className="w-4 h-4" /> Esporta Backup
            </button>
          )}

          {onImport && (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all"
              >
                <Upload className="w-4 h-4" /> Importa Backup
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
              />
            </>
          )}

          {onResetFactory && (
            <button
              onClick={() => {
                if (confirm('Sei sicuro di voler ripristinare il dataset di fabbrica (515 calciatori Serie A 2026/2027)? Tutti gli acquisti e le modifiche manuali verranno resettati.')) {
                  onResetFactory();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-xs font-bold rounded-xl border border-rose-800/80 transition-all"
            >
              <RotateCcw className="w-4 h-4" /> Reset di Fabbrica
            </button>
          )}
        </div>
      </div>

      {/* Filtri e Ricerca */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-md flex flex-wrap gap-2 items-center justify-between">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cerca per nome o squadra..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Filtro Ruolo */}
        <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
          {(['ALL', 'P', 'D', 'C', 'A'] as const).map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                roleFilter === r
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Filtro Squadra */}
        <select
          value={teamFilter}
          onChange={e => setTeamFilter(e.target.value)}
          className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
        >
          <option value="ALL">Tutte le Squadre ({allTeams.length})</option>
          {allTeams.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Tabella Calciatori Editabili */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto max-h-[650px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-950 text-slate-400 sticky top-0 z-10 border-b border-slate-800">
              <tr>
                <th className="p-3">Calciatore</th>
                <th className="p-3 text-center">Slot</th>
                <th className="p-3 text-center">Titolarità (Score)</th>
                <th className="p-3 text-center">Rigorista</th>
                <th className="p-3 text-center">Piazzati</th>
                <th className="p-3 text-center">Rischio Infortuni</th>
                <th className="p-3 text-right">xFM</th>
                <th className="p-3 text-right">CPS</th>
                <th className="p-3 text-right">Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500 italic">
                    Nessun calciatore corrispondente ai filtri selezionati.
                  </td>
                </tr>
              ) : (
                filteredPlayers.map(player => {
                  const starterScore = player.starterScore ?? player.titolarita ?? 0.65;
                  const penaltyTier = player.penaltyTier ?? (player.isPenaltyTaker ? 1 : 0);
                  const injuryRisk = player.injuryRisk ?? 1;

                  return (
                    <tr key={player.id} className="hover:bg-slate-800/50 transition-colors">
                      {/* Calciatore & Squadra */}
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                              player.role === 'P' ? 'bg-amber-500 text-black' :
                              player.role === 'D' ? 'bg-blue-500 text-white' :
                              player.role === 'C' ? 'bg-emerald-500 text-black' :
                              'bg-rose-500 text-white'
                            }`}
                          >
                            {player.role}
                          </span>
                          <span className="font-bold text-white">{player.name}</span>
                          <span className="text-[10px] text-slate-400">({player.team})</span>
                        </div>
                      </td>

                      {/* Slot Tier (1-8) */}
                      <td className="p-3 text-center">
                        <select
                          value={player.slot}
                          onChange={e => {
                            if (onUpdateStatus) {
                              onUpdateStatus(player.id, { slot: Number(e.target.value) });
                            }
                          }}
                          className="bg-slate-950 border border-slate-700 text-slate-200 rounded px-1.5 py-0.5 text-xs font-bold"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                            <option key={s} value={s}>{s}°</option>
                          ))}
                        </select>
                      </td>

                      {/* Titolarità StarterScore Slider */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={starterScore}
                            onChange={e => {
                              if (onUpdateStatus) {
                                onUpdateStatus(player.id, {
                                  starterScore: parseFloat(e.target.value),
                                  titolarita: parseFloat(e.target.value),
                                });
                              }
                            }}
                            className="w-20 accent-amber-500 cursor-pointer"
                          />
                          <span className="text-[11px] font-black text-amber-300 min-w-[32px]">
                            {Math.round(starterScore * 100)}%
                          </span>
                        </div>
                      </td>

                      {/* Rigorista Tier */}
                      <td className="p-3 text-center">
                        <select
                          value={penaltyTier}
                          onChange={e => {
                            const val = Number(e.target.value) as 0 | 1 | 2 | 3;
                            if (onUpdateStatus) {
                              onUpdateStatus(player.id, {
                                penaltyTier: val,
                                isPenaltyTaker: val > 0,
                              });
                            }
                          }}
                          className={`bg-slate-950 border text-xs font-bold rounded px-1.5 py-0.5 ${
                            penaltyTier === 1 ? 'border-amber-500 text-amber-300' :
                            penaltyTier === 2 ? 'border-cyan-500 text-cyan-300' :
                            penaltyTier === 3 ? 'border-blue-500 text-blue-300' :
                            'border-slate-700 text-slate-400'
                          }`}
                        >
                          <option value={0}>No</option>
                          <option value={1}>1° Rigorista (+1.5)</option>
                          <option value={2}>2° Rigorista (+0.8)</option>
                          <option value={3}>3° Rigorista (+0.3)</option>
                        </select>
                      </td>

                      {/* Piazzati (Punizioni & Angoli) */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              if (onUpdateStatus) {
                                onUpdateStatus(player.id, { isFreeKicker: !player.isFreeKicker });
                              }
                            }}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-all ${
                              player.isFreeKicker
                                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                                : 'bg-slate-950 border-slate-800 text-slate-500'
                            }`}
                            title="Punizioni Dirette (+0.4)"
                          >
                            PUN
                          </button>
                          <button
                            onClick={() => {
                              if (onUpdateStatus) {
                                onUpdateStatus(player.id, { isCornerTaker: !player.isCornerTaker });
                              }
                            }}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-all ${
                              player.isCornerTaker
                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                                : 'bg-slate-950 border-slate-800 text-slate-500'
                            }`}
                            title="Calci d'Angolo (+0.2)"
                          >
                            CRN
                          </button>
                        </div>
                      </td>

                      {/* Rischio Infortuni (1-5) */}
                      <td className="p-3 text-center">
                        <select
                          value={injuryRisk}
                          onChange={e => {
                            if (onUpdateStatus) {
                              onUpdateStatus(player.id, { injuryRisk: Number(e.target.value) });
                            }
                          }}
                          className={`bg-slate-950 border text-xs font-bold rounded px-1.5 py-0.5 ${
                            injuryRisk >= 4 ? 'border-rose-500 text-rose-300' :
                            injuryRisk >= 3 ? 'border-amber-500 text-amber-300' :
                            'border-slate-700 text-slate-300'
                          }`}
                        >
                          <option value={1}>1 (Affidabile)</option>
                          <option value={2}>2 (Normale)</option>
                          <option value={3}>3 (Medio)</option>
                          <option value={4}>4 (Fragile)</option>
                          <option value={5}>5 (Cronico)</option>
                        </select>
                      </td>

                      {/* Metriche Ricalcolate Live */}
                      <td className="p-3 text-right font-semibold text-slate-300">
                        {(player.expectedBaseScore ?? 6.0).toFixed(1)}
                      </td>
                      <td className="p-3 text-right font-black text-cyan-400">
                        {(player.cps ?? 0).toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-black text-emerald-400">
                        {player.targetPrice || player.estPrice} cr
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

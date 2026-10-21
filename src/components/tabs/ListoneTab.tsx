'use client';

import React, { useState, useMemo } from 'react';
import { Player, Role } from '@/lib/types';
import {
  Search,
  CheckCircle,
  XCircle,
  RotateCcw,
  PlusCircle,
  Star,
  Target,
  ArrowUpDown,
  Filter,
  Shield,
  Activity,
  Zap,
  AlertTriangle,
  Wallet,
} from 'lucide-react';
import { calculateCPS, calculateXFM } from '@/lib/advisor/scoring';
import { ReleasePlayerModal } from '@/src/components/modals/ReleasePlayerModal';

interface Props {
  players: Player[];
  /** Crediti rimasti nella mia squadra */
  remainingBudget: number;
  /** Massimo offribile ora (lascia 1 cr per ogni slot ancora da riempire) */
  maxBid: number;
  onBuyPlayer: (playerId: number, price: number, isMine?: boolean) => void;
  onMarkAsLost: (playerId: number) => void;
  onReleasePlayer: (playerId: number, refundAmount?: number) => void;
}

type SortField = 'name' | 'team' | 'role' | 'slot' | 'price' | 'cps' | 'titolarita' | 'status';
type StatusFilter = 'ALL' | 'AVAILABLE' | 'MINE' | 'LOST';

export function ListoneTab({
  players,
  remainingBudget,
  maxBid,
  onBuyPlayer,
  onMarkAsLost,
  onReleasePlayer,
}: Props) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | Role>('ALL');
  // Di default solo i giocatori ancora liberi: chi è stato perso o preso sparisce subito dall'elenco
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('AVAILABLE');
  const [sortField, setSortField] = useState<SortField>('cps');
  const [sortAsc, setSortAsc] = useState(false);

  const [buyingPlayer, setBuyingPlayer] = useState<Player | null>(null);
  const [buyPriceInput, setBuyPriceInput] = useState<string>('');
  const [releasingPlayer, setReleasingPlayer] = useState<Player | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const filteredPlayers = useMemo(() => {
    const q = search.trim().toLowerCase();

    return players.filter(p => {
      // Filtro Ruolo
      if (roleFilter !== 'ALL' && p.role !== roleFilter) return false;

      // Filtro Stato
      if (statusFilter === 'AVAILABLE' && (p.boughtFor !== undefined || p.isLost)) return false;
      if (statusFilter === 'MINE' && p.boughtFor === undefined) return false;
      if (statusFilter === 'LOST' && !p.isLost) return false;

      // Filtro Ricerca
      if (q) {
        const matchName = p.name.toLowerCase().includes(q);
        const matchTeam = p.team.toLowerCase().includes(q);
        if (!matchName && !matchTeam) return false;
      }

      return true;
    }).sort((a, b) => {
      let valA: any;
      let valB: any;

      switch (sortField) {
        case 'name':
          valA = a.name;
          valB = b.name;
          break;
        case 'team':
          valA = a.team;
          valB = b.team;
          break;
        case 'role':
          valA = a.role;
          valB = b.role;
          break;
        case 'slot':
          valA = a.slot;
          valB = b.slot;
          break;
        case 'price':
          valA = a.targetPrice || a.estPrice || 1;
          valB = b.targetPrice || b.estPrice || 1;
          break;
        case 'cps':
          valA = a.cps ?? calculateCPS(a);
          valB = b.cps ?? calculateCPS(b);
          break;
        case 'titolarita':
          valA = a.titolarita ?? a.starterScore ?? 0.5;
          valB = b.titolarita ?? b.starterScore ?? 0.5;
          break;
        case 'status':
          valA = a.boughtFor !== undefined ? 2 : a.isLost ? 1 : 0;
          valB = b.boughtFor !== undefined ? 2 : b.isLost ? 1 : 0;
          break;
        default:
          valA = a.cps ?? 0;
          valB = b.cps ?? 0;
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [players, search, roleFilter, statusFilter, sortField, sortAsc]);

  // Conteggi per stato (rispettano il filtro ruolo) mostrati sui pulsanti filtro
  const statusCounts = useMemo(() => {
    const scoped = roleFilter === 'ALL' ? players : players.filter(p => p.role === roleFilter);
    return {
      ALL: scoped.length,
      AVAILABLE: scoped.filter(p => p.boughtFor === undefined && !p.isLost).length,
      MINE: scoped.filter(p => p.boughtFor !== undefined).length,
      LOST: scoped.filter(p => p.isLost).length,
    } as Record<StatusFilter, number>;
  }, [players, roleFilter]);

  const buyPrice = parseInt(buyPriceInput, 10) || 0;
  const buyOverBudget = !!buyingPlayer && buyPrice > maxBid;

  const handleConfirmBuy = () => {
    if (!buyingPlayer) return;
    const price = parseInt(buyPriceInput, 10) || buyingPlayer.targetPrice || buyingPlayer.estPrice || 1;
    if (price > maxBid) return;
    onBuyPlayer(buyingPlayer.id, price, true);
    setBuyingPlayer(null);
    setBuyPriceInput('');
  };

  return (
    <div className="space-y-4">
      {/* Header & Statistiche */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="text-base font-black text-white flex items-center gap-2">
            LISTONE CALCIATORI 2026/2027 ({filteredPlayers.length} / {players.length})
          </h2>
          <p className="text-xs text-slate-400">
            Visualizza tutti i calciatori con indicatori matematici e seleziona / deseleziona gli acquisti in tempo reale.
          </p>
        </div>

        {/* Filtri Ruolo Rapidi */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
          {(['ALL', 'P', 'D', 'C', 'A'] as const).map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1 rounded-lg transition-all ${
                roleFilter === r
                  ? 'bg-cyan-500 text-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {r === 'ALL' ? 'Tutti' : r}
            </button>
          ))}
        </div>
      </div>

      {/* Controlli Filtro & Ricerca */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-md flex flex-wrap gap-2.5 items-center justify-between">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cerca per nome o squadra..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-medium"
          />
        </div>

        {/* Filtro Stato Acquisto */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
          <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
          {[
            { id: 'AVAILABLE' as StatusFilter, label: 'Liberi' },
            { id: 'MINE' as StatusFilter, label: 'Mia Rosa' },
            { id: 'LOST' as StatusFilter, label: 'Persi' },
            { id: 'ALL' as StatusFilter, label: 'Tutti' },
          ].map(s => (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id)}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                statusFilter === s.id
                  ? 'bg-slate-800 text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {s.label} <span className="opacity-60 font-semibold">{statusCounts[s.id]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tabella Listone Completa Responsive */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto max-h-[650px] overflow-y-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-800 select-none">
            <thead className="bg-slate-950/90 text-slate-400 uppercase font-black text-[10px] tracking-wider sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th
                  onClick={() => handleSort('role')}
                  className="p-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">R <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th
                  onClick={() => handleSort('name')}
                  className="p-3 cursor-pointer hover:text-white sticky left-0 bg-slate-950"
                >
                  <div className="flex items-center gap-1">Nome Calciatore <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th
                  onClick={() => handleSort('team')}
                  className="p-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">Squadra <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th
                  onClick={() => handleSort('slot')}
                  className="p-3 cursor-pointer hover:text-white text-center"
                >
                  <div className="flex items-center justify-center gap-1">Slot <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th
                  onClick={() => handleSort('price')}
                  className="p-3 cursor-pointer hover:text-white text-right"
                >
                  <div className="flex items-center justify-end gap-1">Prezzo Consigliato <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th
                  onClick={() => handleSort('titolarita')}
                  className="p-3 cursor-pointer hover:text-white text-center"
                >
                  <div className="flex items-center justify-center gap-1">Titolarità <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th
                  onClick={() => handleSort('cps')}
                  className="p-3 cursor-pointer hover:text-white text-right"
                >
                  <div className="flex items-center justify-end gap-1">Rendimento <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="p-3 text-center">Stato / Azioni</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    Nessun calciatore trovato con i filtri selezionati.
                  </td>
                </tr>
              ) : (
                filteredPlayers.map(player => {
                  const isBought = player.boughtFor !== undefined;
                  const isLost = !!player.isLost;
                  const cps = player.cps ?? calculateCPS(player);
                  const targetPrice = player.targetPrice || player.estPrice || 1;

                  return (
                    <tr
                      key={player.id}
                      className={`hover:bg-slate-800/50 transition-colors ${
                        isBought
                          ? 'bg-emerald-950/20'
                          : isLost
                          ? 'bg-rose-950/20'
                          : ''
                      }`}
                    >
                      {/* Ruolo */}
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded ${
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
                      </td>

                      {/* Nome */}
                      <td className="p-3 font-bold text-slate-100 sticky left-0 bg-slate-900/90 backdrop-blur-sm">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate max-w-[140px] sm:max-w-none">{player.name}</span>
                          {player.isPenaltyTaker && (
                            <span className="text-[9px] font-black text-rose-400 bg-rose-950/60 px-1 rounded border border-rose-800/60" title="Rigorista">
                              R
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Squadra */}
                      <td className="p-3 text-slate-300 uppercase font-semibold">
                        {player.team}
                      </td>

                      {/* Slot */}
                      <td className="p-3 text-center text-slate-400">
                        <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          {player.slot}°
                        </span>
                      </td>

                      {/* Target Price */}
                      <td className="p-3 text-right font-black text-cyan-400">
                        {targetPrice} cr
                      </td>

                      {/* Titolarità */}
                      <td className="p-3 text-center">
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                          (player.titolarita ?? 0.7) >= 0.8
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : (player.titolarita ?? 0.7) >= 0.5
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {Math.round((player.titolarita ?? player.starterScore ?? 0.7) * 100)}%
                        </span>
                      </td>

                      {/* CPS */}
                      <td className="p-3 text-right font-bold text-slate-200">
                        {cps.toFixed(1)}
                      </td>

                      {/* Stato & Azioni Rapide */}
                      <td className="p-3 text-center">
                        {isBought ? (
                          <div className="flex items-center justify-center gap-2">
                            <span className="px-2 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-extrabold text-[11px] rounded-lg">
                              🟢 In Rosa ({player.boughtFor} cr)
                            </span>
                            <button
                              type="button"
                              onClick={() => setReleasingPlayer(player)}
                              className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500 border border-amber-500/40 text-amber-300 hover:text-black font-extrabold text-[11px] rounded-lg transition-all active:scale-95 flex items-center gap-1"
                              title="Deseleziona / Svincola dalla rosa"
                            >
                              <RotateCcw className="w-3 h-3" /> Svincola
                            </button>
                          </div>
                        ) : isLost ? (
                          <div className="flex items-center justify-center gap-2">
                            <span className="px-2 py-1 bg-rose-500/20 border border-rose-500/40 text-rose-300 font-extrabold text-[11px] rounded-lg">
                              🔴 Perso
                            </span>
                            <button
                              type="button"
                              onClick={() => onReleasePlayer(player.id)}
                              className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500 border border-cyan-500/40 text-cyan-300 hover:text-black font-extrabold text-[11px] rounded-lg transition-all active:scale-95 flex items-center gap-1"
                              title="Deseleziona / Ripristina come disponibile"
                            >
                              <RotateCcw className="w-3 h-3" /> Ripristina
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setBuyingPlayer(player);
                                setBuyPriceInput((player.targetPrice || player.estPrice || 1).toString());
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] rounded-lg shadow-sm transition-all active:scale-95 flex items-center gap-1"
                            >
                              <PlusCircle className="w-3 h-3" /> Compra
                            </button>
                            <button
                              type="button"
                              onClick={() => onMarkAsLost(player.id)}
                              className="px-2 py-1 bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 border border-slate-700 hover:border-rose-700 font-bold text-[11px] rounded-lg transition-all active:scale-95"
                            >
                              Perso
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Acquisto Rapido da Listone */}
      {buyingPlayer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 border-t sm:border border-slate-700 rounded-t-3xl sm:rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4 animate-in slide-in-from-bottom-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <div className="text-sm font-extrabold text-white">
                Acquista {buyingPlayer.name} ({buyingPlayer.team})
              </div>
              <button
                onClick={() => setBuyingPlayer(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                Prezzo Pagato (Target: {buyingPlayer.targetPrice || buyingPlayer.estPrice} cr):
              </label>
              <input
                type="number"
                min={1}
                max={1000}
                value={buyPriceInput}
                onChange={e => setBuyPriceInput(e.target.value)}
                className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-base text-center font-black ${
                  buyOverBudget ? 'border-rose-500 text-rose-300' : 'border-cyan-500 text-cyan-300'
                }`}
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter') handleConfirmBuy();
                }}
              />
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] font-semibold">
                <span className="flex items-center gap-1 text-slate-300">
                  <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                  Crediti rimasti: <strong className="text-emerald-300">{remainingBudget} cr</strong>
                </span>
                {buyOverBudget ? (
                  <span className="flex items-center gap-1 text-rose-300 font-bold" role="alert">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Sfori di {buyPrice - maxBid} cr (max {maxBid} cr)
                  </span>
                ) : buyPrice > 0 ? (
                  <span className="text-slate-400">
                    Dopo l&apos;acquisto: <strong className="text-cyan-300">{remainingBudget - buyPrice} cr</strong>
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setBuyingPlayer(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleConfirmBuy}
                disabled={buyOverBudget}
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black shadow-lg"
              >
                Conferma Acquisto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Svincolo & Recupero Crediti */}
      <ReleasePlayerModal
        player={releasingPlayer}
        isOpen={!!releasingPlayer}
        onClose={() => setReleasingPlayer(null)}
        onConfirm={(playerId, refundAmount) => {
          onReleasePlayer(playerId, refundAmount);
        }}
      />
    </div>
  );
}

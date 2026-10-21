import React, { useState, useMemo } from 'react';
import { Player, Role } from '@/lib/types';
import { LiveAuctionCockpit } from '@/components/auction';
import {
  Search,
  PlusCircle,
  Filter,
  RotateCcw,
  SlidersHorizontal,
  ArrowUpDown,
  Star,
  Target,
  Zap,
  Table,
} from 'lucide-react';

interface Props {
  players: Player[];
  onBuy: (player: Player, price: number) => void;
  onLost: (player: Player) => void;
}

type StatusFilter = 'ALL' | 'AVAILABLE' | 'BOUGHT' | 'LOST';
type SortOption = 'SLOT' | 'FVM' | 'EST_PRICE' | 'QTA' | 'NAME';

export function AstaTab({ players, onBuy, onLost }: Props) {
  const [viewMode, setViewMode] = useState<'cockpit' | 'list'>('cockpit');

  // Filtri principali
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | Role>('ALL');
  const [teamFilter, setTeamFilter] = useState<string>('ALL');
  const [slotFilter, setSlotFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [onlyTitular, setOnlyTitular] = useState<boolean>(false);
  const [onlyPenaltyTaker, setOnlyPenaltyTaker] = useState<boolean>(false);
  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(200);

  // Ordine & UI
  const [sortBy, setSortBy] = useState<SortOption>('SLOT');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Estrarre lista unica di squadre presenti nei dati
  const teams = useMemo(() => {
    const set = new Set(players.map(p => p.team));
    return Array.from(set).sort();
  }, [players]);

  // Calcolo conteggio filtri attivi
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (roleFilter !== 'ALL') count++;
    if (teamFilter !== 'ALL') count++;
    if (slotFilter !== 'ALL') count++;
    if (statusFilter !== 'ALL') count++;
    if (onlyTitular) count++;
    if (onlyPenaltyTaker) count++;
    if (maxPriceFilter < 200) count++;
    return count;
  }, [roleFilter, teamFilter, slotFilter, statusFilter, onlyTitular, onlyPenaltyTaker, maxPriceFilter]);

  const resetAllFilters = () => {
    setSearch('');
    setRoleFilter('ALL');
    setTeamFilter('ALL');
    setSlotFilter('ALL');
    setStatusFilter('ALL');
    setOnlyTitular(false);
    setOnlyPenaltyTaker(false);
    setMaxPriceFilter(200);
    setSortBy('SLOT');
  };

  // Filtraggio e Ordinamento
  const filteredAndSorted = useMemo(() => {
    const list = players.filter(p => {
      // 1. Ricerca testo (Nome o Squadra)
      const query = search.trim().toLowerCase();
      const matchesSearch =
        query === '' ||
        p.name.toLowerCase().includes(query) ||
        p.team.toLowerCase().includes(query);

      // 2. Ruolo
      const matchesRole = roleFilter === 'ALL' || p.role === roleFilter;

      // 3. Squadra
      const matchesTeam = teamFilter === 'ALL' || p.team === teamFilter;

      // 4. Slot
      const matchesSlot = slotFilter === 'ALL' || p.slot === Number(slotFilter);

      // 5. Stato (Disponibile, Comprato, Perso)
      let matchesStatus = true;
      if (statusFilter === 'AVAILABLE') {
        matchesStatus = p.boughtFor === undefined && !p.isLost;
      } else if (statusFilter === 'BOUGHT') {
        matchesStatus = p.boughtFor !== undefined;
      } else if (statusFilter === 'LOST') {
        matchesStatus = p.isLost === true;
      }

      // 6. Titolarità
      const matchesTitular = !onlyTitular || p.isTitular;

      // 7. Rigoristi
      const matchesPenalty = !onlyPenaltyTaker || Boolean(p.isPenaltyTaker);

      // 8. Prezzo stimato massimo
      const matchesMaxPrice = p.estPrice <= maxPriceFilter;

      return (
        matchesSearch &&
        matchesRole &&
        matchesTeam &&
        matchesSlot &&
        matchesStatus &&
        matchesTitular &&
        matchesPenalty &&
        matchesMaxPrice
      );
    });

    // Ordinamento
    return list.sort((a, b) => {
      if (sortBy === 'SLOT') {
        if (a.slot !== b.slot) return a.slot - b.slot;
        return b.fvm - a.fvm;
      }
      if (sortBy === 'FVM') return b.fvm - a.fvm;
      if (sortBy === 'EST_PRICE') return b.estPrice - a.estPrice;
      if (sortBy === 'QTA') return b.qtA - a.qtA;
      if (sortBy === 'NAME') return a.name.localeCompare(b.name);
      return 0;
    });
  }, [
    players,
    search,
    roleFilter,
    teamFilter,
    slotFilter,
    statusFilter,
    onlyTitular,
    onlyPenaltyTaker,
    maxPriceFilter,
    sortBy,
  ]);

  return (
    <div className="space-y-4">
      {/* Selector Modalità Vista (Live Cockpit vs Tabella Listone) */}
      <div className="flex justify-between items-center bg-slate-900/90 border border-slate-800 p-2 rounded-xl">
        <div className="flex gap-1.5">
          <button
            onClick={() => setViewMode('cockpit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'cockpit'
                ? 'bg-cyan-500 text-black shadow-lg'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" /> ⚡ Live Cockpit (Tastiera)
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'list'
                ? 'bg-cyan-500 text-black shadow-lg'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Table className="w-3.5 h-3.5" /> 📋 Tabella Listone
          </button>
        </div>
      </div>

      {viewMode === 'cockpit' ? (
        <LiveAuctionCockpit />
      ) : (
        <div className="space-y-3">
          {/* Barra Superiore: Ricerca + Pulsante Filtri Avanzati */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cerca calciatore o squadra..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-800 text-sm pl-9 pr-3 py-2 rounded-lg border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Bottone Toggle Filtri Avanzati */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold transition-all ${
            showAdvanced || activeFiltersCount > 0
              ? 'bg-cyan-950/80 border-cyan-500 text-cyan-400'
              : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Filtri</span>
          {activeFiltersCount > 0 && (
            <span className="bg-cyan-500 text-black text-[10px] font-black rounded-full px-1.5 py-0.2">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Barra Quick Filter Ruolo + Ordinamento */}
      <div className="flex flex-wrap justify-between items-center gap-2 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
        {/* Pulsanti Rapidi Ruolo */}
        <div className="flex gap-1">
          {(['ALL', 'P', 'D', 'C', 'A'] as const).map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-2.5 py-1 text-xs font-bold rounded transition-all ${
                roleFilter === r
                  ? r === 'P'
                    ? 'bg-amber-500 text-black'
                    : r === 'D'
                    ? 'bg-blue-600 text-white'
                    : r === 'C'
                    ? 'bg-emerald-600 text-white'
                    : r === 'A'
                    ? 'bg-rose-600 text-white'
                    : 'bg-cyan-500 text-black'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {r === 'ALL' ? 'Tutti' : r}
            </button>
          ))}
        </div>

        {/* Dropdown Ordina Per */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <ArrowUpDown className="w-3.5 h-3.5" />
          <span>Ordina:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortOption)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-1 text-xs font-semibold focus:outline-none focus:border-cyan-500"
          >
            <option value="SLOT">Slot (1° → 8°)</option>
            <option value="FVM">FVM (decrescente)</option>
            <option value="EST_PRICE">Stima Prezzo (decrescente)</option>
            <option value="QTA">Quotazione (decrescente)</option>
            <option value="NAME">Nome (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Drawer Filtri Avanzati */}
      {showAdvanced && (
        <div className="bg-slate-950/90 border border-cyan-900/60 p-3.5 rounded-xl space-y-3 shadow-2xl backdrop-blur-md">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" /> Filtri di Ricerca Avanzati
            </span>
            {activeFiltersCount > 0 && (
              <button
                onClick={resetAllFilters}
                className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Resetta Filtri
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            {/* Filtro Squadra */}
            <div>
              <label className="text-[10px] text-slate-400 block mb-1 font-semibold uppercase">Squadra</label>
              <select
                value={teamFilter}
                onChange={e => setTeamFilter(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded p-1.5 font-medium"
              >
                <option value="ALL">Tutte le squadre</option>
                {teams.map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro Slot */}
            <div>
              <label className="text-[10px] text-slate-400 block mb-1 font-semibold uppercase">Slot Tier</label>
              <select
                value={slotFilter}
                onChange={e => setSlotFilter(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded p-1.5 font-medium"
              >
                <option value="ALL">Tutti gli Slot</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                  <option key={s} value={s}>
                    {s}° Slot
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro Stato Acquisto */}
            <div>
              <label className="text-[10px] text-slate-400 block mb-1 font-semibold uppercase">Stato Calciatore</label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as StatusFilter)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded p-1.5 font-medium"
              >
                <option value="ALL">Tutti i calciatori</option>
                <option value="AVAILABLE">Disponibili (Svincolati)</option>
                <option value="BOUGHT">In Mia Rosa</option>
                <option value="LOST">Soffiati / Persi</option>
              </select>
            </div>

            {/* Prezzo Max Stimato Slider */}
            <div>
              <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-semibold uppercase">
                <span>Stima Max</span>
                <span className="text-cyan-400 font-bold">{maxPriceFilter} cr</span>
              </div>
              <input
                type="range"
                min={1}
                max={200}
                value={maxPriceFilter}
                onChange={e => setMaxPriceFilter(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Checkboxes: Titolarità & Rigoristi */}
          <div className="flex flex-wrap gap-4 pt-1 border-t border-slate-800/60 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-medium">
              <input
                type="checkbox"
                checked={onlyTitular}
                onChange={e => setOnlyTitular(e.target.checked)}
                className="accent-cyan-400 rounded w-4 h-4 cursor-pointer"
              />
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-400" /> Solo Titolari
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-medium">
              <input
                type="checkbox"
                checked={onlyPenaltyTaker}
                onChange={e => setOnlyPenaltyTaker(e.target.checked)}
                className="accent-cyan-400 rounded w-4 h-4 cursor-pointer"
              />
              <span className="flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-rose-400" /> Solo Rigoristi
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Intestazione Conteggio Risultati */}
      <div className="flex justify-between items-center text-xs text-slate-400 px-1 pt-1">
        <span>
          Trovati <strong className="text-cyan-400 font-bold">{filteredAndSorted.length}</strong> su{' '}
          {players.length} calciatori
        </span>
        {activeFiltersCount > 0 && (
          <button onClick={resetAllFilters} className="text-[11px] text-slate-400 hover:text-slate-200 underline">
            Resetta filtri
          </button>
        )}
      </div>

      {/* Lista Calciatori */}
      <div className="space-y-2">
        {filteredAndSorted.length === 0 ? (
          <div className="text-center py-8 bg-slate-800/40 rounded-xl border border-slate-800">
            <p className="text-xs text-slate-400">Nessun calciatore corrisponde ai filtri selezionati.</p>
            <button
              onClick={resetAllFilters}
              className="mt-2 text-xs text-cyan-400 hover:underline font-bold"
            >
              Ripristina Filtri
            </button>
          </div>
        ) : (
          filteredAndSorted.map(p => {
            const isBought = p.boughtFor !== undefined;
            return (
              <div
                key={p.id}
                className={`p-3 rounded-lg border flex justify-between items-center transition-all ${
                  isBought
                    ? 'bg-emerald-950/30 border-emerald-800'
                    : p.isLost
                    ? 'bg-rose-950/20 border-rose-900 opacity-60'
                    : 'bg-slate-800/80 border-slate-700/80 hover:border-slate-600'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded ${
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
                    <span className="font-bold text-sm text-slate-100">{p.name}</span>
                    <span className="text-xs text-slate-400">({p.team})</span>
                    {p.isTitular && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-semibold">
                        Titolare
                      </span>
                    )}
                    {p.isPenaltyTaker && (
                      <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.2 rounded font-semibold flex items-center gap-0.5">
                        🎯 Rigorista
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex gap-3">
                    <span>
                      Slot: <strong className="text-slate-200">{p.slot}°</strong>
                    </span>
                    <span>
                      Stima: <strong className="text-cyan-400">{p.estPrice} cr</strong>
                    </span>
                    <span>
                      FVM: <strong className="text-slate-300">{p.fvm}</strong>
                    </span>
                    <span>
                      Qt.A: <strong className="text-slate-400">{p.qtA}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isBought ? (
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-900/50 px-2 py-1 rounded border border-emerald-800">
                      @ {p.boughtFor} cr
                    </span>
                  ) : p.isLost ? (
                    <span className="text-xs font-semibold text-rose-400 bg-rose-950/60 px-2 py-1 rounded border border-rose-900">
                      Soffiato
                    </span>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  )}
</div>
  );
}
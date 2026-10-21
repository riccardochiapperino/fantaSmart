'use client';

import React, { useState, useMemo } from 'react';
import { Player, Role, AdvisorState } from '@/lib/types';
import {
  Users,
  Trash2,
  Edit2,
  Plus,
  Check,
  X,
  Share2,
  Download,
  Copy,
  TrendingUp,
  Search,
  DollarSign,
  Shield,
  Activity,
  Zap,
} from 'lucide-react';
import { exportRosterToCSV, copyRosterToClipboard } from '@/lib/export/rosterExport';
import { ReleasePlayerModal } from '@/src/components/modals/ReleasePlayerModal';
import { DepartmentCompletionWidget } from '@/src/components/roster/DepartmentCompletionWidget';
import { ScheduleGrid, PairingMatrix } from '@/lib/types';

interface Props {
  squad: Player[];
  availablePlayers?: Player[];
  remainingBudget?: number;
  totalBudget?: number;
  schedule?: ScheduleGrid;
  pairingMatrix?: PairingMatrix;
  onUpdatePrice?: (playerId: number, newPrice: number) => void;
  onReleasePlayer?: (playerId: number, refundAmount?: number) => void;
  onAddPlayer?: (playerId: number, price: number) => void;
  onFocusPlayer?: (player: Player) => void;
  onNavigateToPitch?: () => void;
}

export function RosaTab({
  squad,
  availablePlayers = [],
  remainingBudget = 500,
  totalBudget = 500,
  schedule,
  pairingMatrix,
  onUpdatePrice,
  onReleasePlayer,
  onAddPlayer,
  onFocusPlayer,
  onNavigateToPitch,
}: Props) {
  const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null);
  const [editPriceValue, setEditPriceValue] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [releasingPlayer, setReleasingPlayer] = useState<Player | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAddPlayer, setSelectedAddPlayer] = useState<Player | null>(null);
  const [addPriceValue, setAddPriceValue] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const roles: Role[] = ['P', 'D', 'C', 'A'];
  const maxSlots: Record<Role, number> = { P: 3, D: 8, C: 8, A: 6 };

  const roleTitles: Record<Role, { name: string; icon: React.ReactNode; color: string }> = {
    P: { name: 'Portieri', icon: <span className="text-amber-400">🧤</span>, color: 'border-amber-500/30' },
    D: { name: 'Difensori', icon: <Shield className="w-4 h-4 text-blue-400" />, color: 'border-blue-500/30' },
    C: { name: 'Centrocampisti', icon: <Activity className="w-4 h-4 text-emerald-400" />, color: 'border-emerald-500/30' },
    A: { name: 'Attaccanti', icon: <Zap className="w-4 h-4 text-rose-400" />, color: 'border-rose-500/30' },
  };

  const spentBudget = squad.reduce((sum, p) => sum + (p.boughtFor ?? 0), 0);

  // Filtro ricerca per il modal di aggiunta manuale
  const filteredAvailable = useMemo(() => {
    if (!searchTerm.trim()) return availablePlayers.slice(0, 30);
    const q = searchTerm.toLowerCase();
    return availablePlayers
      .filter(p => p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q))
      .slice(0, 30);
  }, [availablePlayers, searchTerm]);

  // Gestione modifica prezzo
  const handleStartEdit = (player: Player) => {
    setEditingPlayerId(player.id);
    setEditPriceValue((player.boughtFor ?? 0).toString());
  };

  const handleSaveEdit = (playerId: number) => {
    const num = parseInt(editPriceValue, 10);
    if (!isNaN(num) && num >= 0 && onUpdatePrice) {
      onUpdatePrice(playerId, num);
    }
    setEditingPlayerId(null);
  };

  // Gestione aggiunta manuale
  const handleConfirmAdd = () => {
    if (!selectedAddPlayer) return;
    const price = parseInt(addPriceValue, 10) || selectedAddPlayer.targetPrice || selectedAddPlayer.estPrice || 1;
    if (onAddPlayer) {
      onAddPlayer(selectedAddPlayer.id, price);
    }
    setIsAddModalOpen(false);
    setSelectedAddPlayer(null);
    setAddPriceValue('');
    setSearchTerm('');
  };

  // Copia negli appunti
  const handleCopyChat = async () => {
    const success = await copyRosterToClipboard(squad, spentBudget, totalBudget);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header Barra Riepilogo Rosa */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              MIA ROSA ({squad.length} / 25 Calciatori)
            </h2>
            <div className="text-xs text-slate-400">
              Spesi: <strong className="text-cyan-300">{spentBudget} cr</strong> | Residuo: <strong className="text-emerald-400">{remainingBudget} cr</strong>
            </div>
          </div>
        </div>

        {/* Pulsanti Azioni Rapide */}
        <div className="flex items-center gap-2">
          {onNavigateToPitch && (
            <button
              onClick={onNavigateToPitch}
              className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95"
              title="Visualizza formazione sul campo tattico 2D"
            >
              <span>🏟️ Campo 2D</span>
            </button>
          )}

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Aggiungi Giocatore
          </button>

          <button
            onClick={() => exportRosterToCSV(squad, `mia_rosa_${new Date().getFullYear()}.csv`)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-all"
            title="Scarica CSV (mia_rosa_2026.csv)"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={handleCopyChat}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 rounded-xl border border-slate-700 transition-all"
            title="Copia Formattato per Chat (WhatsApp/Telegram)"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Griglia Reparti (P, D, C, A) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map(role => {
          const roleSquad = squad.filter(p => p.role === role);
          const max = maxSlots[role];
          const roleSpent = roleSquad.reduce((sum, p) => sum + (p.boughtFor ?? 0), 0);
          const meta = roleTitles[role];

          return (
            <div
              key={role}
              className={`bg-slate-900/80 border ${meta.color} rounded-2xl p-4 shadow-xl space-y-3`}
            >
              {/* Header Reparto */}
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 font-bold text-sm text-slate-200">
                  {meta.icon}
                  <span>{meta.name}</span>
                  <span className="text-xs text-slate-400">({roleSquad.length}/{max})</span>
                </div>
                <span className="text-xs font-bold text-slate-400">
                  Totale: <strong className="text-white">{roleSpent} cr</strong>
                </span>
              </div>

              {/* Lista Calciatori nel Reparto */}
              {roleSquad.length === 0 ? (
                <div className="text-center py-6 text-slate-600 text-xs italic">
                  Nessun calciatore acquistato in questo reparto
                </div>
              ) : (
                <div className="space-y-2">
                  {roleSquad.map(player => {
                    const isEditing = editingPlayerId === player.id;

                    return (
                      <div
                        key={player.id}
                        className="bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 rounded-xl p-2.5 flex items-center justify-between gap-2 transition-all"
                      >
                        {/* Info Calciatore */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-bold text-xs text-white truncate">
                              {player.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold">
                              ({player.team})
                            </span>
                            <span className="text-[9px] bg-slate-800 text-slate-300 px-1 rounded">
                              Slot {player.slot}°
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            <span>CPS: <strong className="text-cyan-400">{(player.cps ?? 0).toFixed(1)}</strong></span>
                            <span>xFM: <strong className="text-slate-300">{(player.expectedBaseScore ?? 6.0).toFixed(1)}</strong></span>
                            {player.vorp !== undefined && player.vorp > 0 && (
                              <span className="text-emerald-400 font-bold">VORP +{player.vorp.toFixed(1)}</span>
                            )}
                          </div>
                        </div>

                        {/* Prezzo & Azioni (Edit / Svincola) */}
                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                value={editPriceValue}
                                onChange={e => setEditPriceValue(e.target.value)}
                                className="w-14 bg-slate-900 border border-cyan-500 rounded px-1.5 py-0.5 text-xs text-cyan-300 text-right font-bold"
                                autoFocus
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleSaveEdit(player.id);
                                  if (e.key === 'Escape') setEditingPlayerId(null);
                                }}
                              />
                              <button
                                onClick={() => handleSaveEdit(player.id)}
                                className="p-1 bg-emerald-600 hover:bg-emerald-500 text-black rounded"
                                title="Salva Prezzo"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setEditingPlayerId(null)}
                                className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded"
                                title="Annulla"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                                {player.boughtFor} cr
                              </span>

                              {/* Tasto Modifica Prezzo */}
                              <button
                                onClick={() => handleStartEdit(player)}
                                className="p-1 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition-all"
                                title="Modifica Prezzo Pagato"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Tasto Svincola / Rimuovi */}
                              <button
                                onClick={() => setReleasingPlayer(player)}
                                className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-all"
                                title="Svincola Calciatore e Recupera Crediti"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Widget Roster Completion & Pairing Intelligente */}
              {roleSquad.length < max && (
                <DepartmentCompletionWidget
                  role={role}
                  myRoster={squad}
                  availablePlayers={availablePlayers}
                  remainingBudget={remainingBudget}
                  openSlotsCount={max - roleSquad.length}
                  schedule={schedule}
                  pairingMatrix={pairingMatrix}
                  onAddPlayer={onAddPlayer}
                  onFocusPlayer={onFocusPlayer}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Modal Svincolo & Recupero Crediti */}
      <ReleasePlayerModal
        player={releasingPlayer}
        isOpen={!!releasingPlayer}
        onClose={() => setReleasingPlayer(null)}
        onConfirm={(playerId, refundAmount) => {
          if (onReleasePlayer) {
            onReleasePlayer(playerId, refundAmount);
          }
        }}
      />

      {/* Modal Aggiunta Manuale Calciatore */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl p-5 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <Plus className="w-5 h-5" /> Aggiungi Calciatore alla Rosa
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Input Ricerca */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cerca calciatore per nome o squadra..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                autoFocus
              />
            </div>

            {/* Lista Calciatori Disponibili */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-[200px]">
              {filteredAvailable.map(p => {
                const isSelected = selectedAddPlayer?.id === p.id;

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedAddPlayer(p);
                      setAddPriceValue((p.targetPrice || p.estPrice || 1).toString());
                    }}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer flex justify-between items-center transition-all ${
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200 shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                          p.role === 'P' ? 'bg-amber-500 text-black' :
                          p.role === 'D' ? 'bg-blue-500 text-white' :
                          p.role === 'C' ? 'bg-emerald-500 text-black' :
                          'bg-rose-500 text-white'
                        }`}>
                          {p.role}
                        </span>
                        <span>{p.name}</span>
                        <span className="text-[10px] text-slate-400">({p.team})</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Slot {p.slot}° | CPS: {(p.cps ?? 0).toFixed(1)} | Target: {p.targetPrice || p.estPrice} cr
                      </div>
                    </div>

                    <span className="text-xs font-bold text-cyan-400">
                      {p.targetPrice || p.estPrice} cr
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Sezione Conferma & Input Prezzo */}
            {selectedAddPlayer && (
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center justify-between gap-3">
                <div className="text-xs">
                  <div className="text-slate-400">Prezzo Pagato:</div>
                  <div className="font-bold text-white">{selectedAddPlayer.name} ({selectedAddPlayer.role})</div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={addPriceValue}
                    onChange={e => setAddPriceValue(e.target.value)}
                    className="w-20 bg-slate-900 border border-cyan-500 rounded-lg px-2 py-1 text-xs text-white text-right font-bold"
                    placeholder="Prezzo"
                  />
                  <button
                    onClick={handleConfirmAdd}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-md transition-all active:scale-95"
                  >
                    Conferma
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
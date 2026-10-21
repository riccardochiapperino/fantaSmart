'use client';

import React, { useState, useMemo } from 'react';
import { Player, ReplacementRecommendation, ScheduleGrid, PairingMatrix } from '@/lib/types';
import {
  RefreshCw,
  Search,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
  PlusCircle,
  CheckCircle,
  Shield,
  Zap,
} from 'lucide-react';
import { getNearestNeighborsReplacements } from '@/lib/advisor/recommender';
import { calculateAllPlayerScores, calculateCPS } from '@/lib/advisor/scoring';
import { calculateGoalkeeperAlternation, calculateComplementaryFDR } from '@/lib/advisor/pairingEngine';

interface Props {
  players: Player[];
  squad: Player[];
  remainingBudget: number;
  schedule?: ScheduleGrid;
  pairingMatrix?: PairingMatrix;
  selectedLostPlayer: Player | null;
  setSelectedLostPlayer: (player: Player | null) => void;
  onBuy: (playerId: number, price: number, isMine?: boolean) => void;
  onReleasePlayer?: (playerId: number) => void;
}

export function SostitutoTab({
  players,
  squad,
  remainingBudget,
  schedule,
  pairingMatrix,
  selectedLostPlayer,
  setSelectedLostPlayer,
  onBuy,
  onReleasePlayer,
}: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [buyingPlayer, setBuyingPlayer] = useState<Player | null>(null);
  const [buyPriceInput, setBuyPriceInput] = useState<string>('');

  const lostPlayers = useMemo(() => {
    return players.filter(p => p.isLost);
  }, [players]);

  const availablePlayers = useMemo(() => {
    return players.filter(p => p.boughtFor === undefined && !p.isLost);
  }, [players]);

  // Calcolo CPS e Target Prices per tutti i calciatori liberi
  const { cpsMap, targetPriceMap } = useMemo(() => {
    const scoresMap = calculateAllPlayerScores(players);
    const cpsOnlyMap = new Map<number, number>();
    const priceMap = new Map<number, number>();

    scoresMap.forEach((val, key) => cpsOnlyMap.set(key, val.cps));
    players.forEach(p => priceMap.set(p.id, p.targetPrice || p.estPrice || 1));

    return { cpsMap: cpsOnlyMap, targetPriceMap: priceMap };
  }, [players]);

  // Top 3 Sostituti k-NN per il giocatore selezionato
  const recommendations: ReplacementRecommendation[] = useMemo(() => {
    if (!selectedLostPlayer) return [];
    return getNearestNeighborsReplacements(
      selectedLostPlayer,
      availablePlayers,
      cpsMap,
      targetPriceMap,
      4
    );
  }, [selectedLostPlayer, availablePlayers, cpsMap, targetPriceMap]);

  // Calcola compatibilità di calendario di ciascun sostituto rispetto alla rosa attuale
  const getCalendarInfo = (replacement: Player) => {
    const role = replacement.role;
    const myRoleSquad = squad.filter(p => p.role === role);

    if (myRoleSquad.length === 0) {
      return { note: 'Nessun compagno di reparto in rosa', value: '' };
    }

    if (role === 'P') {
      let bestAlt = 0;
      let partner = myRoleSquad[0];

      for (const myGk of myRoleSquad) {
        let alt = 0.5;
        if (pairingMatrix?.goalkeeperAlternation?.[myGk.team]?.[replacement.team] !== undefined) {
          alt = pairingMatrix.goalkeeperAlternation[myGk.team][replacement.team];
        } else if (schedule) {
          alt = calculateGoalkeeperAlternation(myGk.team, replacement.team, schedule);
        }
        if (alt > bestAlt) {
          bestAlt = alt;
          partner = myGk;
        }
      }

      return {
        note: `Alternanza ${(bestAlt * 100).toFixed(0)}% con ${partner.name} (${partner.team})`,
        value: `${(bestAlt * 100).toFixed(0)}% Alt`,
        isGood: bestAlt >= 0.85,
      };
    } else {
      let bestFdr = 5.0;
      let partner = myRoleSquad[0];

      for (const myOutfield of myRoleSquad) {
        let fdr = 3.0;
        if (pairingMatrix?.complementaryFDR?.[myOutfield.team]?.[replacement.team] !== undefined) {
          fdr = pairingMatrix.complementaryFDR[myOutfield.team][replacement.team];
        } else if (schedule) {
          fdr = calculateComplementaryFDR(myOutfield.team, replacement.team, schedule);
        }
        if (fdr < bestFdr) {
          bestFdr = fdr;
          partner = myOutfield;
        }
      }

      return {
        note: `FDR Medio: ${bestFdr} con ${partner.name} (${partner.team})`,
        value: `FDR Min: ${bestFdr}`,
        isGood: bestFdr <= 2.8,
      };
    }
  };

  const handleConfirmBuy = () => {
    if (!buyingPlayer) return;
    const price = parseInt(buyPriceInput, 10) || buyingPlayer.targetPrice || buyingPlayer.estPrice || 1;
    onBuy(buyingPlayer.id, price, true);
    setBuyingPlayer(null);
    setBuyPriceInput('');
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400">
            <RefreshCw className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              SOSTITUTI &amp; ALTERNATIVE
            </h2>
            <div className="text-xs text-slate-400">
              Trova i migliori calciatori alternativi per rendimento e budget in caso di asta persa.
            </div>
          </div>
        </div>

        <div className="text-xs font-bold text-slate-300 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          Budget Residuo: <strong className="text-emerald-400">{remainingBudget} cr</strong>
        </div>
      </div>

      {/* Selettore Calciatore Perso / Sotto Osservazione */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
        <label className="text-xs font-bold text-cyan-300 block">
          SELEZIONA CALCIATORE PERSO O DA CONFRONTARE:
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Menu a tendina Calciatori Soffiati */}
          <div>
            <span className="text-[11px] text-slate-400 block mb-1">
              Calciatori Assegnati ai Rivali ({lostPlayers.length}):
            </span>
            <select
              className="w-full bg-slate-950 text-xs p-2.5 rounded-xl border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
              value={selectedLostPlayer?.id || ''}
              onChange={e => {
                const found = players.find(p => p.id === Number(e.target.value));
                setSelectedLostPlayer(found || null);
              }}
            >
              <option value="">-- Seleziona tra i calciatori persi --</option>
              {lostPlayers.map(p => (
                <option key={p.id} value={p.id}>
                  [{p.role}] {p.name} ({p.team}) - Slot {p.slot}° | Valore: {p.targetPrice || p.estPrice} cr
                </option>
              ))}
            </select>
          </div>

          {/* Ricerca generica nel Listone */}
          <div>
            <span className="text-[11px] text-slate-400 block mb-1">
              Oppure cerca qualsiasi calciatore nel Listone:
            </span>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cerca nome calciatore..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            {searchTerm.trim() && (
              <div className="bg-slate-950 border border-slate-700 rounded-xl mt-1 max-h-40 overflow-y-auto space-y-1 p-1 absolute z-20 w-full max-w-md shadow-2xl">
                {players
                  .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .slice(0, 10)
                  .map(p => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedLostPlayer(p);
                        setSearchTerm('');
                      }}
                      className="p-1.5 hover:bg-slate-800 rounded-lg text-xs cursor-pointer flex justify-between text-slate-200"
                    >
                      <span>[{p.role}] {p.name} ({p.team})</span>
                      <span className="text-cyan-400 font-bold">{p.targetPrice || p.estPrice} cr</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card Calciatore Target Selezionato */}
      {selectedLostPlayer && (
        <div className="bg-slate-950 border border-cyan-900/80 rounded-2xl p-4 shadow-xl space-y-3">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                Calciatore di Riferimento:
              </span>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-black ${
                  selectedLostPlayer.role === 'P' ? 'bg-amber-500 text-black' :
                  selectedLostPlayer.role === 'D' ? 'bg-blue-500 text-white' :
                  selectedLostPlayer.role === 'C' ? 'bg-emerald-500 text-black' :
                  'bg-rose-500 text-white'
                }`}>
                  {selectedLostPlayer.role}
                </span>
                <span>{selectedLostPlayer.name}</span>
                <span className="text-xs text-slate-400">({selectedLostPlayer.team})</span>
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-[10px] text-slate-400">Prezzo Consigliato</div>
                <div className="text-base font-black text-cyan-300">
                  {selectedLostPlayer.targetPrice || selectedLostPlayer.estPrice} cr
                </div>
              </div>

              {selectedLostPlayer.isLost && onReleasePlayer && (
                <button
                  type="button"
                  onClick={() => {
                    onReleasePlayer(selectedLostPlayer.id);
                    setSelectedLostPlayer(null);
                  }}
                  className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500 border border-amber-500/40 text-amber-300 hover:text-black font-extrabold text-xs rounded-xl transition-all"
                  title="Annulla stato 'Perso' e torna libero"
                >
                  ↩️ Svincola / Torna Libero
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 font-semibold">Indice Rendimento</div>
              <div className="font-bold text-cyan-400">{(selectedLostPlayer.cps ?? calculateCPS(selectedLostPlayer)).toFixed(1)}</div>
            </div>
            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 font-semibold">Fantamedia Attesa</div>
              <div className="font-bold text-slate-200">{(selectedLostPlayer.expectedBaseScore ?? 6.0).toFixed(1)}</div>
            </div>
            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 font-semibold">Fascia Slot</div>
              <div className="font-bold text-slate-200">Slot {selectedLostPlayer.slot}°</div>
            </div>
            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 font-semibold">Titolarità</div>
              <div className="font-bold text-amber-400">{Math.round((selectedLostPlayer.starterScore ?? selectedLostPlayer.titolarita ?? 0.65) * 100)}%</div>
            </div>
          </div>
        </div>
      )}

      {/* Griglia Sostituti Consigliati */}
      {selectedLostPlayer && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
            <TrendingUp className="w-4 h-4 text-emerald-400" /> Alternative Consigliate per Valore e Budget:
          </h4>

          {recommendations.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs italic">
              Nessun sostituto disponibile per questo ruolo nel pool di calciatori liberi.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recommendations.map((rec, idx) => {
                const rep = rec.replacement;
                const calInfo = getCalendarInfo(rep);

                return (
                  <div
                    key={rep.id}
                    className="bg-slate-900 border border-slate-800 hover:border-cyan-500/80 rounded-2xl p-4 shadow-xl space-y-3 transition-all"
                  >
                    {/* Header Sostituto */}
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                            #{idx + 1}
                          </span>
                          <h5 className="font-bold text-sm text-white">{rep.name}</h5>
                          <span className="text-xs text-slate-400">({rep.team})</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">{rec.matchReason}</p>
                      </div>

                      <span className="text-[11px] font-black text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded-lg border border-emerald-800">
                        Consigliato
                      </span>
                    </div>

                    {/* Metriche Sostituto */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 text-xs text-center">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Rendimento</span>
                        <span className="font-bold text-cyan-400">{(rep.cps ?? calculateCPS(rep)).toFixed(1)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Prezzo Consigliato</span>
                        <span className="font-bold text-emerald-400">{rep.targetPrice || rep.estPrice} cr</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Slot</span>
                        <span className="font-bold text-slate-300">Slot {rep.slot}°</span>
                      </div>
                    </div>

                    {/* Compatibilità Calendario */}
                    {calInfo.value && (
                      <div className="flex justify-between items-center bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800 text-[11px]">
                        <span className="text-slate-400">{calInfo.note}</span>
                        <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                          calInfo.isGood ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {calInfo.value}
                        </span>
                      </div>
                    )}

                    {/* Tasto Acquista Subito */}
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => {
                          setBuyingPlayer(rep);
                          setBuyPriceInput((rep.targetPrice || rep.estPrice || 1).toString());
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
                      >
                        <PlusCircle className="w-4 h-4" /> Acquista Sostituto
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal Acquisto Rapido */}
      {buyingPlayer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-emerald-400" /> Acquista {buyingPlayer.name} ({buyingPlayer.team})
            </div>

            <p className="text-xs text-slate-400">
              Inserisci il prezzo reale pagato per inserire il calciatore nella tua rosa:
            </p>

            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                value={buyPriceInput}
                onChange={e => setBuyPriceInput(e.target.value)}
                className="w-full bg-slate-950 border border-cyan-500 rounded-xl px-3 py-2 text-sm text-white font-bold"
                placeholder="Prezzo in crediti"
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter') handleConfirmBuy();
                }}
              />
              <button
                onClick={handleConfirmBuy}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Conferma
              </button>
            </div>

            <div className="text-right">
              <button
                onClick={() => setBuyingPlayer(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
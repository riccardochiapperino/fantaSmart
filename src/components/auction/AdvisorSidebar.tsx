'use client';

import React, { useState, useMemo } from 'react';
import {
  Player,
  ReplacementRecommendation,
  PairingScore,
  NominationRecommendation,
  AdvisorState,
  Role,
} from '@/lib/types';
import { Users, Calendar, Target, Sparkles, RefreshCw, PlusCircle, Shield, Activity } from 'lucide-react';
import { getBestGoalkeeperPairings, getBestOutfieldPairings } from '@/lib/advisor/pairingEngine';

interface Props {
  selectedPlayer: Player | null;
  advisorState?: AdvisorState;
  recommendations: {
    replacements: ReplacementRecommendation[];
    calendarPairings: PairingScore[];
  };
  nominations: NominationRecommendation[];
  onBuyPlayer: (player: Player, price: number) => void;
  onSelectPlayer: (player: Player) => void;
}

export function AdvisorSidebar({
  selectedPlayer,
  advisorState,
  recommendations,
  nominations,
  onBuyPlayer,
  onSelectPlayer,
}: Props) {
  const [activeTab, setActiveTab] = useState<'knn' | 'pairing' | 'nomination'>('knn');
  const [pairingRoleFilter, setPairingRoleFilter] = useState<Role>('P');

  const { replacements, calendarPairings } = recommendations;

  // Calcolo automatico dei migliori abbinamenti di calendario in base ai giocatori già in rosa
  const liveRosterPairings = useMemo(() => {
    if (!advisorState) return { goalkeepers: [], defenders: [], midfielders: [] };

    const myRoster = advisorState.myRoster;
    const availablePlayers = advisorState.availablePlayers;
    const pairingMatrix = advisorState.pairingMatrix;
    const schedule = advisorState.schedule;

    const myGkTeams = myRoster.filter(p => p.role === 'P').map(p => p.team);
    const myDefTeams = myRoster.filter(p => p.role === 'D').map(p => p.team);
    const myMidTeams = myRoster.filter(p => p.role === 'C').map(p => p.team);

    const goalkeepers = myGkTeams.length > 0
      ? getBestGoalkeeperPairings(myGkTeams, availablePlayers, pairingMatrix, schedule, 6)
      : [];

    const defenders = myDefTeams.length > 0
      ? getBestOutfieldPairings(myDefTeams, 'D', availablePlayers, pairingMatrix, schedule, 6)
      : [];

    const midfielders = myMidTeams.length > 0
      ? getBestOutfieldPairings(myMidTeams, 'C', availablePlayers, pairingMatrix, schedule, 6)
      : [];

    return { goalkeepers, defenders, midfielders };
  }, [advisorState]);

  return (
    <aside className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl space-y-3 flex flex-col h-full backdrop-blur-md">
      {/* Sidebar Header & Tab Switcher */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs">
          <Sparkles className="w-4 h-4" /> CONSIGLI &amp; SUGGERIMENTI
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
        <button
          onClick={() => setActiveTab('knn')}
          className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
            activeTab === 'knn'
              ? 'bg-cyan-500 text-black shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5" /> Sostituti
        </button>
        <button
          onClick={() => setActiveTab('pairing')}
          className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
            activeTab === 'pairing'
              ? 'bg-cyan-500 text-black shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" /> Calendario
        </button>
        <button
          onClick={() => setActiveTab('nomination')}
          className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
            activeTab === 'nomination'
              ? 'bg-cyan-500 text-black shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Target className="w-3.5 h-3.5" /> Chiamate
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
        {/* TAB 1: SOSTITUTI DIRETTI */}
        {activeTab === 'knn' && (
          <div className="space-y-2">
            {!selectedPlayer ? (
              <div className="text-center py-6 text-slate-500">
                <Users className="w-6 h-6 mx-auto mb-1 text-slate-600" />
                <p>Seleziona un calciatore per visualizzare le migliori alternative.</p>
              </div>
            ) : replacements.length === 0 ? (
              <div className="text-center py-6 text-slate-500">
                <p>Nessun sostituto disponibile per {selectedPlayer.name}.</p>
              </div>
            ) : (
              replacements.map(rec => (
                <div
                  key={rec.replacement.id}
                  className="bg-slate-950 p-3 rounded-xl border border-cyan-900/60 hover:border-cyan-500 transition-all space-y-1.5"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-cyan-300">
                      {rec.replacement.name} <span className="text-[10px] text-slate-400">({rec.replacement.team})</span>
                    </span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded font-bold border border-emerald-800">
                      Consigliato
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400">{rec.matchReason}</p>

                  <div className="flex justify-between items-center pt-1 border-t border-slate-800/80">
                    <span className="text-[11px] text-slate-300">
                      Target: <strong className="text-cyan-400">{rec.replacement.targetPrice || rec.replacement.estPrice} cr</strong>
                    </span>
                    <button
                      onClick={() => onSelectPlayer(rec.replacement)}
                      className="bg-cyan-600 hover:bg-cyan-500 text-black text-[11px] font-bold px-2 py-1 rounded-md flex items-center gap-1"
                    >
                      <PlusCircle className="w-3 h-3" /> Seleziona
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: PAIRING LIVE */}
        {activeTab === 'pairing' && (
          <div className="space-y-3">
            {/* Sub-selector di ruolo per il pairing automatico da rosa */}
            <div className="flex gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800 text-[11px] font-bold">
              <button
                onClick={() => setPairingRoleFilter('P')}
                className={`flex-1 py-1 rounded text-center transition-all ${
                  pairingRoleFilter === 'P' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🧤 Portieri
              </button>
              <button
                onClick={() => setPairingRoleFilter('D')}
                className={`flex-1 py-1 rounded text-center transition-all ${
                  pairingRoleFilter === 'D' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🛡️ Difesa
              </button>
              <button
                onClick={() => setPairingRoleFilter('C')}
                className={`flex-1 py-1 rounded text-center transition-all ${
                  pairingRoleFilter === 'C' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ⚙️ Centrocampo
              </button>
            </div>

            {/* Visualizzazione Portieri */}
            {pairingRoleFilter === 'P' && (
              <div className="space-y-2">
                {liveRosterPairings.goalkeepers.length === 0 ? (
                  <div className="text-center py-4 text-slate-500 text-xs">
                    <Calendar className="w-5 h-5 mx-auto mb-1 text-slate-600" />
                    <p>Acquista il 1° Portiere per visualizzare le coppie ad alternanza ottimale (Casa/Trasferta &gt; 90%).</p>
                  </div>
                ) : (
                  liveRosterPairings.goalkeepers.map((pair, idx) => (
                    <div
                      key={pair.playerB.id}
                      className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 hover:border-amber-500/50 transition-all space-y-1"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-100">
                          #{idx + 1} {pair.playerB.name} <span className="text-[10px] text-slate-400">({pair.playerB.team})</span>
                        </span>
                        <span className="text-[10px] text-amber-400 font-bold bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800">
                          {(pair.alternationPct * 100).toFixed(0)}% Alt
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{pair.notes}</p>
                      <div className="flex justify-between items-center pt-1 border-t border-slate-800/80">
                        <span className="text-[10px] text-slate-400">Target: {pair.playerB.targetPrice || pair.playerB.estPrice} cr</span>
                        <button
                          onClick={() => onSelectPlayer(pair.playerB)}
                          className="text-[11px] font-bold text-amber-400 hover:underline"
                        >
                          Seleziona
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Visualizzazione Difensori */}
            {pairingRoleFilter === 'D' && (
              <div className="space-y-2">
                {liveRosterPairings.defenders.length === 0 ? (
                  <div className="text-center py-4 text-slate-500 text-xs">
                    <Shield className="w-5 h-5 mx-auto mb-1 text-slate-600" />
                    <p>Acquista difensori per visualizzare i partner di reparto che minimizzano l'indice PairFDR.</p>
                  </div>
                ) : (
                  liveRosterPairings.defenders.map((pair, idx) => (
                    <div
                      key={pair.player.id}
                      className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 hover:border-blue-500/50 transition-all space-y-1"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-100">
                          #{idx + 1} {pair.player.name} <span className="text-[10px] text-slate-400">({pair.player.team})</span>
                        </span>
                        <span className="text-[10px] text-blue-400 font-bold bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-800">
                          FDR Min: {pair.complementaryFdr}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">Partner ideale per {pair.partnerTeam} (Alt: {(pair.alternationPct * 100).toFixed(0)}%)</p>
                      <div className="flex justify-between items-center pt-1 border-t border-slate-800/80">
                        <span className="text-[10px] text-slate-400">Target: {pair.player.targetPrice || pair.player.estPrice} cr</span>
                        <button
                          onClick={() => onSelectPlayer(pair.player)}
                          className="text-[11px] font-bold text-blue-400 hover:underline"
                        >
                          Seleziona
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Visualizzazione Centrocampisti */}
            {pairingRoleFilter === 'C' && (
              <div className="space-y-2">
                {liveRosterPairings.midfielders.length === 0 ? (
                  <div className="text-center py-4 text-slate-500 text-xs">
                    <Activity className="w-5 h-5 mx-auto mb-1 text-slate-600" />
                    <p>Acquista centrocampisti per visualizzare i partner di reparto con calendario complementare.</p>
                  </div>
                ) : (
                  liveRosterPairings.midfielders.map((pair, idx) => (
                    <div
                      key={pair.player.id}
                      className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 hover:border-emerald-500/50 transition-all space-y-1"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-100">
                          #{idx + 1} {pair.player.name} <span className="text-[10px] text-slate-400">({pair.player.team})</span>
                        </span>
                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800">
                          FDR Min: {pair.complementaryFdr}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">Partner ideale per {pair.partnerTeam} (Alt: {(pair.alternationPct * 100).toFixed(0)}%)</p>
                      <div className="flex justify-between items-center pt-1 border-t border-slate-800/80">
                        <span className="text-[10px] text-slate-400">Target: {pair.player.targetPrice || pair.player.estPrice} cr</span>
                        <button
                          onClick={() => onSelectPlayer(pair.player)}
                          className="text-[11px] font-bold text-emerald-400 hover:underline"
                        >
                          Seleziona
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CHI CHIAMARE */}
        {activeTab === 'nomination' && (
          <div className="space-y-2">
            {nominations.length === 0 ? (
              <div className="text-center py-6 text-slate-500">
                <p>Nessuna chiamata suggerita al momento.</p>
              </div>
            ) : (
              nominations.map(nom => (
                <div
                  key={nom.player.id}
                  className={`p-3 rounded-xl border space-y-1 ${
                    nom.type === 'target'
                      ? 'bg-emerald-950/20 border-emerald-800/80'
                      : 'bg-rose-950/20 border-rose-900/80'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                        nom.type === 'target'
                          ? 'bg-emerald-500 text-black'
                          : 'bg-amber-500 text-black'
                      }`}
                    >
                      {nom.type === 'target' ? 'CONSIGLIATO' : 'CHIAMATA STRATEGICA'}
                    </span>
                    <span className="font-bold text-slate-200">
                      {nom.player.name} ({nom.player.role})
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300">{nom.reason}</p>

                  <div className="flex justify-between items-center pt-1 border-t border-slate-800/60">
                    <span className="text-[10px] text-slate-400">
                      Est. Price: {nom.estimatedDynamicPrice} cr
                    </span>
                    <button
                      onClick={() => onSelectPlayer(nom.player)}
                      className="text-[11px] font-bold text-cyan-400 hover:underline"
                    >
                      Metti in Battuta
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

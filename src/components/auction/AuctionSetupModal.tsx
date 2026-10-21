'use client';

import React, { useState } from 'react';
import { LeagueConfig, Player } from '@/lib/types';
import { buildCompleteDataset } from '@/lib/ingestion';
import { Sliders, Upload, CheckCircle2, ShieldCheck, AlertCircle, X, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: LeagueConfig;
  onSaveSetup: (newConfig: LeagueConfig, newPlayers?: Player[]) => void;
}

export function AuctionSetupModal({
  isOpen,
  onClose,
  currentConfig,
  onSaveSetup,
}: Props) {
  const [numTeams, setNumTeams] = useState(currentConfig.numTeams || 8);
  const [initialBudget, setInitialBudget] = useState(currentConfig.initialBudget || 500);
  const [defenseModifier, setDefenseModifier] = useState(currentConfig.defenseModifier ?? true);

  const [isLoading, setIsLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [parsedPlayers, setParsedPlayers] = useState<Player[] | undefined>(undefined);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const buffer = await file.arrayBuffer();
      const dataset = await buildCompleteDataset({
        playersSource: buffer,
        config: { numTeams, initialBudget, defenseModifier },
      });

      setParsedPlayers(dataset.players);
      setUploadSuccess(`Caricati con successo ${dataset.players.length} calciatori dal listone!`);
    } catch (err: any) {
      console.error('Errore caricamento file:', err);
      setUploadError(err.message || 'Errore durante la lettura del file Excel/CSV.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    const updatedConfig: LeagueConfig = {
      ...currentConfig,
      numTeams,
      initialBudget,
      defenseModifier,
    };
    onSaveSetup(updatedConfig, parsedPlayers);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/60">
          <div className="flex items-center gap-2 text-cyan-400">
            <Sliders className="w-5 h-5" />
            <h2 className="font-extrabold text-base text-slate-100">Configurazione Asta Live 2026/2027</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-sm text-slate-200">
          {/* Impostazioni di Lega */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" /> Regolamento & Budget Lega
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Partecipanti */}
              <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/80">
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Numero Squadre Partecipanti:
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={6}
                    max={16}
                    value={numTeams}
                    onChange={e => setNumTeams(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white font-bold text-center focus:border-cyan-500 focus:outline-none"
                  />
                  <span className="text-xs text-slate-400 whitespace-nowrap">squadre</span>
                </div>
              </div>

              {/* Budget Iniziale */}
              <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/80">
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Budget Iniziale per Squadra:
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={100}
                    max={2000}
                    step={50}
                    value={initialBudget}
                    onChange={e => setInitialBudget(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white font-bold text-center focus:border-cyan-500 focus:outline-none"
                  />
                  <span className="text-xs text-slate-400 font-bold">cr</span>
                </div>
              </div>
            </div>

            {/* Toggle Modificatore Difesa */}
            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-100">Modificatore di Difesa</h4>
                  <p className="text-[11px] text-slate-400">
                    Aumenta il peso VORP e i prezzi target dei difensori da voto alto (+38% boost)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDefenseModifier(!defenseModifier)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  defenseModifier ? 'bg-cyan-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    defenseModifier ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Upload Listone Excel/CSV */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-cyan-400" /> Carica Listone Ufficiale (Excel / CSV)
            </h3>

            <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-xl p-6 text-center transition-all bg-slate-950/40 relative">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="w-8 h-8 text-cyan-400 mx-auto mb-2 opacity-80" />
              <p className="font-bold text-xs text-slate-200">
                Trascina qui il file `.xlsx` o `.csv` oppure <span className="text-cyan-400 underline">sfoglia</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Supporta i listoni ufficiali Fantacalcio (colonne Qt.A, FVM, Nome, Squadra, Ruolo)
              </p>
            </div>

            {isLoading && (
              <div className="text-xs text-cyan-400 font-semibold animate-pulse text-center py-2">
                Parsing ed elaborazione VORP in corso...
              </div>
            )}

            {uploadSuccess && (
              <div className="bg-emerald-950/60 border border-emerald-800 text-emerald-300 p-3 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{uploadSuccess}</span>
              </div>
            )}

            {uploadError && (
              <div className="bg-rose-950/60 border border-rose-800 text-rose-300 p-3 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg transition-all"
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg transition-all shadow-lg flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" /> Salva & Inizia Asta Live
          </button>
        </div>
      </div>
    </div>
  );
}

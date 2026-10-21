'use client';

import React, { useState } from 'react';
import { LeagueConfig } from '@/lib/types';
import { Plus, X, Users, Wallet, Shield, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, config: LeagueConfig) => void;
}

export function CreateAuctionModal({ isOpen, onClose, onCreate }: Props) {
  const [name, setName] = useState('');
  const [numTeams, setNumTeams] = useState(8);
  const [initialBudget, setInitialBudget] = useState(500);
  const [defenseModifier, setDefenseModifier] = useState(true);
  const [slots, setSlots] = useState({ P: 3, D: 8, C: 8, A: 6 });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || `Nuova Asta (${numTeams} Squadre)`;
    onCreate(finalName, {
      numTeams,
      initialBudget,
      defenseModifier,
      slotsPerRole: slots,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-5 sm:zoom-in-95">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Crea Nuova Asta / Lega
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Imposta le regole e il budget per iniziare una nuova sessione
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Nome Lega */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              Nome della Lega / Asta
            </label>
            <input
              type="text"
              required
              placeholder="es. Lega Fantacalcio Ufficio 2026"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-medium"
            />
          </div>

          {/* Numero Partecipanti */}
          <div className="space-y-1">
            <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
              <span>Numero Partecipanti</span>
              <span className="text-cyan-600 dark:text-cyan-400">{numTeams} Squadre</span>
            </div>
            <input
              type="range"
              min="6"
              max="16"
              value={numTeams}
              onChange={e => setNumTeams(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>

          {/* Budget Iniziale */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              Budget Iniziale per Squadra
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[500, 600, 800, 1000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setInitialBudget(val)}
                  className={`py-2 rounded-xl border font-bold text-xs transition-all ${
                    initialBudget === val
                      ? 'bg-cyan-500 border-cyan-400 text-black shadow-md'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  {val} cr
                </button>
              ))}
            </div>
          </div>

          {/* Modificatore Difesa */}
          <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div>
              <div className="font-bold text-slate-900 dark:text-white">Modificatore di Difesa</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Aumenta del 38% la quota budget allocata ai difensori top
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDefenseModifier(!defenseModifier)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                defenseModifier ? 'bg-cyan-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  defenseModifier ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Buttons Submit */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold rounded-xl shadow-lg transition-all active:scale-95"
            >
              Crea Asta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

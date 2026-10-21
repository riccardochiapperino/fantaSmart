'use client';

import React, { useState } from 'react';
import { LeagueConfig, Role } from '@/lib/types';
import { Users, DollarSign, Shield, Save, Check } from 'lucide-react';

interface Props {
  config: LeagueConfig;
  onSaveConfig: (newConfig: Partial<LeagueConfig>) => void;
}

export function LeagueSettingsTab({ config, onSaveConfig }: Props) {
  const [numTeams, setNumTeams] = useState(config.numTeams || 8);
  const [initialBudget, setInitialBudget] = useState(config.initialBudget || 500);
  const [defenseModifier, setDefenseModifier] = useState(config.defenseModifier ?? true);
  const [slots, setSlots] = useState<Record<Role, number>>(
    config.slotsPerRole || { P: 3, D: 8, C: 8, A: 6 }
  );
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSaveConfig({
      numTeams,
      initialBudget,
      defenseModifier,
      slotsPerRole: slots,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSlotChange = (role: Role, val: number) => {
    setSlots(prev => ({ ...prev, [role]: Math.max(1, val) }));
  };

  const totalSlots = slots.P + slots.D + slots.C + slots.A;

  return (
    <div className="space-y-4 text-xs">
      {/* Numero Partecipanti */}
      <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex justify-between items-center">
          <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            Numero Partecipanti Lega
          </label>
          <span className="font-black text-sm text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950 px-2.5 py-0.5 rounded-lg border border-cyan-300 dark:border-cyan-800">
            {numTeams} Squadre
          </span>
        </div>
        <input
          type="range"
          min="6"
          max="16"
          step="1"
          value={numTeams}
          onChange={e => setNumTeams(Number(e.target.value))}
          className="w-full accent-cyan-500 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
          <span>6 sq.</span>
          <span>8 sq. (Standard)</span>
          <span>10 sq.</span>
          <span>12 sq.</span>
          <span>16 sq.</span>
        </div>
      </div>

      {/* Budget Totale */}
      <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex justify-between items-center">
          <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Budget Iniziale per Partecipante
          </label>
          <span className="font-black text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 rounded-lg border border-emerald-300 dark:border-emerald-800">
            {initialBudget} crediti
          </span>
        </div>
        <div className="flex items-center gap-2">
          {[500, 600, 800, 1000].map(val => (
            <button
              key={val}
              type="button"
              onClick={() => setInitialBudget(val)}
              className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                initialBudget === val
                  ? 'bg-emerald-500 text-black border-emerald-400 shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              {val} cr
            </button>
          ))}
          <input
            type="number"
            min="100"
            max="5000"
            value={initialBudget}
            onChange={e => setInitialBudget(Number(e.target.value))}
            className="w-20 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-right font-bold text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Modificatore Difesa */}
      <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
        <div>
          <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Modificatore Difesa
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Aumenta del +38% la quota budget per i difensori da voto alto.
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDefenseModifier(!defenseModifier)}
          className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
            defenseModifier ? 'bg-cyan-500 justify-end' : 'bg-slate-300 dark:bg-slate-800 justify-start'
          }`}
        >
          <div className="bg-white w-4 h-4 rounded-full shadow-md" />
        </button>
      </div>

      {/* Configurazione Slot per Ruolo */}
      <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
        <div className="flex justify-between items-center">
          <label className="font-bold text-slate-800 dark:text-slate-200">
            Slot per Reparto (Totale: {totalSlots} Calciatori)
          </label>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {(['P', 'D', 'C', 'A'] as Role[]).map(role => (
            <div
              key={role}
              className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-center space-y-1"
            >
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                role === 'P' ? 'bg-amber-500 text-black' :
                role === 'D' ? 'bg-blue-500 text-white' :
                role === 'C' ? 'bg-emerald-500 text-black' :
                'bg-rose-500 text-white'
              }`}>
                {role}
              </span>
              <input
                type="number"
                min="1"
                max="12"
                value={slots[role]}
                onChange={e => handleSlotChange(role, Number(e.target.value))}
                className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-1 text-center font-bold text-slate-900 dark:text-white"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Bottone Salvataggio */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{saved ? 'Salvato!' : 'Salva Parametri Lega'}</span>
        </button>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { Sliders, AlertTriangle, Zap, Target, Save, Check, Activity } from 'lucide-react';

interface AlgorithmSettings {
  panicBuyCapPct: number; // default: 15%
  injurySensitivity: number; // default: 1.0 (0.5 to 2.0)
  strategyPreset: 'balanced' | 'aggressive' | 'moneyball';
}

const DEFAULT_ALGO_SETTINGS: AlgorithmSettings = {
  panicBuyCapPct: 15,
  injurySensitivity: 1.0,
  strategyPreset: 'balanced',
};

export function AlgorithmSettingsTab() {
  const [settings, setSettings] = useState<AlgorithmSettings>(DEFAULT_ALGO_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('fanta_algorithm_settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch {
      // Use defaults
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('fanta_algorithm_settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Panic Buy Cap Setting */}
      <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex justify-between items-center">
          <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            Tetto Massimo di Spesa per Calciatore
          </label>
          <span className="font-black text-sm text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950 px-2 py-0.5 rounded-lg border border-rose-300 dark:border-rose-800">
            +{settings.panicBuyCapPct}% Max
          </span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Soglia percentuale oltre il Prezzo Target al raggiungimento della quale il sistema consiglia di abbandonare l'asta.
        </p>
        <input
          type="range"
          min="5"
          max="35"
          step="5"
          value={settings.panicBuyCapPct}
          onChange={e => setSettings(prev => ({ ...prev, panicBuyCapPct: Number(e.target.value) }))}
          className="w-full accent-rose-500 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
          <span>+5% (Disciplinato)</span>
          <span>+15% (Standard)</span>
          <span>+25% (Flessibile)</span>
          <span>+35% (Aggressivo)</span>
        </div>
      </div>

      {/* Strategia Consigliata */}
      <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
        <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Target className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          Strategia Consigliata di Distribuzione Budget
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            {
              id: 'balanced',
              title: '⚖️ Bilanciata',
              desc: 'Focus Modificatore e centrocampo solido.',
            },
            {
              id: 'aggressive',
              title: '🔥 Aggressiva',
              desc: 'Massima spesa sul 1° slot d\'attacco (+45%).',
            },
            {
              id: 'moneyball',
              title: '📊 Moneyball',
              desc: 'Puro VORP/Prezzo ed efficienza statistica.',
            },
          ].map(preset => (
            <div
              key={preset.id}
              onClick={() => setSettings(prev => ({ ...prev, strategyPreset: preset.id as any }))}
              className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                settings.strategyPreset === preset.id
                  ? 'bg-cyan-50 dark:bg-cyan-950/60 border-cyan-500 text-cyan-900 dark:text-cyan-200 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              <div className="font-bold text-slate-900 dark:text-white mb-0.5">{preset.title}</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{preset.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sensibilità Infortuni */}
      <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex justify-between items-center">
          <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-amber-500" />
            Penalizzazione Rischio Infortuni su CPS
          </label>
          <span className="font-bold text-amber-600 dark:text-amber-400">
            {settings.injurySensitivity.toFixed(1)}x Peso
          </span>
        </div>
        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.1"
          value={settings.injurySensitivity}
          onChange={e => setSettings(prev => ({ ...prev, injurySensitivity: Number(e.target.value) }))}
          className="w-full accent-amber-500 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
          <span>0.5x (Basso impatto)</span>
          <span>1.0x (Standard)</span>
          <span>2.0x (Massima cautela)</span>
        </div>
      </div>

      {/* Salvataggio */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{saved ? 'Salvato!' : 'Salva Parametri Algoritmo'}</span>
        </button>
      </div>
    </div>
  );
}

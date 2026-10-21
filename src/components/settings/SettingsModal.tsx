'use client';

import React, { useState } from 'react';
import {
  Settings,
  X,
  Sun,
  Moon,
  Laptop,
  Users,
  Sliders,
  Database,
  Check,
} from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';
import { LeagueConfig } from '@/lib/types';
import { LeagueSettingsTab } from './LeagueSettingsTab';
import { AlgorithmSettingsTab } from './AlgorithmSettingsTab';
import { DataManagementTab } from './DataManagementTab';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  leagueConfig?: LeagueConfig;
  onSaveLeagueConfig?: (newConfig: Partial<LeagueConfig>) => void;
  onExportBackup?: () => void;
  onImportBackup?: (jsonStr: string) => void;
  onResetAuction?: () => void;
  onResetFactory?: () => void;
}

type TabKey = 'appearance' | 'league' | 'algorithm' | 'data';

export function SettingsModal({
  isOpen,
  onClose,
  leagueConfig = { numTeams: 8, initialBudget: 500, defenseModifier: true, slotsPerRole: { P: 3, D: 8, C: 8, A: 6 } },
  onSaveLeagueConfig = () => {},
  onExportBackup,
  onImportBackup,
  onResetAuction,
  onResetFactory,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('appearance');
  const { theme, setTheme } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] sm:max-h-[90vh] transition-colors duration-200 animate-in slide-in-from-bottom-5 sm:zoom-in-95">
        {/* Header Modal */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-extrabold text-sm sm:text-base">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-500">
              <Settings className="w-5 h-5" />
            </div>
            <span>IMPOSTAZIONI FANTASMART 2026/27</span>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 bg-slate-50/50 dark:bg-slate-950/50 overflow-x-auto text-xs font-bold">
          {[
            { key: 'appearance', label: 'Aspetto & UI', icon: <Sun className="w-3.5 h-3.5" /> },
            { key: 'league', label: 'Parametri Lega', icon: <Users className="w-3.5 h-3.5" /> },
            { key: 'algorithm', label: 'Parametri Valutazione', icon: <Sliders className="w-3.5 h-3.5" /> },
            { key: 'data', label: 'Gestione Dati', icon: <Database className="w-3.5 h-3.5" /> },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabKey)}
              className={`py-3 px-4 flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* TAB 1: ASPETTO & UI */}
          {activeTab === 'appearance' && (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <label className="font-bold text-slate-900 dark:text-white block">
                  Tema dell'Interfaccia
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'light', label: 'Chiaro', icon: <Sun className="w-4 h-4 text-amber-500" /> },
                    { id: 'dark', label: 'Scuro', icon: <Moon className="w-4 h-4 text-cyan-400" /> },
                    { id: 'system', label: 'Sistema', icon: <Laptop className="w-4 h-4 text-slate-400" /> },
                  ].map(option => (
                    <button
                      key={option.id}
                      onClick={() => setTheme(option.id as any)}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all font-bold ${
                        theme === option.id
                          ? 'bg-white dark:bg-slate-900 border-cyan-500 text-cyan-600 dark:text-cyan-400 shadow-md ring-2 ring-cyan-500/20'
                          : 'bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {option.icon}
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="font-bold text-slate-900 dark:text-white">Modalità Fullscreen &amp; Keyboard First</div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Fantasmart è ottimizzato per l'uso da tastiera: premi <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-[10px]">Cmd + K</kbd> per cercare istantaneamente un giocatore, <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-[10px]">Enter</kbd> per registrare l'acquisto e <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-[10px]">Ctrl + Z</kbd> per annullare.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: PARAMETRI LEGA */}
          {activeTab === 'league' && (
            <LeagueSettingsTab
              config={leagueConfig}
              onSaveConfig={onSaveLeagueConfig}
            />
          )}

          {/* TAB 3: TUNING ALGORITMO */}
          {activeTab === 'algorithm' && <AlgorithmSettingsTab />}

          {/* TAB 4: GESTIONE DATI */}
          {activeTab === 'data' && (
            <DataManagementTab
              onExportBackup={onExportBackup}
              onImportBackup={onImportBackup}
              onResetAuction={onResetAuction}
              onResetFactory={onResetFactory}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50/50 dark:bg-slate-950/50">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}

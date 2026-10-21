'use client';

import React, { useRef } from 'react';
import { Download, Upload, RotateCcw, AlertTriangle, Database, ShieldCheck } from 'lucide-react';

interface Props {
  onExportBackup?: () => void;
  onImportBackup?: (jsonStr: string) => void;
  onResetAuction?: () => void;
  onResetFactory?: () => void;
}

export function DataManagementTab({
  onExportBackup,
  onImportBackup,
  onResetAuction,
  onResetFactory,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImportBackup) {
      const reader = new FileReader();
      reader.onload = event => {
        if (event.target?.result) {
          onImportBackup(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Sezione Backup & Ripristino */}
      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Database className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          Backup e Sincronizzazione Dati Asta
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Salva o carica l'intero stato dell'asta in formato file JSON (inclusi acquisti, budget speso e configurazioni personalizzate).
        </p>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onExportBackup}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-sm transition-all active:scale-95"
          >
            <Download className="w-4 h-4" /> Esporta Backup JSON
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-sm transition-all active:scale-95"
          >
            <Upload className="w-4 h-4" /> Importa Backup JSON
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
        </div>
      </div>

      {/* Sezione Reset & Ripristino */}
      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4" />
          Zona di Ripristino e Reset
        </div>

        <div className="space-y-2">
          {/* Reset Acquisti Asta */}
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <div className="font-bold text-slate-900 dark:text-white">Azzera Acquisti Asta</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Svuota la rosa e ripristina il budget iniziale della lega, mantenendo il listone 2026.
              </div>
            </div>
            <button
              onClick={() => {
                if (confirm('Sei sicuro di voler azzerare tutti gli acquisti dell\'asta?')) {
                  if (onResetAuction) onResetAuction();
                }
              }}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg transition-colors"
            >
              Azzera Asta
            </button>
          </div>

          {/* Reset di Fabbrica Completo */}
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-3 rounded-xl border border-rose-200 dark:border-rose-950/60">
            <div>
              <div className="font-bold text-rose-600 dark:text-rose-400">Ripristino di Fabbrica (515 Giocatori)</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Resetta l'intero database e le configurazioni a REAL_DATASET_2026.
              </div>
            </div>
            <button
              onClick={() => {
                if (confirm('ATTENZIONE: Verranno ripristinati tutti i dati iniziali di fabbrica (515 giocatori). Continuare?')) {
                  if (onResetFactory) onResetFactory();
                }
              }}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg shadow-sm transition-colors"
            >
              Reset Fabbrica
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

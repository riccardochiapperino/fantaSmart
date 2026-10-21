import React, { useRef } from 'react';
import { TabType } from '@/lib/types';
import { Settings, Download, Upload, RotateCcw, ChevronRight } from 'lucide-react';

interface Props {
  onExport: () => void;
  onImport: (jsonStr: string) => void;
  onReset: () => void;
  onNavigateTab: (tab: TabType) => void;
}

export function AdminQuickSector({ onExport, onImport, onReset, onNavigateTab }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = event => {
        if (event.target?.result) {
          onImport(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <section className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl backdrop-blur-sm space-y-3">
      <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-slate-700/50 rounded-lg border border-slate-600/50 text-slate-300">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm">Settore Azioni Rapide &amp; Backup</h3>
            <p className="text-[11px] text-slate-400">Salvataggio, ripristino dati e gestione slot</p>
          </div>
        </div>
        <button
          onClick={() => onNavigateTab('admin')}
          className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5"
        >
          Gestione Admin <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onExport}
          className="bg-cyan-600/90 hover:bg-cyan-500 text-white text-xs font-bold py-2.5 px-3 rounded-lg border border-cyan-500/40 flex items-center justify-center gap-1.5 shadow-sm transition-all"
        >
          <Download className="w-3.5 h-3.5" /> Esporta Backup JSON
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-3 rounded-lg border border-emerald-500/40 flex items-center justify-center gap-1.5 shadow-sm transition-all"
        >
          <Upload className="w-3.5 h-3.5" /> Importa Backup JSON
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json"
          className="hidden"
        />
      </div>

      <button
        onClick={onReset}
        className="w-full bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all"
      >
        <RotateCcw className="w-3.5 h-3.5" /> Ripristina Dati Iniziali
      </button>
    </section>
  );
}

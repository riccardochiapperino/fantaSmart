import React from 'react';
import { Player, TabType } from '@/lib/types';
import { BudgetSector } from './sectors/BudgetSector';
import { RepartiSector } from './sectors/RepartiSector';
import { AstaQuickSector } from './sectors/AstaQuickSector';
import { RosaPreviewSector } from './sectors/RosaPreviewSector';
import { ReplacementAlertSector } from './sectors/ReplacementAlertSector';
import { AdminQuickSector } from './sectors/AdminQuickSector';
import { LayoutDashboard } from 'lucide-react';

interface Props {
  players: Player[];
  squad: Player[];
  budget: number;
  spent: number;
  remainingBudget: number;
  avgPerSlot: string;
  selectedLostPlayer: Player | null;
  setSelectedLostPlayer: (player: Player) => void;
  onBuy: (player: Player, price: number) => void;
  onLost: (player: Player) => void;
  onExport: () => void;
  onImport: (jsonStr: string) => void;
  onReset: () => void;
  onNavigateTab: (tab: TabType) => void;
}

export function HomeTab({
  players,
  squad,
  budget,
  spent,
  remainingBudget,
  avgPerSlot,
  selectedLostPlayer,
  setSelectedLostPlayer,
  onBuy,
  onLost,
  onExport,
  onImport,
  onReset,
  onNavigateTab,
}: Props) {
  return (
    <div className="space-y-4">
      {/* Banner di Benvenuto */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg flex justify-between items-center">
        <div>
          <h2 className="text-base font-extrabold text-cyan-400 flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5" /> Dashboard Asta FantaSmart
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Panoramica generale dell'asta e moduli di gestione rapida
          </p>
        </div>
        <div className="hidden sm:block text-right">
          <span className="text-[10px] text-slate-400 block uppercase">Stato Asta</span>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2.5 py-0.5 rounded-full">
            In Corso ({squad.length}/25)
          </span>
        </div>
      </div>

      {/* Settore 1: Budget e Crediti */}
      <BudgetSector
        budget={budget}
        spent={spent}
        remainingBudget={remainingBudget}
        avgPerSlot={avgPerSlot}
        squadLength={squad.length}
      />

      {/* Settore 2: Progresso Reparti */}
      <RepartiSector squad={squad} onNavigateTab={onNavigateTab} />

      {/* Settore 3: Asta Rapida */}
      <AstaQuickSector
        players={players}
        onBuy={onBuy}
        onLost={onLost}
        onNavigateTab={onNavigateTab}
      />

      {/* Settore 4: Anteprima Rosa */}
      <RosaPreviewSector squad={squad} onNavigateTab={onNavigateTab} />

      {/* Settore 5: Alert e Suggerimento Sostituto */}
      <ReplacementAlertSector
        players={players}
        squad={squad}
        remainingBudget={remainingBudget}
        selectedLostPlayer={selectedLostPlayer}
        setSelectedLostPlayer={setSelectedLostPlayer}
        onBuy={onBuy}
        onNavigateTab={onNavigateTab}
      />

      {/* Settore 6: Azioni Rapide & Admin */}
      <AdminQuickSector
        onExport={onExport}
        onImport={onImport}
        onReset={onReset}
        onNavigateTab={onNavigateTab}
      />
    </div>
  );
}

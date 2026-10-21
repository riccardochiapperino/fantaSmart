'use client';

import React, { useState } from 'react';
import { AdvisorState, Role } from '@/lib/types';
import {
  Wallet,
  Settings,
  TrendingUp,
  Share2,
  Users,
  Check,
  Download,
  Copy,
  X,
} from 'lucide-react';
import { exportRosterToCSV, copyRosterToClipboard } from '@/lib/export/rosterExport';

interface Props {
  state: AdvisorState;
  onOpenSetup: () => void;
  onOpenOpponents?: () => void;
  onReset: () => void;
}

export function LiveAuctionHUD({ state, onOpenSetup, onOpenOpponents, onReset }: Props) {
  const { myRoster, remainingBudget, leagueConfig, currentInflation, opponents = [] } = state;

  const [isExportOpen, setIsExportOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const roleCounts: Record<Role, number> = {
    P: myRoster.filter(p => p.role === 'P').length,
    D: myRoster.filter(p => p.role === 'D').length,
    C: myRoster.filter(p => p.role === 'C').length,
    A: myRoster.filter(p => p.role === 'A').length,
  };

  const slots = leagueConfig.slotsPerRole || { P: 3, D: 8, C: 8, A: 6 };
  const initialBudget = leagueConfig.initialBudget || 500;
  const budgetSpent = initialBudget - remainingBudget;
  const totalBought = myRoster.length;
  const totalSlots = slots.P + slots.D + slots.C + slots.A;

  // Badge inflazione di mercato
  const inflationDiff = Math.round((currentInflation - 1.0) * 100);
  const inflationText = inflationDiff >= 0 ? `+${inflationDiff}%` : `${inflationDiff}%`;

  const handleCopyChat = async () => {
    const success = await copyRosterToClipboard(myRoster, budgetSpent, initialBudget);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadCSV = () => {
    exportRosterToCSV(myRoster, `mia_rosa_${new Date().getFullYear()}.csv`);
  };

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 rounded-2xl p-2.5 sm:p-3.5 shadow-xl backdrop-blur-md transition-colors space-y-2">
      {/* Mobile Responsive Grid (2x2 on Mobile, Flex on Desktop) */}
      <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-between gap-2 sm:gap-3">
        {/* SEZIONE 1: BUDGET RESIDUO */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
            <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
              Budget Residuo
            </div>
            <div className="flex items-baseline gap-1 leading-none">
              <span className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white" suppressHydrationWarning>
                {remainingBudget}
              </span>
              <span className="text-[11px] sm:text-xs font-bold text-cyan-600 dark:text-cyan-400">cr</span>
              <span className="text-[10px] text-slate-400 font-semibold hidden xs:inline">/ {initialBudget}</span>
            </div>
          </div>
        </div>

        {/* SEZIONE 2: INFLAZIONE & AZIONI RAPIDE (Mobile Top Right) */}
        <div className="flex items-center justify-end gap-1.5 sm:order-3">
          {/* Badge Inflazione */}
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-xl border text-[10px] sm:text-[11px] font-bold ${
              currentInflation > 1.15
                ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                : currentInflation > 1.05
                ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
            }`}
          >
            <TrendingUp className="w-3 h-3" />
            <span suppressHydrationWarning>{inflationText}</span>
          </div>

          {/* Bottone Opponent Tracker */}
          {onOpenOpponents && (
            <button
              onClick={onOpenOpponents}
              className="flex items-center gap-1 px-2 sm:px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-black font-extrabold text-[11px] sm:text-xs rounded-xl shadow-md transition-all active:scale-95"
              title="Intelligence Rivali"
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Rivali ({opponents.length})</span>
            </button>
          )}

          {/* Bottone Esporta Rosa */}
          <button
            onClick={() => setIsExportOpen(true)}
            className="p-1.5 sm:px-2.5 sm:py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
            title="Esporta Rosa"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          {/* Setup Rapido */}
          <button
            onClick={onOpenSetup}
            className="p-1.5 sm:p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 transition-all shadow-sm"
            title="Configurazione Asta"
          >
            <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* SEZIONE 3: COPERTURA REPARTI (P, D, C, A) (Full row on Mobile) */}
        <div className="col-span-2 sm:col-span-1 flex items-center justify-between sm:justify-start gap-1 bg-slate-100 dark:bg-slate-950/80 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-800/80 sm:order-2">
          {(['P', 'D', 'C', 'A'] as const).map(role => {
            const current = roleCounts[role];
            const max = slots[role];
            const isFull = current >= max;

            return (
              <div
                key={role}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1 px-1.5 py-0.5 rounded-lg border text-[10px] sm:text-[11px] font-bold transition-all ${
                  role === 'P'
                    ? 'bg-amber-500/10 border-amber-500/25 text-amber-700 dark:text-amber-300'
                    : role === 'D'
                    ? 'bg-blue-500/10 border-blue-500/25 text-blue-700 dark:text-blue-300'
                    : role === 'C'
                    ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/25 text-rose-700 dark:text-rose-300'
                }`}
              >
                <span>{role}</span>
                <span className={`font-black ${isFull ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-200'}`} suppressHydrationWarning>
                  [{current}/{max}]
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress Bar Spesa */}
      <div className="w-full bg-slate-200 dark:bg-slate-800/80 rounded-full h-1.5 overflow-hidden flex">
        <div
          className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-full transition-all duration-300"
          style={{ width: `${(totalBought / totalSlots) * 100}%` }}
          title={`Slot: ${totalBought}/${totalSlots}`}
        />
      </div>

      {/* MODAL / BOTTOM SHEET ESPORTA ROSA */}
      {isExportOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-5">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
                <Share2 className="w-4 h-4 text-emerald-500" />
                <span>Esporta Rosa ({myRoster.length}/25)</span>
              </div>
              <button
                onClick={() => setIsExportOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={handleDownloadCSV}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-xs font-bold text-slate-800 dark:text-slate-200 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <Download className="w-4 h-4 text-emerald-500" />
                  <span>Scarica CSV (Excel / Fogli)</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">mia_rosa_2026.csv</span>
              </button>

              <button
                onClick={handleCopyChat}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 text-xs font-bold text-slate-800 dark:text-slate-200 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-500 animate-bounce" />
                  ) : (
                    <Copy className="w-4 h-4 text-cyan-500" />
                  )}
                  <span>{copied ? 'Copiato!' : 'Copia per Chat (WhatsApp / Telegram)'}</span>
                </div>
                <span className="text-[10px] text-cyan-600 dark:text-cyan-400">Testo Formattato</span>
              </button>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setIsExportOpen(false)}
                className="w-full sm:w-auto px-4 py-2 bg-slate-100 dark:bg-slate-800 text-xs font-bold rounded-xl text-slate-700 dark:text-slate-300"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

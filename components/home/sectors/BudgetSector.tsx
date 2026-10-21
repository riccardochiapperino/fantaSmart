import React from 'react';
import { Wallet, Coins, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Props {
  budget: number;
  spent: number;
  remainingBudget: number;
  avgPerSlot: string;
  squadLength: number;
}

export function BudgetSector({
  budget,
  spent,
  remainingBudget,
  avgPerSlot,
  squadLength,
}: Props) {
  const percentSpent = Math.min(100, Math.round((spent / budget) * 100));
  const remainingSlots = 25 - squadLength;

  return (
    <section className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl backdrop-blur-sm space-y-4">
      <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-400">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm">Settore Budget &amp; Crediti</h3>
            <p className="text-[11px] text-slate-400">Stato finanziario dell'asta</p>
          </div>
        </div>
        {remainingBudget > 50 ? (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" /> Budget in Regola
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2.5 py-1 rounded-full">
            <AlertCircle className="w-3.5 h-3.5" /> Crediti Risicati
          </span>
        )}
      </div>

      {/* Grid KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-2.5 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Residui</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-black text-emerald-400">{remainingBudget}</span>
            <span className="text-[10px] text-slate-400">/ {budget} cr</span>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-2.5 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Spesi</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-black text-rose-400">{spent}</span>
            <span className="text-[10px] text-slate-400">cr ({percentSpent}%)</span>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-2.5 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Media / Slot</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-black text-amber-400">{avgPerSlot}</span>
            <span className="text-[10px] text-slate-400">cr</span>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-2.5 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Slot Liberi</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-black text-cyan-300">{remainingSlots}</span>
            <span className="text-[10px] text-slate-400">/ 25</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between text-[11px] text-slate-400">
          <span>Utilizzo Budget</span>
          <span className="font-bold text-slate-200">{percentSpent}% Speso</span>
        </div>
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-amber-400 transition-all duration-500"
            style={{ width: `${percentSpent}%` }}
          />
        </div>
      </div>
    </section>
  );
}

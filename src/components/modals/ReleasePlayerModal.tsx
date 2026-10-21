'use client';

import React, { useState, useEffect } from 'react';
import { Player } from '@/lib/types';
import { RotateCcw, AlertTriangle, X, Check, DollarSign } from 'lucide-react';

interface Props {
  player: Player | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (playerId: number, refundAmount: number) => void;
}

export function ReleasePlayerModal({
  player,
  isOpen,
  onClose,
  onConfirm,
}: Props) {
  const maxPrice = player?.boughtFor ?? player?.targetPrice ?? player?.estPrice ?? 1;
  const [refundAmount, setRefundAmount] = useState<number>(maxPrice);

  useEffect(() => {
    if (player) {
      setRefundAmount(player.boughtFor ?? player.targetPrice ?? player.estPrice ?? 1);
    }
  }, [player]);

  if (!isOpen || !player) return null;

  const originalPrice = player.boughtFor ?? maxPrice;
  const quotazione = player.qtA ?? player.fvm ?? player.targetPrice ?? 1;
  const loss = Math.max(0, originalPrice - refundAmount);

  const handleApplyPreset = (value: number) => {
    setRefundAmount(Math.min(originalPrice, Math.max(0, value)));
  };

  const handleConfirm = () => {
    onConfirm(player.id, refundAmount);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border-t sm:border border-slate-700 rounded-t-3xl sm:rounded-3xl p-5 max-w-md w-full shadow-2xl space-y-4 animate-in slide-in-from-bottom-5">
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/15 rounded-xl border border-amber-500/30 text-amber-400">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">
                Svincola Calciatore &amp; Recupero Crediti
              </h3>
              <p className="text-[11px] text-slate-400">
                Seleziona quanti crediti recuperare per questo svincolo
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Calciatore */}
        <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className={`text-xs font-black px-2 py-0.5 rounded ${
                player.role === 'P'
                  ? 'bg-amber-500 text-black'
                  : player.role === 'D'
                  ? 'bg-blue-600 text-white'
                  : player.role === 'C'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-rose-600 text-white'
              }`}
            >
              {player.role}
            </span>
            <div>
              <span className="font-extrabold text-sm text-white block leading-tight">
                {player.name}
              </span>
              <span className="text-xs text-slate-400 font-semibold uppercase">
                {player.team} • Slot {player.slot}°
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-semibold">Prezzo Pagato</span>
            <span className="text-sm font-black text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-800/60">
              {originalPrice} cr
            </span>
          </div>
        </div>

        {/* Range Slider & Input Crediti */}
        <div className="space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-slate-300">
              Crediti da Recuperare (Range da 0 a {originalPrice}):
            </label>
            <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1 rounded-xl border border-cyan-500">
              <input
                type="number"
                min={0}
                max={originalPrice}
                value={refundAmount}
                onChange={e => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val)) {
                    setRefundAmount(Math.min(originalPrice, Math.max(0, val)));
                  } else {
                    setRefundAmount(0);
                  }
                }}
                className="w-12 bg-transparent text-sm font-black text-cyan-300 text-right focus:outline-none"
              />
              <span className="text-xs font-bold text-cyan-400">cr</span>
            </div>
          </div>

          {/* Slider */}
          <input
            type="range"
            min={0}
            max={originalPrice}
            step={1}
            value={refundAmount}
            onChange={e => setRefundAmount(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />

          <div className="flex justify-between text-[10px] font-bold text-slate-400">
            <span>0 cr (Nessun rimborso)</span>
            <span>{originalPrice} cr (100% Rimborso Intero)</span>
          </div>
        </div>

        {/* Preset Rapidi */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Preset Regolamento Rapidi:
          </span>
          <div className="grid grid-cols-4 gap-1.5 text-xs font-bold">
            <button
              type="button"
              onClick={() => handleApplyPreset(originalPrice)}
              className={`py-1.5 px-2 rounded-xl border transition-all ${
                refundAmount === originalPrice
                  ? 'bg-cyan-500 border-cyan-400 text-black shadow-md'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
              title="Rimborso totale al 100%"
            >
              100% ({originalPrice})
            </button>

            <button
              type="button"
              onClick={() => handleApplyPreset(Math.floor(originalPrice / 2))}
              className={`py-1.5 px-2 rounded-xl border transition-all ${
                refundAmount === Math.floor(originalPrice / 2)
                  ? 'bg-cyan-500 border-cyan-400 text-black shadow-md'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
              title="Rimborso al 50%"
            >
              50% ({Math.floor(originalPrice / 2)})
            </button>

            <button
              type="button"
              onClick={() => handleApplyPreset(quotazione)}
              className={`py-1.5 px-2 rounded-xl border transition-all ${
                refundAmount === quotazione
                  ? 'bg-cyan-500 border-cyan-400 text-black shadow-md'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
              title={`Quotazione Listone (${quotazione} cr)`}
            >
              QtA ({quotazione})
            </button>

            <button
              type="button"
              onClick={() => handleApplyPreset(1)}
              className={`py-1.5 px-2 rounded-xl border transition-all ${
                refundAmount === 1
                  ? 'bg-cyan-500 border-cyan-400 text-black shadow-md'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
              title="1 credito simbolico"
            >
              1 cr
            </button>
          </div>
        </div>

        {/* Riepilogo Impatto Budget */}
        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Accredito al Budget:</span>
            <span className="font-extrabold text-emerald-400 text-sm">+{refundAmount} crediti</span>
          </div>
          {loss > 0 ? (
            <div className="text-right">
              <span className="text-slate-400 block text-[11px]">Costo Svincolo / Trattenuta:</span>
              <span className="font-extrabold text-rose-400 text-sm">-{loss} crediti</span>
            </div>
          ) : (
            <div className="text-right">
              <span className="text-emerald-400 font-bold text-[11px]">Nessuna trattenuta</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all active:scale-95"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-black font-black text-xs shadow-lg transition-all active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Conferma Svincolo (+{refundAmount} cr)
          </button>
        </div>
      </div>
    </div>
  );
}

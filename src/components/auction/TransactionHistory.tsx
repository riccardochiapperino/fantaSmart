'use client';

import React from 'react';
import { TransactionRecord } from '@/lib/storage/auctionStorage';
import { History, RotateCcw, UserCheck, UserX } from 'lucide-react';

interface Props {
  history: TransactionRecord[];
  onUndo: () => void;
  onReleasePlayer?: (playerId: number) => void;
}

export function TransactionHistory({ history, onUndo, onReleasePlayer }: Props) {
  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
      <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
          <History className="w-4 h-4 text-cyan-400" /> CRONOLOGIA TRANSAZIONI LIVE
        </div>

        {history.length > 0 && (
          <button
            onClick={onUndo}
            className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 bg-rose-950/40 border border-rose-900/60 px-2.5 py-1 rounded-lg transition-all active:scale-95"
            title="Annulla L'Ultimo Acquisto (Ctrl+Z)"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Annulla Ultimo (Ctrl+Z)
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-4 text-xs text-slate-500">
          Nessuna transazione registrata nell'asta live.
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
          {history.map((tx, idx) => (
            <div
              key={tx.id || idx}
              className={`flex-shrink-0 p-2.5 rounded-xl border flex items-center justify-between gap-2.5 max-w-xs transition-all ${
                tx.isMine
                  ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
                  : 'bg-rose-950/40 border-rose-900/80 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {tx.isMine ? (
                  <UserCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <UserX className="w-4 h-4 text-rose-400 flex-shrink-0" />
                )}

                <div>
                  <div className="font-bold text-xs">
                    {tx.player.name} <span className="text-[10px] text-slate-400">({tx.player.team})</span>
                  </div>
                  <div className="text-[10px] opacity-80">
                    {tx.isMine ? `Preso da Me @ ${tx.price} cr` : `Soffiato da ${tx.buyerId || 'Rivale'}`}
                  </div>
                </div>
              </div>

              {onReleasePlayer && (
                <button
                  onClick={() => onReleasePlayer(tx.player.id)}
                  className="p-1 rounded-lg bg-black/40 hover:bg-amber-500 hover:text-black text-slate-400 text-[10px] font-bold transition-colors"
                  title="Deseleziona / Torna Libero"
                >
                  ✕ Svincola
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

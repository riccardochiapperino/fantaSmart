'use client';

import React from 'react';
import { Eye, Info } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export function GuestBanner() {
  const { isGuest } = useAuth();

  if (!isGuest) return null;

  return (
    <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-800 dark:text-amber-300 px-3 py-1.5 text-center text-xs font-bold flex items-center justify-center gap-1.5 backdrop-blur-md">
      <Eye className="w-3.5 h-3.5 shrink-0 text-amber-500 animate-pulse" />
      <span>
        <strong>Modalità Ospite (Read-Only):</strong> Le modifiche e gli acquisti sono in sola memoria e non verranno salvati su LocalStorage.
      </span>
    </div>
  );
}

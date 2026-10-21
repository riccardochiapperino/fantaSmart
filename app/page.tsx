'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function RootGatewayPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.replace('/hub');
      } else {
        router.replace('/login');
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4 p-4 text-center">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-black font-black text-xl animate-bounce">
        ⚡
      </div>
      <div className="space-y-1">
        <h2 className="text-base font-black text-white tracking-tight">
          FANTASMART 2026/2027
        </h2>
        <p className="text-xs text-slate-400 animate-pulse">
          Inizializzazione Gateway d'Ingresso...
        </p>
      </div>
    </div>
  );
}

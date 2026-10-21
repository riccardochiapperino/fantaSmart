'use client';

import React from 'react';
import { Zap, Users, Layout, RefreshCw, Search } from 'lucide-react';
import { TabType } from '@/lib/types';

interface Props {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export function BottomNav({ activeTab, setActiveTab }: Props) {
  const navItems = [
    { id: 'asta' as TabType, label: 'Live Asta', icon: Zap },
    { id: 'rosa' as TabType, label: 'Mia Rosa', icon: Users },
    { id: 'campo' as TabType, label: 'Campo 2D', icon: Layout },
    { id: 'sostituto' as TabType, label: 'Sostituto', icon: RefreshCw },
    { id: 'home' as TabType, label: 'Listone', icon: Search },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-white/95 dark:bg-slate-950/95 border-t border-slate-200 dark:border-slate-800/90 backdrop-blur-lg flex justify-around items-center py-1.5 px-1 z-40 transition-colors shadow-2xl safe-area-bottom">
      {navItems.map(item => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all active:scale-90 ${
              isActive
                ? 'text-cyan-600 dark:text-cyan-400 font-black'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-xl transition-colors ${isActive ? 'bg-cyan-500/15' : ''}`}>
              <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
import React, { useState, useEffect } from 'react';
import { Radio, Wifi, BatteryMedium, Sparkles, Shield, Cast, Settings } from 'lucide-react';
import { ThemeColor } from '../types';
import { ThemeConfig, THEMES } from '../theme';

interface Props {
  currentTheme: ThemeConfig;
  onSelectTheme: (theme: ThemeColor) => void;
  activeSatelliteName?: string;
  isLocked18Plus: boolean;
  onToggleLock: () => void;
}

export const Navbar: React.FC<Props> = ({
  currentTheme,
  onSelectTheme,
  activeSatelliteName = 'Yahsat 52.5°E',
  isLocked18Plus,
  onToggleLock,
}) => {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 backdrop-blur-xl shadow-lg transition-colors duration-300">
      {/* Android Native Status Bar Simulation */}
      <div className="px-4 py-1 flex items-center justify-between text-[11px] font-mono tracking-tight opacity-75 border-b border-white/5 select-none">
        <div className="flex items-center gap-2">
          <span>{time || '۱۲:۰۰'}</span>
          <span className="flex items-center gap-0.5 text-[10px]">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>DVB-S2 LOCK</span>
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] bg-white/10 px-1.5 py-0.2 rounded font-sans">
            {activeSatelliteName}
          </span>
          <Wifi className="w-3.5 h-3.5" />
          <div className="flex items-center gap-0.5">
            <span className="text-[10px]">98%</span>
            <BatteryMedium className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main Header & Theme Switcher */}
      <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${currentTheme.glowEffect} ${currentTheme.primaryBtn}`}>
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-base tracking-tight">Nini TV Pro</h1>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${currentTheme.badgeBg}`}>
                V2.5 HD
              </span>
            </div>
            <p className="text-[11px] opacity-70">
              پخش زنده شبکه‌ها، فرکانس‌ها و پلیر اختصاصی ماهواره
            </p>
          </div>
        </div>

        {/* 4 Requested Color Themes: سبز، صورتی، سیاه، زرد */}
        <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-2xl border border-white/10">
          <button
            id="theme-btn-green"
            onClick={() => onSelectTheme('green')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium transition-all ${
              currentTheme.id === 'green'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/40 scale-105'
                : 'text-emerald-300/80 hover:bg-emerald-500/20'
            }`}
            title="تم سبز زمردی"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span className="hidden sm:inline">سبز</span>
          </button>

          <button
            id="theme-btn-pink"
            onClick={() => onSelectTheme('pink')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium transition-all ${
              currentTheme.id === 'pink'
                ? 'bg-pink-500 text-white font-bold shadow-md shadow-pink-500/40 scale-105'
                : 'text-pink-300/80 hover:bg-pink-500/20'
            }`}
            title="تم صورتی نئون"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span>
            <span className="hidden sm:inline">صورتی</span>
          </button>

          <button
            id="theme-btn-black"
            onClick={() => onSelectTheme('black')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium transition-all ${
              currentTheme.id === 'black'
                ? 'bg-zinc-100 text-zinc-950 font-bold shadow-md shadow-white/20 scale-105'
                : 'text-zinc-400 hover:bg-zinc-800'
            }`}
            title="تم مشکی AMOLED"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-400"></span>
            <span className="hidden sm:inline">سیاه</span>
          </button>

          <button
            id="theme-btn-yellow"
            onClick={() => onSelectTheme('yellow')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium transition-all ${
              currentTheme.id === 'yellow'
                ? 'bg-yellow-400 text-slate-950 font-bold shadow-md shadow-yellow-400/40 scale-105'
                : 'text-yellow-300/80 hover:bg-yellow-500/20'
            }`}
            title="تم زرد الکتریک"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
            <span className="hidden sm:inline">زرد</span>
          </button>
        </div>
      </div>
    </header>
  );
};

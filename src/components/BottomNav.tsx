import React from 'react';
import { Tv, Film, Clapperboard, Palette, Crown } from 'lucide-react';
import { ActiveTab } from '../types';
import { ThemeConfig } from '../theme';

interface Props {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  theme: ThemeConfig;
  adultUnlocked: boolean;
}

export const BottomNav: React.FC<Props> = ({ activeTab, onSelectTab, theme, adultUnlocked }) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'player', label: 'پلیر', icon: <Tv className="w-5 h-5" /> },
    { id: 'movies', label: 'فیلم', icon: <Film className="w-5 h-5" /> },
    { id: 'series', label: 'سریال', icon: <Clapperboard className="w-5 h-5" /> },
    { id: 'cartoon', label: 'کارتون', icon: <Palette className="w-5 h-5" /> },
    { id: 'adult', label: '۱۸+', icon: <Crown className="w-5 h-5" /> },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-white/10 bg-black/80 backdrop-blur-2xl px-1 py-1.5 select-none">
      <div className="max-w-md mx-auto flex items-stretch justify-between gap-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`relative flex-1 flex flex-col items-center justify-center py-2 rounded-2xl transition-all duration-200 ${
                isActive
                  ? `${theme.navActive} scale-[1.03] shadow-md`
                  : 'opacity-60 hover:opacity-100 text-white/80'
              }`}
            >
              {item.icon}
              <span className="text-[11px] font-bold mt-1 whitespace-nowrap">{item.label}</span>
              {item.id === 'adult' && !adultUnlocked && (
                <span className="absolute top-1 right-2 text-[9px]">🔒</span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

import React from 'react';
import { Tv, Radio, Satellite, PlusCircle, Palette } from 'lucide-react';
import { ActiveTab } from '../types';
import { ThemeConfig } from '../theme';

interface Props {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  theme: ThemeConfig;
  channelsCount: number;
}

export const BottomNav: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  theme,
  channelsCount,
}) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string | number }[] = [
    { id: 'player', label: 'پلیر زنده', icon: <Tv className="w-5 h-5" /> },
    { id: 'channels', label: 'شبکه‌ها', icon: <Radio className="w-5 h-5" />, badge: channelsCount },
    { id: 'frequencies', label: 'فرکانس‌ها', icon: <Satellite className="w-5 h-5" /> },
    { id: 'm3u', label: 'افزودن استریم', icon: <PlusCircle className="w-5 h-5" /> },
    { id: 'settings', label: 'تم و تنظیمات', icon: <Palette className="w-5 h-5" /> },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t backdrop-blur-2xl px-2 py-1.5 transition-colors duration-300 select-none">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-200 ${
                isActive
                  ? `${theme.navActive} scale-105 shadow-md`
                  : 'opacity-70 hover:opacity-100 text-white/80'
              }`}
            >
              <div className="relative">
                {item.icon}
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 text-[9px] px-1 py-0.2 rounded-full bg-rose-500 text-white font-mono font-bold leading-none">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium mt-1 whitespace-nowrap">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

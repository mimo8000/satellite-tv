import React, { useState } from 'react';
import {
  Search,
  Heart,
  Flame,
  Film,
  Trophy,
  Music,
  Newspaper,
  Compass,
  Radio,
  Lock,
  Unlock,
  Tv,
  CheckCircle,
  SlidersHorizontal
} from 'lucide-react';
import { Channel, ChannelCategory } from '../types';
import { ThemeConfig } from '../theme';

interface Props {
  channels: Channel[];
  selectedChannel: Channel;
  onSelectChannel: (channel: Channel) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  theme: ThemeConfig;
  isLocked18Plus: boolean;
  onRequestUnlock18Plus: () => void;
}

export const ChannelList: React.FC<Props> = ({
  channels,
  selectedChannel,
  onSelectChannel,
  favorites,
  onToggleFavorite,
  theme,
  isLocked18Plus,
  onRequestUnlock18Plus,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<ChannelCategory>('all');
  const [selectedSatellite, setSelectedSatellite] = useState<string>('all');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState<boolean>(false);

  const categories: { id: ChannelCategory; label: string; icon: React.ReactNode; is18?: boolean }[] = [
    { id: 'all', label: 'همه شبکه‌ها', icon: <Tv className="w-3.5 h-3.5" /> },
    { id: 'adult_18', label: 'شبانه و استایل ۱۸+', icon: <Flame className="w-3.5 h-3.5 text-rose-500" />, is18: true },
    { id: 'movies', label: 'فیلم و سینما', icon: <Film className="w-3.5 h-3.5" /> },
    { id: 'sports', label: 'ورزش و فوتبال', icon: <Trophy className="w-3.5 h-3.5" /> },
    { id: 'music', label: 'موزیک و مد', icon: <Music className="w-3.5 h-3.5" /> },
    { id: 'news', label: 'اخبار جهان', icon: <Newspaper className="w-3.5 h-3.5" /> },
    { id: 'documentary', label: 'مستند و کیهان', icon: <Compass className="w-3.5 h-3.5" /> },
  ];

  const satellites = [
    { id: 'all', label: 'همه ماهواره‌ها' },
    { id: 'Yahsat', label: 'یاه‌ست (Yahsat)' },
    { id: 'Hotbird', label: 'هات‌برد (Hotbird)' },
    { id: 'Eutelsat', label: 'یوتل‌ست (Eutelsat)' },
    { id: 'Astra', label: 'آسترا (Astra)' },
    { id: 'Nilesat', label: 'نایل‌ست (Nilesat)' },
  ];

  const handleCategoryClick = (cat: ChannelCategory) => {
    if (cat === 'adult_18' && isLocked18Plus) {
      onRequestUnlock18Plus();
      return;
    }
    setSelectedCategory(cat);
  };

  const filteredChannels = channels.filter((ch) => {
    // Search match
    const matchesSearch =
      ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ch.persianName.includes(searchQuery) ||
      (ch.frequency && ch.frequency.includes(searchQuery)) ||
      ch.satellite.toLowerCase().includes(searchQuery.toLowerCase());

    // Category match
    const matchesCategory = selectedCategory === 'all' || ch.category === selectedCategory;

    // Satellite match
    const matchesSatellite = selectedSatellite === 'all' || ch.satellite.toLowerCase().includes(selectedSatellite.toLowerCase());

    // Favorites match
    const matchesFavorites = !showOnlyFavorites || favorites.includes(ch.id);

    return matchesSearch && matchesCategory && matchesSatellite && matchesFavorites;
  });

  return (
    <div className="space-y-3.5">
      {/* Search & Favorites Bar */}
      <div className="flex items-center gap-2">
        <div className={`flex-1 flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border ${theme.cardBg} ${theme.cardBorder} transition-colors`}>
          <Search className="w-4 h-4 opacity-60 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی کانال، نام ماهواره یا فرکانس..."
            className="w-full bg-transparent text-xs placeholder:text-white/40 focus:outline-none text-right"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs opacity-60 hover:opacity-100 px-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* Favorites filter toggle */}
        <button
          onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
          className={`p-2.5 rounded-2xl border flex items-center gap-1 text-xs font-medium transition active:scale-95 ${
            showOnlyFavorites
              ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
              : `${theme.cardBg} ${theme.cardBorder} opacity-80 hover:opacity-100`
          }`}
          title="فقط علاقه‌مندی‌ها"
        >
          <Heart className={`w-4 h-4 ${showOnlyFavorites ? 'fill-rose-500 text-rose-500' : ''}`} />
          <span className="hidden sm:inline">علاقه‌مندی‌ها</span>
          {favorites.length > 0 && (
            <span className="text-[10px] px-1 rounded-full bg-white/20 font-mono">
              {favorites.length}
            </span>
          )}
        </button>
      </div>

      {/* Satellite Quick Selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="text-[11px] opacity-60 shrink-0 ml-1">ماهواره:</span>
        {satellites.map((sat) => (
          <button
            key={sat.id}
            onClick={() => setSelectedSatellite(sat.id)}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all text-xs shrink-0 ${
              selectedSatellite === sat.id
                ? `${theme.primaryBtn} font-bold`
                : `${theme.cardBg} ${theme.cardBorder} opacity-75 hover:opacity-100 border`
            }`}
          >
            {sat.label}
          </button>
        ))}
      </div>

      {/* Categories Horizontal Scroll */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          const isCategoryLocked = cat.is18 && isLocked18Plus;

          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl whitespace-nowrap transition-all shrink-0 border ${
                isActive
                  ? `${theme.primaryBtn} font-bold border-transparent`
                  : isCategoryLocked
                  ? 'bg-rose-950/40 border-rose-800/40 text-rose-300 hover:bg-rose-900/50'
                  : `${theme.cardBg} ${theme.cardBorder} opacity-85 hover:opacity-100`
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
              {isCategoryLocked && <Lock className="w-3 h-3 text-rose-400 ml-0.5" />}
            </button>
          );
        })}
      </div>

      {/* 18+ Warning / Unlock banner if category 18+ is selected */}
      {selectedCategory === 'adult_18' && (
        <div className="p-3 rounded-2xl bg-rose-950/50 border border-rose-600/40 flex items-center justify-between text-xs text-rose-200">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-400" />
            <span>بخش شبکه‌های ۱۸+، فشن شبانه و استایل فعال است.</span>
          </div>
          <button
            onClick={onRequestUnlock18Plus}
            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] transition"
          >
            تغییر وضعیت قفل
          </button>
        </div>
      )}

      {/* Channels Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {filteredChannels.length === 0 ? (
          <div className={`col-span-full p-8 text-center rounded-3xl border ${theme.cardBg} ${theme.cardBorder}`}>
            <Radio className="w-10 h-10 mx-auto opacity-40 mb-2" />
            <p className="font-bold text-sm">هیچ شبکه‌ای با این مشخصات یافت نشد!</p>
            <p className="text-xs opacity-60 mt-1">عبارت جستجو یا فیلتر دسته‌بندی را تغییر دهید.</p>
          </div>
        ) : (
          filteredChannels.map((channel) => {
            const isCurrent = selectedChannel.id === channel.id;
            const isFav = favorites.includes(channel.id);

            return (
              <div
                key={channel.id}
                onClick={() => onSelectChannel(channel)}
                className={`relative p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                  isCurrent
                    ? `${theme.primaryBtn} shadow-md scale-[1.01]`
                    : `${theme.cardBg} ${theme.cardBorder} ${theme.cardHover}`
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={channel.logo}
                      alt={channel.name}
                      className="w-12 h-12 rounded-xl object-cover bg-black/40 border border-white/10"
                    />
                    {isCurrent && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full ring-2 ring-black animate-ping" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-xs sm:text-sm truncate">
                        {channel.persianName}
                      </h4>
                      {channel.is18Plus && (
                        <span className="text-[9px] px-1 py-0.2 rounded font-bold bg-rose-600 text-white shrink-0">
                          ۱۸+
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] opacity-75 truncate">{channel.name}</p>
                    <div className="flex items-center gap-2 text-[10px] opacity-65 font-mono mt-0.5">
                      <span>{channel.satellite}</span>
                      <span>•</span>
                      <span>{channel.quality}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onToggleFavorite(channel.id)}
                    className={`p-2 rounded-xl transition ${
                      isFav
                        ? 'text-rose-500 bg-rose-500/20'
                        : 'opacity-40 hover:opacity-100 hover:bg-white/10'
                    }`}
                    title={isFav ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
                    aria-label="علاقه‌مندی"
                  >
                    <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500' : ''}`} />
                  </button>

                  <button
                    onClick={() => onSelectChannel(channel)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                      isCurrent
                        ? 'bg-black/40 text-white'
                        : `${theme.primaryBtn}`
                    }`}
                  >
                    <span>{isCurrent ? 'در حال پخش' : 'تماشا'}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

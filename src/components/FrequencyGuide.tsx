import React, { useState } from 'react';
import {
  Satellite,
  Compass,
  Copy,
  Check,
  Search,
  Radio,
  Sliders,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { SATELLITE_FREQUENCIES, DISH_ALIGNMENTS } from '../data/satellites';
import { SatelliteFrequency } from '../types';
import { ThemeConfig } from '../theme';

interface Props {
  theme: ThemeConfig;
}

export const FrequencyGuide: React.FC<Props> = ({ theme }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSat, setSelectedSat] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showDishCalculator, setShowDishCalculator] = useState<boolean>(false);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredFrequencies = SATELLITE_FREQUENCIES.filter((item) => {
    const matchesSearch =
      item.satelliteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.persianName.includes(searchQuery) ||
      item.frequency.includes(searchQuery) ||
      item.channels.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSat = selectedSat === 'all' || item.satelliteName.toLowerCase().includes(selectedSat.toLowerCase());

    return matchesSearch && matchesSat;
  });

  return (
    <div className="space-y-4">
      {/* Header & Dish Calculator Toggle */}
      <div className={`p-4 rounded-3xl border ${theme.cardBg} ${theme.cardBorder} flex flex-wrap items-center justify-between gap-3`}>
        <div>
          <div className="flex items-center gap-2">
            <Satellite className="w-5 h-5 text-emerald-400" />
            <h3 className="font-extrabold text-base">راهنمای فرکانس‌ها و ترانسپاندرهای ماهواره</h3>
          </div>
          <p className="text-xs opacity-70 mt-1">
            اطلاعات دقیق فرکانس، سیمبل‌ریت، جهت و بیم ماهواره‌های یاه‌ست، هات‌برد، یوتل‌ست و نایل‌ست
          </p>
        </div>

        <button
          onClick={() => setShowDishCalculator(!showDishCalculator)}
          className={`px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition ${
            showDishCalculator ? 'bg-white/20 text-white' : `${theme.primaryBtn}`
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>{showDishCalculator ? 'بستن قطب‌نما' : 'راهنمای تنظیم دیش و ال‌ان‌بی'}</span>
        </button>
      </div>

      {/* Dish & LNB Alignment Section */}
      {showDishCalculator && (
        <div className={`p-5 rounded-3xl border ${theme.cardBg} ${theme.cardBorder} space-y-4 animate-in fade-in-50`}>
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Compass className="w-5 h-5 text-amber-400" />
            <h4 className="font-bold text-sm">زاویه و ساعت LNB جهت‌های اصلی ماهواره (مبنا: فلات ایران)</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {DISH_ALIGNMENTS.map((dish) => (
              <div
                key={dish.satelliteName}
                className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between font-bold text-sm">
                  <span>{dish.satelliteName}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${theme.badgeBg}`}>
                    جهت دیش
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 text-center font-mono py-1.5 bg-white/5 rounded-xl">
                  <div>
                    <span className="block opacity-60 text-[10px]">آزیموت</span>
                    <span className="font-bold text-emerald-400">{dish.azimuth}°</span>
                  </div>
                  <div>
                    <span className="block opacity-60 text-[10px]">الویژن (ارتفاع)</span>
                    <span className="font-bold text-cyan-400">{dish.elevation}°</span>
                  </div>
                  <div>
                    <span className="block opacity-60 text-[10px]">ساعت LNB</span>
                    <span className="font-bold text-amber-400">{dish.lnbSkew}°</span>
                  </div>
                </div>

                <p className="text-[11px] opacity-75 leading-relaxed font-sans">{dish.coverage}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className={`flex-1 min-w-[200px] flex items-center gap-2 px-3.5 py-2 rounded-2xl border ${theme.cardBg} ${theme.cardBorder}`}>
          <Search className="w-4 h-4 opacity-60" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در فرکانس‌ها یا کانال‌ها..."
            className="w-full bg-transparent text-xs placeholder:text-white/40 focus:outline-none text-right"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {['all', 'yahsat', 'hotbird', 'eutelsat', 'nilesat', 'astra', 'turksat'].map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSat(s)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
                selectedSat === s
                  ? `${theme.primaryBtn} font-bold`
                  : `${theme.cardBg} ${theme.cardBorder} opacity-75 hover:opacity-100 border`
              }`}
            >
              {s === 'all' ? 'همه' : s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Frequency Cards */}
      <div className="space-y-2.5">
        {filteredFrequencies.map((freq) => {
          const isCopied = copiedId === freq.id;
          const isExpanded = expandedId === freq.id;
          const freqString = `${freq.satelliteName} - ${freq.frequency} ${freq.polarization} ${freq.symbolRate} ${freq.fec}`;

          return (
            <div
              key={freq.id}
              className={`p-3.5 rounded-2xl border transition-all ${theme.cardBg} ${theme.cardBorder} ${theme.cardHover}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${theme.badgeBg}`}>
                    {freq.orbitalPosition}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm">{freq.persianName}</h4>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 font-mono">
                        {freq.standard}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-mono mt-1 opacity-90">
                      <span className="font-bold text-amber-300">
                        {freq.frequency} {freq.polarization === 'H' ? 'افقی (H)' : 'عمودی (V)'}
                      </span>
                      <span>سیمبل‌ریت: {freq.symbolRate}</span>
                      <span>FEC: {freq.fec}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(freqString, freq.id)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition flex items-center gap-1 text-xs"
                    title="کپی مشخصات فرکانس"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="text-[11px]">{isCopied ? 'کپی شد' : 'کپی'}</span>
                  </button>

                  <button
                    onClick={() => setExpandedId(isExpanded ? null : freq.id)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition text-xs flex items-center gap-1"
                  >
                    <span className="text-[11px]">کانال‌ها ({freq.channels.length})</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Collapsible channels list */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-white/10 space-y-1.5">
                  <div className="text-[11px] opacity-70 mb-1 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    <span>شبکه‌های فعال روی این فرکانس:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {freq.channels.map((channelName, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-xs font-medium"
                      >
                        {channelName}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

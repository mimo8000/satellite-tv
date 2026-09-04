import React, { useState } from 'react';
import { Plus, Link2, Upload, FileText, Check, Tv, AlertCircle } from 'lucide-react';
import { Channel, ChannelCategory } from '../types';
import { ThemeConfig } from '../theme';

interface Props {
  onAddChannel: (channel: Channel) => void;
  onAddMultipleChannels?: (channels: Channel[]) => void;
  theme: ThemeConfig;
}

export const CustomStreamModal: React.FC<Props> = ({
  onAddChannel,
  onAddMultipleChannels,
  theme,
}) => {
  const [name, setName] = useState<string>('');
  const [persianName, setPersianName] = useState<string>('');
  const [streamUrl, setStreamUrl] = useState<string>('');
  const [satellite, setSatellite] = useState<string>('Custom IPTV');
  const [category, setCategory] = useState<ChannelCategory>('entertainment');
  const [m3uText, setM3uText] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'single' | 'm3u'>('single');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const handleAddSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!streamUrl.trim() || !persianName.trim()) return;

    const newChan: Channel = {
      id: `custom-${Date.now()}`,
      name: name.trim() || persianName.trim(),
      persianName: persianName.trim(),
      category,
      satellite,
      logo: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=150&h=150&fit=crop',
      streamUrl: streamUrl.trim(),
      isHd: true,
      is18Plus: category === 'adult_18',
      quality: '1080p',
      country: 'Iran / Global',
      language: 'Farsi / Multi',
      description: 'استریم اختصاصی اضافه شده توسط کاربر',
    };

    onAddChannel(newChan);
    setName('');
    setPersianName('');
    setStreamUrl('');
    setSuccessMsg('کانال با موفقیت به لیست اضافه و آماده پخش شد!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleParseM3U = () => {
    if (!m3uText.trim()) return;

    const lines = m3uText.split('\n');
    const parsedChannels: Channel[] = [];
    let currentName = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('#EXTINF:')) {
        const parts = line.split(',');
        currentName = parts.length > 1 ? parts[1].trim() : 'IPTV Channel';
      } else if (line.startsWith('http://') || line.startsWith('https://')) {
        const isAdult = currentName.toLowerCase().includes('xxx') || currentName.toLowerCase().includes('adult') || currentName.includes('۱۸+');
        parsedChannels.push({
          id: `m3u-${Date.now()}-${parsedChannels.length}`,
          name: currentName || `شبکه ${parsedChannels.length + 1}`,
          persianName: currentName || `شبکه ${parsedChannels.length + 1}`,
          category: isAdult ? 'adult_18' : 'entertainment',
          satellite: 'M3U Playlist',
          logo: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=150&h=150&fit=crop',
          streamUrl: line,
          isHd: true,
          is18Plus: isAdult,
          quality: '1080p',
          country: 'Global',
          language: 'Multi',
        });
        currentName = '';
      }
    }

    if (parsedChannels.length > 0 && onAddMultipleChannels) {
      onAddMultipleChannels(parsedChannels);
      setM3uText('');
      setSuccessMsg(`${parsedChannels.length} شبکه با موفقیت از لیست M3U وارد شد!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setM3uText(content);
      setActiveTab('m3u');
    };
    reader.readAsText(file);
  };

  return (
    <div className={`p-5 rounded-3xl border ${theme.cardBg} ${theme.cardBorder} space-y-4 max-w-2xl mx-auto shadow-xl`}>
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${theme.primaryBtn}`}>
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base">اضافه کردن شبکه اختصاصی و لیست M3U</h3>
            <p className="text-xs opacity-70">امکان پخش مستقیم لینک‌های HLS/m3u8 و فایل‌های IPTV ماهواره</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs">
          <button
            onClick={() => setActiveTab('single')}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              activeTab === 'single' ? `${theme.primaryBtn} font-bold` : 'opacity-70 hover:opacity-100'
            }`}
          >
            لینک تکی
          </button>
          <button
            onClick={() => setActiveTab('m3u')}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              activeTab === 'm3u' ? `${theme.primaryBtn} font-bold` : 'opacity-70 hover:opacity-100'
            }`}
          >
            لیست M3U
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 flex items-center gap-2 text-xs font-bold text-emerald-300 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {activeTab === 'single' ? (
        <form onSubmit={handleAddSingle} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold mb-1 opacity-90">نام فارسی شبکه:</label>
            <input
              type="text"
              required
              value={persianName}
              onChange={(e) => setPersianName(e.target.value)}
              placeholder="مثال: پرشین مووی اختصاصی یا شبکه ۱۸+"
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 focus:outline-none focus:border-emerald-400 text-right"
            />
          </div>

          <div>
            <label className="block font-bold mb-1 opacity-90">آدرس استریم زنده (HLS / m3u8 / mp4):</label>
            <input
              type="url"
              required
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              placeholder="https://example.com/live/stream.m3u8"
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 focus:outline-none focus:border-emerald-400 font-mono text-left"
              dir="ltr"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1 opacity-90">دسته‌بندی:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ChannelCategory)}
                className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 focus:outline-none text-white"
              >
                <option value="entertainment" className="bg-slate-900">سرگرمی و عمومی</option>
                <option value="adult_18" className="bg-slate-900">شبانه و استایل ۱۸+</option>
                <option value="movies" className="bg-slate-900">فیلم و سینما</option>
                <option value="sports" className="bg-slate-900">ورزش و مسابقات</option>
                <option value="music" className="bg-slate-900">موزیک و مد</option>
                <option value="news" className="bg-slate-900">اخبار</option>
                <option value="documentary" className="bg-slate-900">مستند</option>
              </select>
            </div>

            <div>
              <label className="block font-bold mb-1 opacity-90">منبع / ماهواره:</label>
              <input
                type="text"
                value={satellite}
                onChange={(e) => setSatellite(e.target.value)}
                placeholder="مثال: اینترنت IPTV یا یاه‌ست"
                className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 focus:outline-none text-right"
              />
            </div>
          </div>

          <button
            type="submit"
            className={`w-full py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition active:scale-98 ${theme.primaryBtn}`}
          >
            <Plus className="w-4 h-4" />
            <span>افزودن شبکه و شروع پخش</span>
          </button>
        </form>
      ) : (
        <div className="space-y-3 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold opacity-90">محتوای متنی فایل M3U یا آپلود فایل:</label>
              <label className="flex items-center gap-1.5 cursor-pointer text-emerald-400 hover:underline">
                <Upload className="w-3.5 h-3.5" />
                <span>انتخاب فایل .m3u</span>
                <input type="file" accept=".m3u,.m3u8,.txt" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
            <textarea
              rows={6}
              value={m3uText}
              onChange={(e) => setM3uText(e.target.value)}
              placeholder="#EXTM3U&#10;#EXTINF:-1,Sample Channel&#10;https://example.com/stream.m3u8"
              className="w-full p-3 rounded-xl bg-black/40 border border-white/15 focus:outline-none font-mono text-left text-[11px]"
              dir="ltr"
            />
          </div>

          <button
            onClick={handleParseM3U}
            disabled={!m3uText.trim()}
            className={`w-full py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50 ${theme.primaryBtn}`}
          >
            <FileText className="w-4 h-4" />
            <span>استخراج و افزودن خودکار شبکه‌ها</span>
          </button>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { ActiveTab, Channel, ThemeColor, NiniSession } from './types';
import { INITIAL_CHANNELS } from './data/channels';
import { THEMES } from './theme';
import { Navbar } from './components/Navbar';
import { VideoPlayer } from './components/VideoPlayer';
import { ChannelList } from './components/ChannelList';
import { FrequencyGuide } from './components/FrequencyGuide';
import { CustomStreamModal } from './components/CustomStreamModal';
import { SettingsView } from './components/SettingsView';
import { BottomNav } from './components/BottomNav';
import { ParentalLockModal } from './components/ParentalLockModal';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { AuthGate, loadSession, saveSession } from './components/AuthGate';
import { ProModal } from './components/ProModal';
import { syncNewChannels, loadNewChannels } from './utils/liveSync';
import { Tv, Globe, Settings, Sparkles } from 'lucide-react';

const CAT_OF_TAB: Record<string, string[]> = {
  movies: ['movies'],
  series: ['series'],
  cartoon: ['cartoon', 'kids'],
  adult: ['adult_18'],
  live: ['live'],
};

export default function App() {
  // ---------- subscription gate ----------
  const [session, setSession] = useState<NiniSession | null>(() => loadSession());
  const handleLogout = () => {
    saveSession(null);
    setSession(null);
  };

  // ---------- theme ----------
  const [themeId, setThemeId] = useState<ThemeColor>(() => {
    const saved = localStorage.getItem('sat_theme');
    if (saved && ['green', 'pink', 'black', 'yellow'].includes(saved)) return saved as ThemeColor;
    return 'green';
  });
  const currentTheme = THEMES[themeId] || THEMES.green;

  const handleSelectTheme = (newTheme: ThemeColor) => {
    setThemeId(newTheme);
    localStorage.setItem('sat_theme', newTheme);
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute('content', THEMES[newTheme].colorCode);
  };

  // ---------- navigation ----------
  const [activeTab, setActiveTab] = useState<ActiveTab>('player');

  // ---------- channels: built-in + custom + auto-synced ----------
  const [channels, setChannels] = useState<Channel[]>(() => {
    try {
      const saved = localStorage.getItem('sat_custom_channels');
      if (saved) {
        const custom = JSON.parse(saved) as Channel[];
        return [...custom, ...INITIAL_CHANNELS];
      }
    } catch {}
    return INITIAL_CHANNELS;
  });

  const [syncedChannels, setSyncedChannels] = useState<Channel[]>(() => loadNewChannels());
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const known = new Set([...INITIAL_CHANNELS, ...loadNewChannels()].map((c) => c.streamUrl));
      const n = await syncNewChannels(known);
      if (cancelled) return;
      if (n > 0) {
        setSyncedChannels(loadNewChannels());
        setSyncMsg(`✨ ${n} کانال تازه (فیلم/سریال/کارتون/۱۸+) خودکار اضافه شد`);
        setTimeout(() => setSyncMsg(null), 6000);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const allChannels = useMemo(() => {
    const seen = new Set<string>();
    const out: Channel[] = [];
    for (const c of [...channels, ...syncedChannels]) {
      if (!c || !c.streamUrl || seen.has(c.streamUrl)) continue;
      seen.add(c.streamUrl);
      out.push(c);
    }
    return out;
  }, [channels, syncedChannels]);

  const tabChannels = useMemo(() => {
    const cats = CAT_OF_TAB[activeTab];
    if (!cats) return allChannels;
    return allChannels.filter((c) => cats.includes(c.category));
  }, [activeTab, allChannels]);

  // ---------- selection ----------
  const [selectedChannel, setSelectedChannel] = useState<Channel>(
    () => allChannels[0] || INITIAL_CHANNELS[0],
  );

  // ---------- favorites ----------
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sat_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleToggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem('sat_favorites', JSON.stringify(next));
      return next;
    });
  };

  // ---------- 18+ lock ----------
  const [isLocked18Plus, setIsLocked18Plus] = useState<boolean>(true);
  const [showUnlockModal, setShowUnlockModal] = useState<boolean>(false);
  const [showProModal, setShowProModal] = useState<boolean>(false);

  // ---------- channel actions ----------
  const handleChannelSelect = (channel: Channel) => {
    if (channel.is18Plus && isLocked18Plus) {
      setShowUnlockModal(true);
      return;
    }
    if (channel.free === false && !session?.isVip) {
      setShowProModal(true);
      return;
    }
    setSelectedChannel(channel);
    setActiveTab('player');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddChannel = (newChan: Channel) => {
    setChannels((prev) => {
      const updated = [newChan, ...prev];
      const customOnly = updated.filter((c) => c.id.startsWith('custom-') || c.id.startsWith('m3u-'));
      localStorage.setItem('sat_custom_channels', JSON.stringify(customOnly));
      return updated;
    });
    setSelectedChannel(newChan);
    setActiveTab('player');
  };

  const handleAddMultipleChannels = (newChans: Channel[]) => {
    setChannels((prev) => {
      const updated = [...newChans, ...prev];
      const customOnly = updated.filter((c) => c.id.startsWith('custom-') || c.id.startsWith('m3u-'));
      localStorage.setItem('sat_custom_channels', JSON.stringify(customOnly));
      return updated;
    });
    if (newChans.length > 0) setSelectedChannel(newChans[0]);
    setActiveTab('player');
  };

  const handleResetData = () => {
    if (window.confirm('شبکه‌های افزوده‌شده و علاقه‌مندی‌ها پاک شوند و به لیست پیش‌فرض برگردد؟')) {
      localStorage.removeItem('sat_custom_channels');
      localStorage.removeItem('sat_favorites');
      localStorage.removeItem('nini_tv_new_channels');
      setChannels(INITIAL_CHANNELS);
      setSyncedChannels([]);
      setSelectedChannel(INITIAL_CHANNELS[0]);
      setFavorites([]);
    }
  };

  // ---------- next / prev within current tab list ----------
  const navList = tabChannels.length > 0 ? tabChannels : allChannels;
  const currentIdx = navList.findIndex((c) => c.id === selectedChannel.id);
  const handleNextChannel = () => {
    if (currentIdx !== -1) setSelectedChannel(navList[(currentIdx + 1) % navList.length]);
  };
  const handlePrevChannel = () => {
    if (currentIdx !== -1) setSelectedChannel(navList[(currentIdx - 1 + navList.length) % navList.length]);
  };

  // ---------- gate ----------
  if (!session) {
    return <AuthGate onAuthenticated={setSession} />;
  }

  const listTitle: Record<string, { t: string; s: string }> = {
    movies: { t: '🎬 فیلم‌های سینمایی', s: 'فیلم روز دنیا — خارجی، هندی، کره‌ای و ایرانی' },
    series: { t: '📺 سریال‌ها', s: 'سریال و مجموعه‌های تصویری' },
    cartoon: { t: '🧸 کارتونی‌ها', s: 'انیمیشن و کارتون کودک و نوجوان' },
    adult: { t: '🔞 بزرگسالان ۱۸+', s: 'مخصوص بزرگسالان — با فیلترشکن پخش می‌شود' },
    live: { t: '📡 شبکه‌های زنده ایران', s: 'شبکه‌های فارسی — بدون فیلترشکن' },
  };

  return (
    <div
      id="satellite-tv-root"
      className={`min-h-screen ${currentTheme.bgGradient} transition-colors duration-500 pb-20 flex flex-col`}
    >
      <Navbar
        currentTheme={currentTheme}
        onSelectTheme={handleSelectTheme}
        activeSatelliteName={selectedChannel.satellite}
        isLocked18Plus={isLocked18Plus}
        onToggleLock={() => {
          if (isLocked18Plus) setShowUnlockModal(true);
          else setIsLocked18Plus(true);
        }}
      />

      {/* auto-sync toast */}
      {syncMsg && (
        <div className="max-w-7xl w-full mx-auto px-3 pt-2">
          <div className="rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs font-bold px-4 py-2.5 flex items-center gap-2 animate-in fade-in">
            <Sparkles className="w-4 h-4" />
            <span>{syncMsg}</span>
          </div>
        </div>
      )}

      <PWAInstallBanner theme={currentTheme} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 py-3 space-y-4">
        {activeTab === 'player' && (
          <div className="space-y-4">
            <VideoPlayer
              channel={selectedChannel}
              theme={currentTheme}
              onNextChannel={handleNextChannel}
              onPrevChannel={handlePrevChannel}
              canDownload={!!session?.isVip}
              onRequestPro={() => setShowProModal(true)}
            />

            {/* quick category shortcuts */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setActiveTab('live')}
                className={`py-3 rounded-2xl border ${currentTheme.cardBorder} ${currentTheme.cardBg} text-xs font-black flex items-center justify-center gap-2`}
              >
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>شبکه‌های ایران ({allChannels.filter((c) => c.category === 'live').length})</span>
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-3 rounded-2xl border ${currentTheme.cardBorder} ${currentTheme.cardBg} text-xs font-black flex items-center justify-center gap-2`}
              >
                <Settings className="w-4 h-4 text-zinc-300" />
                <span>تنظیمات و افزودن M3U</span>
              </button>
            </div>

            {/* current tab quick carousel */}
            <div className={`p-3 rounded-2xl border ${currentTheme.cardBg} ${currentTheme.cardBorder} flex items-center gap-2 overflow-x-auto scrollbar-none`}>
              <Tv className="w-4 h-4 shrink-0 text-yellow-400" />
              {navList.slice(0, 14).map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => handleChannelSelect(ch)}
                  className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition border ${
                    ch.id === selectedChannel.id
                      ? `${currentTheme.primaryBtn} font-bold border-transparent`
                      : 'bg-black/30 border-white/10 opacity-70 hover:opacity-100'
                  }`}
                >
                  {ch.persianName}
                </button>
              ))}
            </div>
          </div>
        )}

        {(activeTab === 'movies' || activeTab === 'series' || activeTab === 'cartoon' || activeTab === 'adult' || activeTab === 'live') && (
          <div className="space-y-4 animate-in fade-in-50">
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="font-extrabold text-lg">{listTitle[activeTab].t}</h2>
                <p className="text-xs opacity-70">{listTitle[activeTab].s}</p>
              </div>
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl ${currentTheme.badgeBg}`}>
                {tabChannels.length} کانال
              </span>
            </div>

            {tabChannels.length === 0 ? (
              <div className={`p-10 rounded-3xl border ${currentTheme.cardBorder} ${currentTheme.cardBg} text-center`}>
                <p className="text-sm font-bold text-white">هنوز کانالی در این دسته نیست</p>
                <p className="text-xs opacity-60 mt-1">با افزودن لیست M3U از تنظیمات، کانال اضافه کن</p>
              </div>
            ) : (
              <ChannelList
                channels={tabChannels}
                selectedChannel={selectedChannel}
                onSelectChannel={handleChannelSelect}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                theme={currentTheme}
                isLocked18Plus={isLocked18Plus}
                onRequestUnlock18Plus={() => setShowUnlockModal(true)}
              />
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4 animate-in fade-in-50">
            <SettingsView
              currentTheme={currentTheme}
              onSelectTheme={handleSelectTheme}
              isLocked18Plus={isLocked18Plus}
              onToggleLock={() => {
                if (isLocked18Plus) setShowUnlockModal(true);
                else setIsLocked18Plus(true);
              }}
              onRequestResetData={handleResetData}
            />
            <CustomStreamModal
              onAddChannel={handleAddChannel}
              onAddMultipleChannels={handleAddMultipleChannels}
              theme={currentTheme}
            />
            <FrequencyGuide theme={currentTheme} />
            <button
              onClick={handleLogout}
              className="w-full py-3 rounded-2xl bg-red-950/50 hover:bg-red-900/60 border border-red-800/40 text-red-300 text-xs font-bold"
            >
              خروج از اشتراک (ورود با کد دیگر)
            </button>
          </div>
        )}
      </main>

      <ProModal
        isOpen={showProModal}
        onClose={() => setShowProModal(false)}
        theme={currentTheme}
        channelName={selectedChannel?.persianName}
      />

      <ParentalLockModal
        isOpen={showUnlockModal}
        onClose={() => setShowUnlockModal(false)}
        onUnlockSuccess={() => {
          setIsLocked18Plus(false);
          setShowUnlockModal(false);
        }}
        theme={currentTheme}
      />

      <BottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        theme={currentTheme}
        adultUnlocked={!isLocked18Plus}
      />
    </div>
  );
}

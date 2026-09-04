/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ActiveTab, Channel, ThemeColor } from './types';
import { INITIAL_CHANNELS } from './data/channels';
import { THEMES, ThemeConfig } from './theme';
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
import { NiniSession } from './types';
import { Tv, Radio, Flame, Sparkles, ChevronRight, ChevronLeft } from 'lucide-react';

export default function App() {
  // Subscription gate — session restored from localStorage (HMAC-verified code)
  const [session, setSession] = useState<NiniSession | null>(() => loadSession());

  const handleLogout = () => {
    saveSession(null);
    setSession(null);
  };

  // Theme state: defaults to green as requested, supports green, pink, black, yellow
  const [themeId, setThemeId] = useState<ThemeColor>(() => {
    const saved = localStorage.getItem('sat_theme');
    if (saved && (saved === 'green' || saved === 'pink' || saved === 'black' || saved === 'yellow')) {
      return saved as ThemeColor;
    }
    return 'green';
  });

  const currentTheme: ThemeConfig = THEMES[themeId] || THEMES.green;

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('player');

  // Channels state
  const [channels, setChannels] = useState<Channel[]>(() => {
    try {
      const saved = localStorage.getItem('sat_custom_channels');
      if (saved) {
        const custom = JSON.parse(saved);
        return [...INITIAL_CHANNELS, ...custom];
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_CHANNELS;
  });

  // Selected Channel for player
  const [selectedChannel, setSelectedChannel] = useState<Channel>(() => {
    return channels[0];
  });

  // Favorites
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sat_favorites');
      return saved ? JSON.parse(saved) : ['glamour-latelounge', 'cinema-persia-hd', 'fashion-bikini-tv'];
    } catch {
      return ['glamour-latelounge', 'cinema-persia-hd'];
    }
  });

  // 18+ Parental Lock
  const [isLocked18Plus, setIsLocked18Plus] = useState<boolean>(true);
  const [showUnlockModal, setShowUnlockModal] = useState<boolean>(false);
  const [showProModal, setShowProModal] = useState<boolean>(false);

  // Sync theme changes to localStorage and HTML theme-color
  const handleSelectTheme = (newTheme: ThemeColor) => {
    setThemeId(newTheme);
    localStorage.setItem('sat_theme', newTheme);

    // Update browser theme-color meta tag
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', THEMES[newTheme].colorCode);
    }
  };

  const handleToggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      localStorage.setItem('sat_favorites', JSON.stringify(next));
      return next;
    });
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
    if (newChans.length > 0) {
      setSelectedChannel(newChans[0]);
    }
    setActiveTab('channels');
  };

  const handleResetData = () => {
    if (window.confirm('آیا از بازنشانی شبکه‌ها به لیست پیش‌فرض اطمینان دارید؟')) {
      localStorage.removeItem('sat_custom_channels');
      localStorage.removeItem('sat_favorites');
      setChannels(INITIAL_CHANNELS);
      setSelectedChannel(INITIAL_CHANNELS[0]);
      setFavorites(['glamour-latelounge', 'cinema-persia-hd']);
      alert('شبکه‌ها با موفقیت به تنظیمات اولیه بازگشتند.');
    }
  };

  const handleChannelSelect = (channel: Channel) => {
    if (channel.is18Plus && isLocked18Plus) {
      setShowUnlockModal(true);
      return;
    }
    // PRO gate: non-free channels require a VIP subscription
    if (channel.free === false && !session?.isVip) {
      setShowProModal(true);
      return;
    }
    setSelectedChannel(channel);
    // Smoothly switch to player view if on mobile/small screens
    if (activeTab !== 'player') {
      setActiveTab('player');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Channel navigation (Next / Prev)
  const currentIdx = channels.findIndex((c) => c.id === selectedChannel.id);
  const handleNextChannel = () => {
    if (currentIdx !== -1) {
      const nextIdx = (currentIdx + 1) % channels.length;
      setSelectedChannel(channels[nextIdx]);
    }
  };
  const handlePrevChannel = () => {
    if (currentIdx !== -1) {
      const prevIdx = (currentIdx - 1 + channels.length) % channels.length;
      setSelectedChannel(channels[prevIdx]);
    }
  };

  if (!session) {
    return <AuthGate onAuthenticated={setSession} />;
  }

  return (
    <div
      id="satellite-tv-root"
      className={`min-h-screen ${currentTheme.bgGradient} transition-colors duration-500 pb-20 flex flex-col`}
    >
      {/* Top Android simulated Bar & Main Header with Theme buttons */}
      <Navbar
        currentTheme={currentTheme}
        onSelectTheme={handleSelectTheme}
        activeSatelliteName={selectedChannel.satellite}
        isLocked18Plus={isLocked18Plus}
        onToggleLock={() => {
          if (isLocked18Plus) {
            setShowUnlockModal(true);
          } else {
            setIsLocked18Plus(true);
          }
        }}
      />

      {/* In-App PWA Install Banner */}
      <PWAInstallBanner theme={currentTheme} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 py-3 space-y-4">
        {/* Tab 1: Live Player View */}
        {activeTab === 'player' && (
          <div className="space-y-4">
            {/* Primary Video Player */}
            <VideoPlayer
              channel={selectedChannel}
              theme={currentTheme}
              onNextChannel={handleNextChannel}
              onPrevChannel={handlePrevChannel}
              canDownload={!!session?.isVip}
              onRequestPro={() => setShowProModal(true)}
            />

            {/* Quick Channel Zap Bar (Next / Prev channel buttons and quick channel carousel) */}
            <div className={`p-3 rounded-2xl border ${currentTheme.cardBg} ${currentTheme.cardBorder} flex items-center justify-between gap-2 shadow-lg`}>
              <button
                onClick={handlePrevChannel}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center gap-1 transition active:scale-95"
                title="شبکه قبلی"
              >
                <ChevronRight className="w-4 h-4" />
                <span className="hidden sm:inline">شبکه قبلی</span>
              </button>

              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
                {channels.slice(0, 10).map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => handleChannelSelect(ch)}
                    className={`px-3 py-1 rounded-xl text-xs whitespace-nowrap transition border ${
                      ch.id === selectedChannel.id
                        ? `${currentTheme.primaryBtn} font-bold border-transparent`
                        : 'bg-black/30 border-white/10 opacity-70 hover:opacity-100'
                    }`}
                  >
                    {ch.persianName}
                  </button>
                ))}
              </div>

              <button
                onClick={handleNextChannel}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center gap-1 transition active:scale-95"
                title="شبکه بعدی"
              >
                <span className="hidden sm:inline">شبکه بعدی</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Channel Guide inside Player Tab */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-extrabold text-sm sm:text-base">سایر شبکه‌های ماهواره‌ای</h3>
                </div>
                <button
                  onClick={() => setActiveTab('channels')}
                  className={`text-xs font-bold underline ${currentTheme.accentText}`}
                >
                  مشاهده همه شبکه‌ها ({channels.length})
                </button>
              </div>

              <ChannelList
                channels={channels}
                selectedChannel={selectedChannel}
                onSelectChannel={handleChannelSelect}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                theme={currentTheme}
                isLocked18Plus={isLocked18Plus}
                onRequestUnlock18Plus={() => setShowUnlockModal(true)}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Channels Catalog */}
        {activeTab === 'channels' && (
          <div className="space-y-4 animate-in fade-in-50">
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="font-extrabold text-lg">لیست جامع شبکه‌های ماهواره</h2>
                <p className="text-xs opacity-70">دسته‌بندی، فرکانس‌ها و پخش آنلاین شبکه‌های فارسی و بین‌المللی</p>
              </div>
            </div>

            <ChannelList
              channels={channels}
              selectedChannel={selectedChannel}
              onSelectChannel={handleChannelSelect}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              theme={currentTheme}
              isLocked18Plus={isLocked18Plus}
              onRequestUnlock18Plus={() => setShowUnlockModal(true)}
            />
          </div>
        )}

        {/* Tab 3: Frequency Guide & Satellite Transponders */}
        {activeTab === 'frequencies' && (
          <div className="animate-in fade-in-50">
            <FrequencyGuide theme={currentTheme} />
          </div>
        )}

        {/* Tab 4: Add Custom Stream & M3U */}
        {activeTab === 'm3u' && (
          <div className="animate-in fade-in-50">
            <CustomStreamModal
              onAddChannel={handleAddChannel}
              onAddMultipleChannels={handleAddMultipleChannels}
              theme={currentTheme}
            />
          </div>
        )}

        {/* Tab 5: Settings & Themes */}
        {activeTab === 'settings' && (
          <div className="animate-in fade-in-50">
            <SettingsView
              currentTheme={currentTheme}
              onSelectTheme={handleSelectTheme}
              isLocked18Plus={isLocked18Plus}
              onToggleLock={() => {
                if (isLocked18Plus) {
                  setShowUnlockModal(true);
                } else {
                  setIsLocked18Plus(true);
                }
              }}
              onRequestResetData={handleResetData}
            />
          </div>
        )}
      </main>

      {/* PRO upsell modal */}
      <ProModal
        isOpen={showProModal}
        onClose={() => setShowProModal(false)}
        theme={currentTheme}
        channelName={selectedChannel?.persianName}
      />

      {/* Parental Lock Modal for 18+ Channels */}
      <ParentalLockModal
        isOpen={showUnlockModal}
        onClose={() => setShowUnlockModal(false)}
        onUnlockSuccess={() => {
          setIsLocked18Plus(false);
          setShowUnlockModal(false);
        }}
        theme={currentTheme}
      />

      {/* Android Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        theme={currentTheme}
        channelsCount={channels.length}
      />
    </div>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  RotateCcw,
  Clock,
  Settings2,
  Signal,
  Sparkles,
  Tv,
  Check,
  AlertCircle
} from 'lucide-react';
import { Channel } from '../types';
import { ThemeConfig } from '../theme';
import { Download, Lock } from 'lucide-react';
import NiniDownload from '../plugins/nini-download';
import { proxied } from '../plugins/nini-stream-proxy';

interface Props {
  channel: Channel;
  theme: ThemeConfig;
  onNextChannel?: () => void;
  onPrevChannel?: () => void;
  canDownload?: boolean;
  onRequestPro?: () => void;
}

export const VideoPlayer: React.FC<Props> = ({
  channel,
  theme,
  onNextChannel,
  onPrevChannel,
  canDownload,
  onRequestPro,
}) => {
  const [downloading, setDownloading] = useState<boolean>(false);
  const [downloadMsg, setDownloadMsg] = useState<string | null>(null);

  const handleDownload = async () => {
    if (!canDownload) {
      onRequestPro?.();
      return;
    }
    if (downloading) return;
    setDownloading(true);
    setDownloadMsg('در حال دانلود… فایل در پوشه Downloads ذخیره می‌شود');
    try {
      const res = await NiniDownload.download({ url: channel.streamUrl, title: channel.name });
      if (res.ok) setDownloadMsg('✅ دانلود تمام شد → ' + (res.path || 'پوشه Downloads'));
      else setDownloadMsg('❌ خطا: ' + (res.error || 'ناموفق'));
    } catch (e: any) {
      setDownloadMsg('❌ خطا: ' + (e?.message || 'پلاگین دانلود در دسترس نیست'));
    } finally {
      setDownloading(false);
      setTimeout(() => setDownloadMsg(null), 6000);
    }
  };
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.8);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<'cover' | 'contain' | 'fill'>('contain');
  const [streamError, setStreamError] = useState<boolean>(false);
  const [usingBackup, setUsingBackup] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [bitrate, setBitrate] = useState<string>('4.8 Mbps');
  const [signalQuality, setSignalQuality] = useState<number>(94);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [sleepRemainingSeconds, setSleepRemainingSeconds] = useState<number | null>(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState<boolean>(false);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sleep timer countdown
  useEffect(() => {
    if (sleepRemainingSeconds === null) return;
    if (sleepRemainingSeconds <= 0) {
      if (videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
      setSleepTimerMinutes(null);
      setSleepRemainingSeconds(null);
      return;
    }
    const timer = setInterval(() => {
      setSleepRemainingSeconds((prev) => (prev ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(timer);
  }, [sleepRemainingSeconds]);

  // Setup HLS / Video stream
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let cancelled = false;

    setIsLoading(true);
    setStreamError(false);

    const activeUrl = (usingBackup && channel.backupStreamUrl ? channel.backupStreamUrl : channel.streamUrl);

    // Proxy the stream through the native server first (handles CORS + headers).
    (async () => {
      let resolvedUrl = activeUrl;
      let triedDirect = false;
      try { resolvedUrl = await proxied(activeUrl); } catch { /* fall back to direct */ }
      if (cancelled) return;

      // Destroy existing HLS instance
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      // If the native proxy URL itself fails, retry ONCE with the direct URL.
      const fallbackToDirect = (): boolean => {
        if (!triedDirect && resolvedUrl.indexOf('127.0.0.1') !== -1) {
          triedDirect = true;
          resolvedUrl = activeUrl;
          startPlayback();
          return true;
        }
        return false;
      };

      const startPlayback = () => {
        if (video.canPlayType('application/vnd.apple.mpegurl') && resolvedUrl.endsWith('.m3u8')) {
          video.src = resolvedUrl;
          video.load();
          video.play().catch(() => setIsPlaying(false));
        } else if (Hls.isSupported() && (resolvedUrl.includes('.m3u8') || !resolvedUrl.endsWith('.mp4'))) {
          const hls = new Hls({ enableWorker: true, lowLatencyMode: true, backBufferLength: 90 });
          hlsRef.current = hls;
          hls.loadSource(resolvedUrl);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setIsLoading(false);
            video.play().catch(() => setIsPlaying(false));
          });
          hls.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal) {
              console.warn('HLS stream error:', data);
              if (fallbackToDirect()) return;
              if (channel.backupStreamUrl && !usingBackup) setUsingBackup(true);
              else { setStreamError(true); setIsLoading(false); }
            }
          });
        } else {
          video.src = resolvedUrl;
          video.load();
          video.play().catch(() => setIsPlaying(false));
        }
      };

      startPlayback();
    })();

    const handlePlaying = () => { setIsLoading(false); setIsPlaying(true); setStreamError(false); };
    const handleWaiting = () => setIsLoading(true);
    const handleError = () => {
      if (channel.backupStreamUrl && !usingBackup) setUsingBackup(true);
      else { setStreamError(true); setIsLoading(false); }
    };
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('error', handleError);

    return () => {
      cancelled = true;
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('error', handleError);
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    };
  }, [channel.id, usingBackup]);

  // Handle Fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch((err) => console.error(err));
    } else {
      document.exitFullscreen?.().catch((err) => console.error(err));
    }
  };

  const reloadStream = () => {
    setIsLoading(true);
    setStreamError(false);
    if (videoRef.current) {
      const src = videoRef.current.src;
      videoRef.current.src = '';
      videoRef.current.src = src;
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  };

  const handleUserActivity = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 4500);
  };

  const setSleepTimer = (minutes: number | null) => {
    setSleepTimerMinutes(minutes);
    if (minutes === null) {
      setSleepRemainingSeconds(null);
    } else {
      setSleepRemainingSeconds(minutes * 60);
    }
    setShowSettingsMenu(false);
  };

  return (
    <div
      ref={containerRef}
      id="video-player-container"
      onMouseMove={handleUserActivity}
      onClick={handleUserActivity}
      className={`relative w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border ${theme.cardBorder} transition-all duration-300 group select-none`}
    >
      {/* HTML5 Video Tag */}
      <video
        ref={videoRef}
        playsInline
        autoPlay
        className={`w-full h-full object-${aspectRatio}`}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Loading Spinner */}
      {isLoading && !streamError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-xs z-20 pointer-events-none">
          <div className="relative flex items-center justify-center">
            <div className={`w-14 h-14 rounded-full border-4 border-t-transparent animate-spin ${theme.accentBorder}`}></div>
            <Tv className="w-6 h-6 absolute text-white/80 animate-pulse" />
          </div>
          <span className="mt-3 text-xs font-semibold text-white/90">در حال دریافت سیگنال ماهواره...</span>
        </div>
      )}

      {/* Stream Error / Reconnect UI */}
      {streamError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-6 z-30 text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mb-3 animate-bounce" />
          <h4 className="text-base font-bold text-white mb-1">قطع ارتباط یا ضعیف بودن سیگنال</h4>
          <p className="text-xs text-slate-300 max-w-sm mb-4 leading-relaxed">
            استریم زنده شبکه {channel.persianName} در این لحظه پاسخ نمی‌دهد. می‌توانید سرور پشتیبان را امتحان کرده یا دوباره تلاش کنید.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              onClick={reloadStream}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${theme.primaryBtn}`}
            >
              <RotateCcw className="w-4 h-4" />
              تلاش مجدد
            </button>
            {channel.backupStreamUrl && !usingBackup && (
              <button
                onClick={() => setUsingBackup(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white/20 hover:bg-white/30 text-white transition"
              >
                پخش با سرور پشتیبان
              </button>
            )}
          </div>
        </div>
      )}

      {/* Top Floating Channel Info HUD */}
      <div
        className={`absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent z-20 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={channel.logo}
              alt={channel.name}
              className="w-10 h-10 rounded-xl object-cover border border-white/20 shadow-md bg-slate-900"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight drop-shadow-md">
                  {channel.persianName}
                </h3>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${theme.badgeBg}`}>
                  {channel.quality}
                </span>
                {channel.is18Plus && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-rose-600 text-white">
                    ۱۸+
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-white/70 font-mono mt-0.5">
                <span>{channel.satellite}</span>
                <span>•</span>
                <span>{channel.frequency || '11900 H 27500'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Satellite Live Signal Status Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 border border-white/10 text-[11px] text-white/90">
              <Signal className="w-3.5 h-3.5 text-emerald-400" />
              <span>کیفیت:</span>
              <span className="font-mono text-emerald-400 font-bold">{signalQuality}%</span>
            </div>

            {/* Sleep Timer Indicator if active */}
            {sleepRemainingSeconds !== null && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-[11px] text-amber-300 font-mono">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {Math.floor(sleepRemainingSeconds / 60)}:
                  {(sleepRemainingSeconds % 60).toString().padStart(2, '0')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Floating Player Controls */}
      <div
        className={`absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-20 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          {/* Left Controls (Play, Volume, Reload) */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={togglePlay}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-transform active:scale-95 ${theme.primaryBtn}`}
              title={isPlaying ? 'توقف' : 'پخش'}
              aria-label={isPlaying ? 'توقف' : 'پخش'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            <button
              onClick={reloadStream}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
              title="اتصال مجدد سیگنال"
              aria-label="اتصال مجدد سیگنال"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-1.5 bg-black/50 px-2 py-1.5 rounded-xl border border-white/10">
              <button
                onClick={toggleMute}
                className="text-white hover:text-emerald-400 transition"
                title={isMuted ? 'صدا وصل شود' : 'بی‌صدا'}
                aria-label="کنترل صدا"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-14 sm:w-20 accent-emerald-500 cursor-pointer h-1.5"
                aria-label="میزان صدا"
              />
            </div>
          </div>

          {/* Right Controls (Aspect Ratio, Sleep Timer, Fullscreen) */}
          <div className="flex items-center gap-2">
            {/* Aspect Ratio Toggle */}
            <button
              onClick={() => {
                setAspectRatio((prev) => (prev === 'contain' ? 'cover' : prev === 'cover' ? 'fill' : 'contain'));
              }}
              className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-mono transition hidden sm:block"
              title="نسبت تصویر"
            >
              {aspectRatio === 'contain' ? '16:9 استاندارد' : aspectRatio === 'cover' ? 'تمام صفحه (Cover)' : 'کشش کامل'}
            </button>

            {/* Sleep Timer & Settings Toggle */}
            <div className="relative">
              <button
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className={`p-2 rounded-xl text-white transition ${showSettingsMenu ? theme.badgeBg : 'bg-white/10 hover:bg-white/20'}`}
                title="تایمر خواب و تنظیمات"
                aria-label="تنظیمات پلیر"
              >
                <Clock className="w-4 h-4" />
              </button>

              {showSettingsMenu && (
                <div className={`absolute bottom-12 left-0 w-48 rounded-2xl p-3 shadow-2xl border ${theme.cardBg} ${theme.cardBorder} z-50 text-right`}>
                  <div className="text-xs font-bold mb-2 flex items-center justify-between text-white border-b border-white/10 pb-1.5">
                    <span>تایمر خواب خودکار</span>
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-1 text-xs">
                    {[
                      { label: 'غیرفعال', value: null },
                      { label: '۱۵ دقیقه دیگر', value: 15 },
                      { label: '۳۰ دقیقه دیگر', value: 30 },
                      { label: '۴۵ دقیقه دیگر', value: 45 },
                      { label: '۶۰ دقیقه دیگر', value: 60 },
                    ].map((item) => (
                      <button
                        key={String(item.value)}
                        onClick={() => setSleepTimer(item.value)}
                        className={`w-full text-right px-2 py-1.5 rounded-lg flex items-center justify-between transition ${
                          sleepTimerMinutes === item.value
                            ? `${theme.badgeBg} font-bold`
                            : 'hover:bg-white/10 text-white/80'
                        }`}
                      >
                        <span>{item.label}</span>
                        {sleepTimerMinutes === item.value && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 ${
                canDownload ? 'bg-emerald-600/80 hover:bg-emerald-500 text-white' : 'bg-white/10 text-zinc-400'
              }`}
              title={canDownload ? 'دانلود این شبکه' : 'دانلود فقط برای مشترکین VIP'}
            >
              {downloading ? <RotateCcw className="w-4 h-4 animate-spin" /> : canDownload ? <Download className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              <span className="hidden sm:inline">{downloading ? 'در حال دانلود…' : 'دانلود'}</span>
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 ${theme.primaryBtn}`}
              title="تمام‌صفحه"
              aria-label="تمام صفحه"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{isFullscreen ? 'خروج' : 'تمام‌صفحه'}</span>
            </button>
          </div>
          {downloadMsg && (
            <div className="px-3 py-2 bg-black/85 border-t border-white/10 text-[11px] text-white font-semibold">
              {downloadMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

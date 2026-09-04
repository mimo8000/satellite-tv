import React from 'react';
import {
  Palette,
  Shield,
  Lock,
  Unlock,
  Smartphone,
  Info,
  Check,
  RefreshCw,
  Zap,
  Volume2,
  Tv
} from 'lucide-react';
import { ThemeColor } from '../types';
import { ThemeConfig, THEMES } from '../theme';

interface Props {
  currentTheme: ThemeConfig;
  onSelectTheme: (theme: ThemeColor) => void;
  isLocked18Plus: boolean;
  onToggleLock: () => void;
  onRequestResetData: () => void;
}

export const SettingsView: React.FC<Props> = ({
  currentTheme,
  onSelectTheme,
  isLocked18Plus,
  onToggleLock,
  onRequestResetData,
}) => {
  const themeOptions: {
    id: ThemeColor;
    title: string;
    description: string;
    previewBg: string;
    accentColor: string;
  }[] = [
    {
      id: 'green',
      title: 'تم سبز (Green / زمردی)',
      description: 'طراحی تمام‌صفحه با پس‌زمینه سبز سایبر، افکت‌های نئونی زمردی و خوانایی عالی',
      previewBg: 'bg-emerald-950 border-emerald-500',
      accentColor: 'bg-emerald-500 text-slate-950',
    },
    {
      id: 'pink',
      title: 'تم صورتی (Pink / فوشیا)',
      description: 'طراحی شاداب تمام‌صفحه با رنگ سرخابی و صورتی نئونی برای شبکه‌های مد و شبانه',
      previewBg: 'bg-pink-950 border-pink-500',
      accentColor: 'bg-pink-500 text-white',
    },
    {
      id: 'black',
      title: 'تم سیاه (Black / آمولد)',
      description: 'تم تاریک مطلق و کم‌مصرف برای نمایشگرهای AMOLED با کنتراست حداکثری',
      previewBg: 'bg-zinc-950 border-zinc-700',
      accentColor: 'bg-zinc-100 text-zinc-950',
    },
    {
      id: 'yellow',
      title: 'تم زرد (Yellow / سایبرپانک)',
      description: 'تم مدرن طلایی و کهربایی با انرژی بالا و المان‌های کنتراست تیره',
      previewBg: 'bg-amber-950 border-amber-500',
      accentColor: 'bg-yellow-400 text-slate-950',
    },
  ];

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-6">
      {/* Theme Selection Section */}
      <div className={`p-5 rounded-3xl border ${currentTheme.cardBg} ${currentTheme.cardBorder} space-y-3.5 shadow-xl`}>
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <Palette className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="font-extrabold text-sm sm:text-base">تم و استایل رنگی تمام‌صفحه</h3>
            <p className="text-xs opacity-70">طبق درخواست شما، با انتخاب هر تم کل صفحه به رنگ مورد نظر تغییر می‌یابد</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {themeOptions.map((opt) => {
            const isSelected = currentTheme.id === opt.id;

            return (
              <div
                key={opt.id}
                onClick={() => onSelectTheme(opt.id)}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 ${opt.previewBg} ${
                  isSelected ? 'ring-2 ring-white scale-[1.02] shadow-xl' : 'opacity-80 hover:opacity-100'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-extrabold text-sm">{opt.title}</span>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] opacity-80 leading-relaxed">{opt.description}</p>
                </div>

                <button
                  className={`w-full py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${opt.accentColor}`}
                >
                  {isSelected ? 'تم فعال فعلی' : 'اعمال این تم'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Parental Control & 18+ Section */}
      <div className={`p-5 rounded-3xl border ${currentTheme.cardBg} ${currentTheme.cardBorder} space-y-3 shadow-xl`}>
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <Shield className="w-5 h-5 text-rose-400" />
          <div>
            <h3 className="font-extrabold text-sm sm:text-base">تنظیمات شبکه‌های شبانه ۱۸+ و کنترل والدین</h3>
            <p className="text-xs opacity-70">مدیریت قفل پین‌کد برای دسته‌بندی شبکه‌های بزرگسالان</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-2xl bg-black/40 border border-white/10">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isLocked18Plus ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
              {isLocked18Plus ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm">
                وضعیت قفل: {isLocked18Plus ? 'فعال (رمز لازم است)' : 'غیرفعال (آزاد)'}
              </h4>
              <p className="text-[11px] opacity-70 mt-0.5">
                رمز عبور پیش‌فرض: <span className="font-mono font-bold text-amber-300">1234</span>
              </p>
            </div>
          </div>

          <button
            onClick={onToggleLock}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              isLocked18Plus
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isLocked18Plus ? 'باز کردن قفل' : 'قفل کردن'}
          </button>
        </div>
      </div>

      {/* App Info & Reset */}
      <div className={`p-5 rounded-3xl border ${currentTheme.cardBg} ${currentTheme.cardBorder} space-y-3 shadow-xl`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-cyan-400" />
            <h4 className="font-bold text-sm">نسخه اپلیکیشن ماهواره تی‌وی اندروید</h4>
          </div>
          <span className="text-xs font-mono font-bold opacity-75">v2.5.0 Pro</span>
        </div>
        <p className="text-xs opacity-75 leading-relaxed">
          این اپلیکیشن با استانداردهای وب پیشرونده (PWA) سازگار بوده و قابلیت نصب تمام‌صفحه و آفلاین روی انواع گوشی‌ها و تبلت‌های اندروید، تلویزیون‌های هوشمند (Android TV) و دسکتاپ را داراست.
        </p>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onRequestResetData}
            className="text-xs text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>بازنشانی شبکه‌ها به حالت اولیه کارخانه</span>
          </button>
        </div>
      </div>
    </div>
  );
};

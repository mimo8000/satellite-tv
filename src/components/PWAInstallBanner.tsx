import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2, ShieldCheck } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { ThemeConfig } from '../theme';

interface Props {
  theme: ThemeConfig;
}

export const PWAInstallBanner: React.FC<Props> = ({ theme }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled || isDismissed) {
    return null;
  }

  return (
    <>
      <div
        id="pwa-install-banner"
        className={`mx-4 my-3 p-3.5 rounded-2xl border ${theme.cardBg} ${theme.cardBorder} shadow-lg transition-all relative overflow-hidden`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${theme.primaryBtn}`}>
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight">نصب اپلیکیشن اندروید</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${theme.badgeBg}`}>PWA Ready</span>
              </div>
              <p className="text-xs opacity-75 mt-0.5">
                دسترسی تمام‌صفحه بدون فیلتر و بدون مرورگر روی صفحه اصلی گوشی
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isInstallable ? (
              <button
                id="btn-install-android"
                onClick={install}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-transform active:scale-95 ${theme.primaryBtn}`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>نصب سریع</span>
              </button>
            ) : isIOS ? (
              <button
                id="btn-install-ios"
                onClick={() => setShowIOSGuide(true)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${theme.primaryBtn}`}
              >
                <span>راهنمای آیفون</span>
              </button>
            ) : (
              <button
                id="btn-install-android-help"
                onClick={() => {
                  alert('برای نصب در اندروید: در منوی کروم روی سه نقطه (⋮) زده و گزینه «افزودن به صفحه اصلی / Add to Home screen» را انتخاب کنید.');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${theme.primaryBtn}`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>نصب در صفحه اصلی</span>
              </button>
            )}

            <button
              onClick={() => setIsDismissed(true)}
              className="p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:bg-white/10 transition"
              title="بستن"
              aria-label="بستن"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className={`w-full max-w-sm rounded-2xl p-6 border ${theme.cardBg} ${theme.cardBorder} shadow-2xl`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                نصب در iOS / آیفون
              </h3>
              <button onClick={() => setShowIOSGuide(false)} className="p-1 rounded hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>
            <ol className="text-xs space-y-2.5 leading-relaxed opacity-90">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0 font-bold">۱</span>
                <span>در مرورگر سافاری روی دکمه Share (اشتراک‌گذاری در پایین) کلیک کنید.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0 font-bold">۲</span>
                <span>به پایین اسکرول کرده و گزینه <strong>Add to Home Screen (افزودن به صفحه اصلی)</strong> را لمس کنید.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0 font-bold">۳</span>
                <span>گزینه Add در بالا را بزنید تا آیکون ماهواره به برنامه‌های شما اضافه شود.</span>
              </li>
            </ol>
            <button
              onClick={() => setShowIOSGuide(false)}
              className={`mt-5 w-full py-2.5 rounded-xl font-bold text-xs ${theme.primaryBtn}`}
            >
              متوجه شدم
            </button>
          </div>
        </div>
      )}
    </>
  );
};

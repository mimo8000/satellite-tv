import React from 'react';
import { Crown, X, Ticket, Download, Zap, Lock } from 'lucide-react';
import { ThemeConfig } from '../theme';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeConfig;
  channelName?: string;
}

export const ProModal: React.FC<Props> = ({ isOpen, onClose, theme, channelName }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className={`w-full max-w-sm rounded-3xl border ${theme.cardBorder} bg-gradient-to-b from-slate-900 to-black p-6 shadow-2xl relative`}>
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-zinc-400"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center mt-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg shadow-yellow-500/30 mb-3">
            <Lock className="w-8 h-8 text-black" />
          </div>
          <h3 className="text-lg font-black text-white">این شبکه ویژه مشترکین VIP است</h3>
          {channelName && (
            <p className="text-xs text-yellow-300 font-bold mt-1">{channelName}</p>
          )}
          <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
            با ارتقای اشتراک به VIP می‌تونی همه فیلم‌ها، سریال‌ها، کارتون‌ها و شبکه‌های پرو رو
            تماشا کنی و دانلود هم بکنی.
          </p>

          <div className="w-full grid grid-cols-2 gap-2 mt-4 text-[11px]">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
              <Zap className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
              <div className="text-white font-bold">۲۰۰ تومان</div>
              <div className="text-zinc-500">اشتراک عادی</div>
            </div>
            <div className="rounded-2xl bg-yellow-500/10 border border-yellow-500/30 p-3">
              <Crown className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
              <div className="text-white font-bold">۸۰۰ تومان</div>
              <div className="text-zinc-500">VIP + دانلود</div>
            </div>
          </div>

          <div className="w-full space-y-2 mt-4">
            <a
              href="https://t.me/bot_NINIPRO_bot"
              target="_blank"
              rel="noreferrer"
              className={`w-full py-3 rounded-2xl text-sm font-black flex items-center justify-center gap-2 ${theme.primaryBtn}`}
            >
              <Ticket className="w-4 h-4" />
              <span>دریافت کد از ربات تلگرام</span>
            </a>
            <a
              href="https://t.me/SasaX60"
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 flex items-center justify-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              <span>پشتیبانی و خرید مستقیم: @SasaX60</span>
            </a>
          </div>

          <button
            onClick={onClose}
            className="mt-3 text-[11px] text-zinc-500 hover:text-zinc-300"
          >
            فعلاً نه — برگرد به شبکه‌های رایگان
          </button>
        </div>
      </div>
    </div>
  );
};

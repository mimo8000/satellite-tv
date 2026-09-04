import React, { useState } from 'react';
import { KeyRound, ShieldCheck, Crown, Loader2, Ticket, AlertCircle } from 'lucide-react';
import { verifyCode, NiniTier } from '../utils/license';
import { NiniSession } from '../types';

const STORAGE_KEY = 'nini_tv_session';

export function loadSession(): NiniSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as NiniSession;
    if (!s || !s.code) return null;
    return s;
  } catch {
    return null;
  }
}

export function saveSession(s: NiniSession | null) {
  try {
    if (s) localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

interface Props {
  onAuthenticated: (session: NiniSession) => void;
}

const TIER_LABEL: Record<NiniTier, string> = {
  standard: 'کاربر عادی',
  vip_premium: 'کاربر طلایی (VIP)',
  admin_unlimited: 'مدیر کل',
};

export const AuthGate: React.FC<Props> = ({ onAuthenticated }) => {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setError('کد اشتراک را وارد کنید.');
      return;
    }
    if (!/^NINI-[A-Z0-9]{5}-[A-Z0-9]{5}$/.test(trimmed)) {
      setError('قالب کد نامعتبر است. نمونه: NINI-XXXXX-XXXXX');
      return;
    }
    setBusy(true);
    const res = await verifyCode(trimmed);
    setBusy(false);
    if (!res.ok) {
      setError('این کد اشتراک معتبر نیست. برای خرید کد به پشتیبانی پیام دهید.');
      return;
    }
    const session: NiniSession = {
      code: res.code,
      tier: res.tier,
      isVip: res.isVip,
      isAdmin: res.isAdmin,
      activatedAt: Date.now(),
    };
    saveSession(session);
    onAuthenticated(session);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-zinc-900 to-black flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-yellow-400 via-amber-500 to-yellow-600 shadow-2xl shadow-yellow-500/30 mb-4">
            <Crown className="w-10 h-10 text-black" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Nini TV Pro</h1>
          <p className="text-sm text-zinc-400 mt-1.5">
            نینی تی‌وی پرو — تماشای شبکه‌های زنده، فیلم، سریال و کارتون
          </p>
        </div>

        {/* Code form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-6 space-y-4 shadow-2xl"
        >
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Ticket className="w-5 h-5 text-yellow-400" />
            <span>برای ورود، کد اشتراک خود را وارد کنید</span>
          </div>

          <div className="relative">
            <KeyRound className="w-4 h-4 text-zinc-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              dir="ltr"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="NINI-XXXXX-XXXXX"
              autoFocus
              className="w-full pr-10 pl-4 py-3.5 rounded-2xl bg-black/60 border border-white/20 text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-yellow-400 text-center tracking-widest"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 text-xs text-red-300 bg-red-950/50 border border-red-800/40 rounded-2xl p-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black text-sm font-black flex items-center justify-center gap-2 transition active:scale-[0.98] shadow-lg shadow-yellow-500/20 disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            <span>{busy ? 'در حال بررسی…' : 'ورود به اپلیکیشن'}</span>
          </button>
        </form>

        {/* How to get a code */}
        <div className="mt-5 rounded-3xl border border-white/10 bg-black/40 p-5 space-y-3">
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            <Crown className="w-4 h-4 text-yellow-400" />
            چطور کد اشتراک بگیرم؟
          </h3>
          <ul className="text-xs text-zinc-400 space-y-2 leading-relaxed">
            <li className="flex gap-2">
              <span className="text-yellow-400 font-bold shrink-0">۱.</span>
              <span>
                به ربات تلگرام <b className="text-white">@bot_NINIPRO_bot</b> پیام بده یا با پشتیبانی{' '}
                <b className="text-white">@SasaX60</b> در تماس باش.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-yellow-400 font-bold shrink-0">۲.</span>
              <span>
                اشتراک <b className="text-emerald-300">۱ ماهه = ۲۰۰ تومان</b> —{' '}
                <b className="text-sky-300">VIP (بدون محدودیت + دانلود) = ۸۰۰ تومان</b>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-yellow-400 font-bold shrink-0">۳.</span>
              <span>کد ۱۵ رقمی را در کادر بالا وارد کن و وارد شو.</span>
            </li>
          </ul>
          <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2 text-[11px]">
            <div className="rounded-xl bg-white/5 p-2.5">
              <div className="text-zinc-500 mb-0.5">اشتراک عادی</div>
              <div className="text-white font-bold">تماشای شبکه‌ها و فیلم‌های رایگان</div>
            </div>
            <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-2.5">
              <div className="text-yellow-500/80 mb-0.5">اشتراک VIP</div>
              <div className="text-white font-bold">همه محتوا + دانلود + بدون تبلیغ</div>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-zinc-600 mt-4">
          کدها آفلاین و با امضای رمزنگاری شده بررسی می‌شوند — بدون نیاز به سرور
        </p>
      </div>
    </div>
  );
};

export { TIER_LABEL };

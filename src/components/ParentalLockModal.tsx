import React, { useState } from 'react';
import { Lock, X, AlertTriangle, ShieldCheck } from 'lucide-react';
import { ThemeConfig } from '../theme';
import { verifyAdultPin } from '../config/adultPin';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUnlockSuccess: () => void;
  theme: ThemeConfig;
}

export const ParentalLockModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onUnlockSuccess,
  theme,
}) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [checking, setChecking] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleKeyPress = (num: string) => {
    if (pin.length >= 4 || checking) return;
    const newPin = pin + num;
    setPin(newPin);
    setError('');
    if (newPin.length === 4) {
      setChecking(true);
      verifyAdultPin(newPin)
        .then((ok) => {
          if (ok) {
            onUnlockSuccess();
            setPin('');
          } else {
            setError('رمز اشتباه است.');
            setPin('');
          }
        })
        .finally(() => setChecking(false));
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div
        className={`w-full max-w-sm rounded-3xl p-6 border ${theme.cardBg} ${theme.cardBorder} shadow-2xl relative text-center`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 rounded-full hover:bg-white/10 opacity-70 hover:opacity-100 transition"
          aria-label="بستن"
        >
          <X className="w-5 h-5" />
        </button>

        <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-3 shadow-lg ${theme.primaryBtn}`}>
          <Lock className="w-7 h-7" />
        </div>

        <h3 className="text-lg font-black text-white mb-1">قفل شبکه‌های شبانه ۱۸+</h3>
        <p className="text-xs text-white/70 mb-4 leading-relaxed">
          برای دسترسی به شبکه‌های شبانه و استایل ۱۸+، پین‌کد ۴ رقمی را وارد کنید.
          <br />
          <span className="text-amber-400 font-bold mt-1 inline-block">رمز را از پشتیبانی بگیرید</span>
        </p>

        {/* PIN Dots */}
        <div className="flex justify-center gap-3 mb-5">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                index < pin.length
                  ? `${theme.accentBorder} bg-emerald-400 scale-110`
                  : 'border-white/30 bg-white/5'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="mb-4 text-xs font-bold text-rose-400 flex items-center justify-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'لغو', '0', '⌫'].map((key) => {
            if (key === 'لغو') {
              return (
                <button
                  key={key}
                  onClick={onClose}
                  className="p-3 text-xs font-bold rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 transition"
                >
                  لغو
                </button>
              );
            }
            if (key === '⌫') {
              return (
                <button
                  key={key}
                  onClick={handleBackspace}
                  className="p-3 text-xs font-bold rounded-2xl bg-white/5 hover:bg-white/10 text-rose-400 transition"
                >
                  پاک کردن
                </button>
              );
            }
            return (
              <button
                key={key}
                onClick={() => handleKeyPress(key)}
                className="p-3.5 text-base font-bold rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-white transition font-mono"
              >
                {key}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-2 text-[11px] text-white/50">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>امنیت اختصاصی با استاندارد کنترل والدین</span>
        </div>
      </div>
    </div>
  );
};

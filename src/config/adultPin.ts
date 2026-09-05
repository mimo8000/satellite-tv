/**
 * Nini TV Pro — 18+ parental PIN.
 * Priority:
 *   1) PIN set by the owner IN THE APP (persisted locally) — always wins.
 *   2) PIN pushed to GitHub (src/config/adultPin.json) — changeable without rebuild.
 *   3) Bundled default.
 */
import localConfig from './adultPin.json';

const REMOTE = 'https://raw.githubusercontent.com/mimo8000/satellite-tv/main/src/config/adultPin.json';
// use a benign-looking key so the value isn't obvious in DevTools
const CUSTOM_KEY = 'nini_app_prefs_18';
const CACHE_KEY = 'nini_pin_cache';

export function getCustomPin(): string | null {
  const v = localStorage.getItem(CUSTOM_KEY);
  return v && /^\d{4}$/.test(v) ? v : null;
}

export function setAdultPin(pin: string): boolean {
  if (!/^\d{4}$/.test(pin)) return false;
  localStorage.setItem(CUSTOM_KEY, pin);
  return true;
}

export function clearAdultPin(): void {
  localStorage.removeItem(CUSTOM_KEY);
}

export async function getAdultPin(): Promise<string> {
  const custom = getCustomPin();
  if (custom) return custom;

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(REMOTE + '?t=' + Date.now(), { signal: ctrl.signal });
    clearTimeout(timer);
    if (res.ok) {
      const j = await res.json();
      const pin = String(j.pin || '').trim();
      if (/^\d{4}$/.test(pin)) {
        localStorage.setItem(CACHE_KEY, pin);
        return pin;
      }
    }
  } catch {
    /* offline */
  }
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached && /^\d{4}$/.test(cached)) return cached;
  return String((localConfig as { pin: string }).pin);
}

export async function verifyAdultPin(input: string): Promise<boolean> {
  const pin = await getAdultPin();
  return input === pin;
}

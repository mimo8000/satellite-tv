/**
 * Nini TV Pro — 18+ parental PIN.
 * The PIN is fetched from GitHub (raw) so the owner can change it anytime
 * WITHOUT rebuilding the APK: just edit src/config/adultPin.json in the repo
 * (or run the set_adult_pin.sh script) and push — the app picks it up on the
 * next unlock attempt. Falls back to the bundled default if offline.
 */
import localConfig from './adultPin.json';

const REMOTE = 'https://raw.githubusercontent.com/mimo8000/satellite-tv/main/src/config/adultPin.json';

let cached: string | null = null;

export async function getAdultPin(): Promise<string> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(REMOTE + '?t=' + Date.now(), { signal: ctrl.signal });
    clearTimeout(timer);
    if (res.ok) {
      const j = await res.json();
      const pin = String(j.pin || '').trim();
      if (/^\d{4}$/.test(pin)) {
        cached = pin;
        localStorage.setItem('nini_adult_pin', pin);
        return pin;
      }
    }
  } catch {
    /* offline — use local fallback */
  }
  const saved = localStorage.getItem('nini_adult_pin');
  if (saved && /^\d{4}$/.test(saved)) return saved;
  cached = String((localConfig as { pin: string }).pin);
  return cached;
}

export async function verifyAdultPin(input: string): Promise<boolean> {
  const pin = await getAdultPin();
  return input === pin;
}

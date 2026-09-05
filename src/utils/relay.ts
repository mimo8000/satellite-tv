/**
 * Nini TV Pro — US relay bridge.
 * Adult (and any blocked) streams are wrapped through the relay server
 * (Railway US box + Cloudflare tunnel) so they play WITHOUT a VPN on the phone.
 * The relay base URL lives in relay.json in the GitHub repo, so it can be
 * updated without rebuilding the APK.
 */
const RELAY_CONFIG_URL =
  'https://raw.githubusercontent.com/mimo8000/satellite-tv/main/relay.json';

let cached: string | null = null;

export async function relayBase(): Promise<string | null> {
  if (cached) return cached;
  try {
    const r = await fetch(RELAY_CONFIG_URL + '?t=' + Date.now(), { cache: 'no-store' });
    const j = await r.json();
    if (j && typeof j.baseUrl === 'string' && j.baseUrl.startsWith('https://')) {
      cached = j.baseUrl;
      try { localStorage.setItem('nini_relay', cached); } catch { /* ignore */ }
      return cached;
    }
  } catch { /* offline — fall back to cached */ }
  try {
    const ls = localStorage.getItem('nini_relay');
    if (ls && ls.startsWith('https://')) { cached = ls; return cached; }
  } catch { /* ignore */ }
  return null;
}

function b64url(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Wrap a stream URL through the US relay. Returns null if relay unknown. */
export async function relayProxied(url: string): Promise<string | null> {
  const base = await relayBase();
  if (!base) return null;
  return base + '/p/' + b64url(url);
}

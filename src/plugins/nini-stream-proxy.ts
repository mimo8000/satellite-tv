/**
 * Nini TV Pro — native stream proxy bridge.
 * Wraps any stream URL through the on-device HTTP proxy (StreamProxyPlugin)
 * so HLS plays in the WebView without CORS blocks and with proper
 * User-Agent/Referer headers (fixes telewebion 403 etc.).
 */
import { registerPlugin, Capacitor } from '@capacitor/core';

interface ProxyPlugin {
  getBaseUrl(): Promise<{ baseUrl: string }>;
}

const NiniStreamProxy = registerPlugin<ProxyPlugin>('NiniStreamProxy');

let baseUrl: string | null = null;
let initFailed = false;

async function ensureBase(): Promise<string | null> {
  if (baseUrl) return baseUrl;
  if (!Capacitor.isNativePlatform() || initFailed) return null;
  try {
    const r = await NiniStreamProxy.getBaseUrl();
    baseUrl = r.baseUrl;
    return baseUrl;
  } catch {
    initFailed = true;
    return null;
  }
}

function b64url(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Returns a proxied URL if native proxy is available, otherwise the original. */
export async function proxied(url: string): Promise<string> {
  const base = await ensureBase();
  if (!base) return url;
  return base + b64url(url);
}

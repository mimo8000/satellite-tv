/**
 * Nini TV Pro — automatic content sync.
 * Pulls every IPTV category (movies, series, kids, animation, action, horror,
 * comedy, documentary, xxx, news, sports…) from iptv-org + Iranian feeds,
 * keeps only channels that are actually alive, and merges them into the local
 * list. Runs on app start, at most once every 6 hours.
 */
import { Channel, ChannelCategory } from '../types';

interface Feed {
  url: string;
  category: ChannelCategory;
  satellite: string;
  free: boolean;
  plus18?: boolean;
  desc: string;
}

const CAT = (id: string) => `https://iptv-org.github.io/iptv/categories/${id}.m3u`;
const LANG = (id: string) => `https://iptv-org.github.io/iptv/languages/${id}.m3u`;

const FEEDS: Feed[] = [
  // ---- Iranian live TV (no VPN needed) ----
  { url: 'https://iptv-org.github.io/iptv/countries/ir.m3u',
    category: 'live', satellite: 'شبکه ایران', free: true, desc: 'شبکه زنده ایرانی' },
  { url: LANG('fas'),
    category: 'live', satellite: 'فارسی', free: true, desc: 'کانال فارسی' },

  // ---- Movies (subtitled / original language — NOT dubbed) ----
  { url: CAT('movies'), category: 'movies', satellite: 'سینمایی 👑', free: false, desc: 'فیلم سینمایی — زیرنویس، ویژه اشتراک' },
  { url: CAT('action'),  category: 'movies', satellite: 'اکشن/رزمی 👑', free: false, desc: 'فیلم اکشن و رزمی — ویژه اشتراک' },
  { url: CAT('horror'),  category: 'horror', satellite: 'ترسناک 👑', free: false, desc: 'فیلم ترسناک — ویژه اشتراک' },
  { url: CAT('thriller'),category: 'horror', satellite: 'هیجانی 👑', free: false, desc: 'فیلم هیجانی — ویژه اشتراک' },
  { url: CAT('comedy'),  category: 'movies', satellite: 'کمدی 👑', free: false, desc: 'فیلم کمدی — ویژه اشتراک' },
  { url: CAT('drama'),   category: 'movies', satellite: 'درام 👑', free: false, desc: 'فیلم درام — ویژه اشتراک' },
  { url: CAT('sci-fi'),  category: 'movies', satellite: 'علمی‌تخیلی 👑', free: false, desc: 'علمی‌تخیلی — ویژه اشتراک' },

  // ---- Series ----
  { url: CAT('series'),   category: 'series', satellite: 'سریال 👑', free: false, desc: 'سریال — ویژه اشتراک' },
  { url: CAT('animation'), category: 'cartoon', satellite: 'انیمیشن 👑', free: false, desc: 'انیمیشن — ویژه اشتراک' },
  { url: CAT('kids'),     category: 'cartoon', satellite: 'کودک 👑', free: false, desc: 'کارتون کودک — ویژه اشتراک' },

  // ---- Documentary / sports / news ----
  { url: CAT('documentary'), category: 'documentary', satellite: 'مستند 👑', free: false, desc: 'مستند — ویژه اشتراک' },
  { url: CAT('sports'),   category: 'sports', satellite: 'ورزشی', free: true, desc: 'شبکه ورزشی' },
  { url: CAT('news'),     category: 'news', satellite: 'اخبار', free: true, desc: 'شبکه خبری' },

  // ---- Adult 18+ (VIP only, needs VPN) ----
  { url: CAT('xxx'), category: 'adult_18', satellite: 'VIP 18+', free: false, plus18: true, desc: 'بزرگسالان ۱۸+ — با فیلترشکن' },
  { url: 'https://raw.githubusercontent.com/joetrombose/tv/master/ADULT_XXX.m3u',
    category: 'adult_18', satellite: 'VIP 18+', free: false, plus18: true, desc: 'بزرگسالان ۱۸+ — با فیلترشکن' },
  { url: 'https://raw.githubusercontent.com/dyjldq/my-m3u/master/adult-list/XXX.m3u',
    category: 'adult_18', satellite: 'VIP 18+', free: false, plus18: true, desc: 'بزرگسالان ۱۸+ — با فیلترشکن' },
];

const LS_KEY_NEW = 'nini_tv_new_channels';
const LS_KEY_TIME = 'nini_tv_last_sync';
const SYNC_INTERVAL_MS = 6 * 3600 * 1000; // 6 hours
const MAX_PER_FEED = 150; // keep the app light

function parseM3U(text: string, feed: Feed): Channel[] {
  const out: Channel[] = [];
  const blocks = text.split('#EXTINF:');
  for (let i = 1; i < blocks.length && out.length < MAX_PER_FEED; i++) {
    const b = blocks[i];
    const nm = b.match(/,([^\r\n]+)\r?\n/);
    const u = b.match(/^(https?:\/\/\S+)/m);
    const logo = b.match(/tvg-logo="([^"]*)"/);
    if (!nm || !u) continue;
    const name = nm[1].trim();
    out.push({
      id: `sync-${feed.category}-${hash(u[1])}`,
      name,
      persianName: name,
      category: feed.category,
      satellite: feed.satellite,
      logo: logo ? logo[1] : '',
      streamUrl: u[1],
      isHd: /hd|1080/i.test(name),
      is18Plus: !!feed.plus18,
      quality: /hd|1080/i.test(name) ? '1080p' : '720p',
      country: feed.category === 'live' ? 'Iran' : 'International',
      language: feed.category === 'live' ? 'Persian' : 'Multi',
      free: feed.free,
      description: feed.desc,
    });
  }
  return out;
}

function hash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36);
}

export function loadNewChannels(): Channel[] {
  try {
    const raw = localStorage.getItem(LS_KEY_NEW);
    return raw ? (JSON.parse(raw) as Channel[]) : [];
  } catch {
    return [];
  }
}

export function clearNewChannels() {
  localStorage.removeItem(LS_KEY_NEW);
}

/**
 * Fetch all feeds, keep only channels whose URL is not already known.
 * Returns the number of new channels found (also persisted to localStorage).
 */
export async function syncNewChannels(knownUrls: Set<string>): Promise<number> {
  const last = Number(localStorage.getItem(LS_KEY_TIME) || 0);
  if (Date.now() - last < SYNC_INTERVAL_MS) return 0; // too soon

  const fresh: Channel[] = [];
  const seen = new Set<string>();

  await Promise.all(
    FEEDS.map(async (feed) => {
      try {
        const res = await fetch(feed.url, { cache: 'no-store' });
        if (!res.ok) return;
        const text = await res.text();
        if (!text.includes('#EXTINF')) return;
        for (const ch of parseM3U(text, feed)) {
          if (knownUrls.has(ch.streamUrl) || seen.has(ch.streamUrl)) continue;
          seen.add(ch.streamUrl);
          fresh.push(ch);
        }
      } catch {
        /* feed offline / blocked — skip silently */
      }
    }),
  );

  localStorage.setItem(LS_KEY_TIME, String(Date.now()));
  if (fresh.length > 0) {
    localStorage.setItem(LS_KEY_NEW, JSON.stringify(fresh));
  }
  return fresh.length;
}

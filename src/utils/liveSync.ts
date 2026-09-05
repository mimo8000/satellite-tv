/**
 * Nini TV Pro — automatic content sync.
 * Fetches live IPTV playlists from public sources (CORS-open), parses them,
 * and merges any NEW channels into the local list. Runs on app start and
 * at most once every 12 hours.
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

const FEEDS: Feed[] = [
  {
    url: 'https://iptv-org.github.io/iptv/countries/ir.m3u',
    category: 'live', satellite: 'IPTV (بدون فیلترشکن)', free: true,
    desc: 'شبکه زنده ایرانی',
  },
  {
    url: 'https://iptv-org.github.io/iptv/categories/movies.m3u',
    category: 'movies', satellite: 'IPTV Pro', free: false,
    desc: 'فیلم سینمایی — ویژه VIP',
  },
  {
    url: 'https://iptv-org.github.io/iptv/categories/series.m3u',
    category: 'series', satellite: 'IPTV Pro', free: false,
    desc: 'سریال — ویژه VIP',
  },
  {
    url: 'https://iptv-org.github.io/iptv/categories/kids.m3u',
    category: 'cartoon', satellite: 'IPTV Kids', free: false,
    desc: 'کارتون — ویژه VIP',
  },
  {
    url: 'https://iptv-org.github.io/iptv/categories/animation.m3u',
    category: 'cartoon', satellite: 'IPTV Kids', free: false,
    desc: 'انیمیشن — ویژه VIP',
  },
  {
    url: 'https://raw.githubusercontent.com/joetrombose/tv/master/ADULT_XXX.m3u',
    category: 'adult_18', satellite: 'VIP 18+', free: false, plus18: true,
    desc: 'بزرگسالان ۱۸+ — با فیلترشکن',
  },
  {
    url: 'https://raw.githubusercontent.com/dyjldq/my-m3u/master/adult-list/XXX.m3u',
    category: 'adult_18', satellite: 'VIP 18+', free: false, plus18: true,
    desc: 'بزرگسالان ۱۸+ — با فیلترشکن',
  },
  {
    url: 'https://raw.githubusercontent.com/igorpetrenko3690/IGOR_IPTV/master/categories/xxx.m3u',
    category: 'adult_18', satellite: 'VIP 18+', free: false, plus18: true,
    desc: 'بزرگسالان ۱۸+ — با فیلترشکن',
  },
];

const LS_KEY_NEW = 'nini_tv_new_channels';
const LS_KEY_TIME = 'nini_tv_last_sync';
const SYNC_INTERVAL_MS = 12 * 3600 * 1000; // 12 hours
const MAX_PER_FEED = 120; // keep the app light

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

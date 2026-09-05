export type ThemeColor = 'green' | 'pink' | 'black' | 'yellow';

export type ChannelCategory = 
  | 'all'
  | 'live'
  | 'adult_18'
  | 'movies'
  | 'series'
  | 'cartoon'
  | 'kids'
  | 'sports'
  | 'music'
  | 'news'
  | 'entertainment'
  | 'documentary';

export interface Channel {
  id: string;
  name: string;
  persianName: string;
  category: ChannelCategory;
  satellite: string; // e.g. "Yahsat", "Hotbird", "Eutelsat"
  frequency?: string;
  logo: string;
  streamUrl: string;
  backupStreamUrl?: string;
  isHd?: boolean;
  is18Plus?: boolean;
  free?: boolean; // true = watchable without subscription code
  quality: '1080p' | '720p' | '480p' | '4K';
  country: string;
  language: string;
  description?: string;
}

export interface SatelliteFrequency {
  id: string;
  satelliteName: string;
  persianName: string;
  orbitalPosition: string; // e.g., "52.5°E"
  frequency: string;       // e.g., "11900"
  polarization: 'H' | 'V'; // Horizontal or Vertical
  symbolRate: string;      // e.g., "27500"
  fec: string;             // e.g., "3/4", "5/6"
  standard: 'DVB-S' | 'DVB-S2';
  beam: string;            // e.g., "MENA", "Wide", "Europe"
  channels: string[];
}

export interface DishAlignment {
  satelliteName: string;
  azimuth: number; // degrees
  elevation: number; // degrees
  lnbSkew: number; // degrees
  coverage: string;
}

export type ActiveTab = 'player' | 'movies' | 'series' | 'cartoon' | 'adult' | 'live' | 'settings';

export type NiniTier = 'standard' | 'vip_premium' | 'admin_unlimited';

export interface NiniSession {
  code: string;
  tier: NiniTier;
  isVip: boolean;
  isAdmin: boolean;
  activatedAt: number;
}

import { ThemeColor } from './types';

export interface ThemeConfig {
  id: ThemeColor;
  name: string;
  persianName: string;
  colorCode: string;
  // Fullscreen container classes
  bgGradient: string;
  // Card / surface background
  cardBg: string;
  cardBorder: string;
  cardHover: string;
  // Primary action button / active pills
  primaryBtn: string;
  primaryBtnText: string;
  accentText: string;
  accentBorder: string;
  badgeBg: string;
  glowEffect: string;
  // Bottom nav
  navBg: string;
  navActive: string;
  // Video player HUD
  playerHudBg: string;
  playerBar: string;
}

export const THEMES: Record<ThemeColor, ThemeConfig> = {
  green: {
    id: 'green',
    name: 'Cyber Emerald',
    persianName: 'سبز زمردی (Green)',
    colorCode: '#10b981',
    bgGradient: 'bg-gradient-to-b from-[#022011] via-[#05331c] to-[#01140a] text-emerald-50',
    cardBg: 'bg-[#063b22]/70 backdrop-blur-md',
    cardBorder: 'border-emerald-500/30',
    cardHover: 'hover:border-emerald-400 hover:bg-[#084b2b]',
    primaryBtn: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25',
    primaryBtnText: 'text-slate-950',
    accentText: 'text-emerald-400',
    accentBorder: 'border-emerald-500',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    glowEffect: 'shadow-[0_0_25px_rgba(16,185,129,0.3)]',
    navBg: 'bg-[#021d10]/90 border-emerald-800/50',
    navActive: 'bg-emerald-500 text-slate-950 font-bold',
    playerHudBg: 'bg-emerald-950/80 border-emerald-600/40',
    playerBar: 'bg-emerald-500',
  },
  pink: {
    id: 'pink',
    name: 'Neon Fuchsia',
    persianName: 'صورتی نئونی (Pink)',
    colorCode: '#ec4899',
    bgGradient: 'bg-gradient-to-b from-[#25041b] via-[#38092a] to-[#170211] text-pink-50',
    cardBg: 'bg-[#400e31]/70 backdrop-blur-md',
    cardBorder: 'border-pink-500/30',
    cardHover: 'hover:border-pink-400 hover:bg-[#52123f]',
    primaryBtn: 'bg-pink-500 hover:bg-pink-400 text-white shadow-lg shadow-pink-500/25',
    primaryBtnText: 'text-white',
    accentText: 'text-pink-400',
    accentBorder: 'border-pink-500',
    badgeBg: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
    glowEffect: 'shadow-[0_0_25px_rgba(236,72,153,0.3)]',
    navBg: 'bg-[#200318]/90 border-pink-800/50',
    navActive: 'bg-pink-500 text-white font-bold',
    playerHudBg: 'bg-pink-950/80 border-pink-600/40',
    playerBar: 'bg-pink-500',
  },
  black: {
    id: 'black',
    name: 'AMOLED Stealth',
    persianName: 'مشکی خالص (Black)',
    colorCode: '#18181b',
    bgGradient: 'bg-gradient-to-b from-[#09090b] via-[#0f0f12] to-[#000000] text-zinc-100',
    cardBg: 'bg-zinc-900/80 backdrop-blur-md',
    cardBorder: 'border-zinc-800',
    cardHover: 'hover:border-zinc-600 hover:bg-zinc-800/90',
    primaryBtn: 'bg-zinc-100 hover:bg-white text-zinc-950 shadow-lg shadow-white/10',
    primaryBtnText: 'text-zinc-950',
    accentText: 'text-cyan-400',
    accentBorder: 'border-zinc-700',
    badgeBg: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    glowEffect: 'shadow-[0_0_25px_rgba(255,255,255,0.08)]',
    navBg: 'bg-zinc-950/90 border-zinc-800',
    navActive: 'bg-zinc-100 text-zinc-950 font-bold',
    playerHudBg: 'bg-zinc-900/90 border-zinc-700',
    playerBar: 'bg-cyan-400',
  },
  yellow: {
    id: 'yellow',
    name: 'Cyberpunk Gold',
    persianName: 'زرد الکتریک (Yellow)',
    colorCode: '#eab308',
    bgGradient: 'bg-gradient-to-b from-[#261902] via-[#3a2704] to-[#150d01] text-amber-50',
    cardBg: 'bg-[#432d06]/70 backdrop-blur-md',
    cardBorder: 'border-amber-500/30',
    cardHover: 'hover:border-amber-400 hover:bg-[#573b09]',
    primaryBtn: 'bg-yellow-400 hover:bg-yellow-300 text-slate-950 shadow-lg shadow-yellow-400/25',
    primaryBtnText: 'text-slate-950',
    accentText: 'text-yellow-400',
    accentBorder: 'border-yellow-400',
    badgeBg: 'bg-yellow-400/20 text-yellow-300 border-yellow-400/40',
    glowEffect: 'shadow-[0_0_25px_rgba(234,179,8,0.3)]',
    navBg: 'bg-[#1e1301]/90 border-amber-800/50',
    navActive: 'bg-yellow-400 text-slate-950 font-bold',
    playerHudBg: 'bg-amber-950/80 border-amber-600/40',
    playerBar: 'bg-yellow-400',
  },
};

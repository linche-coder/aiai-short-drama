import { genres, groups } from '../data/dramas';
import type { Genre } from '../data/dramas';
export interface HomeState { query: string; genre: Genre; index: number; paused: boolean; scroll: number }
const defaults: HomeState = { query: '', genre: '全部', index: 0, paused: false, scroll: 0 };
export function readHomeState(): HomeState {
  try {
    const value = JSON.parse(sessionStorage.getItem('aiai:home') || '{}');
    return { query: typeof value.query === 'string' ? value.query : '', genre: genres.includes(value.genre) ? value.genre : '全部', index: Number.isInteger(value.index) ? ((value.index % groups.featured.length) + groups.featured.length) % groups.featured.length : 0, paused: value.paused === true, scroll: Number.isFinite(value.scroll) ? Math.max(0,value.scroll) : 0 };
  } catch { return defaults; }
}
export function saveHomeState(value: Partial<HomeState>) { try { sessionStorage.setItem('aiai:home', JSON.stringify({ ...readHomeState(), ...value })); } catch { /* Browsing still works without session storage. */ } }

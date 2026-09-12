import { ArrowUpRight } from 'lucide-react';
import type { Drama } from '../data/dramas';
/** Noninteractive content inside the card's single link. */
export function CardInfo({ drama, banner = false }: { drama: Drama; banner?: boolean }) {
  return <div className={`card-info ${banner ? 'banner-info' : 'catalog-info'}`} aria-hidden="true">
    {banner && <h2>{drama.title}</h2>}
    <span className="info-genre">{drama.genre}</span>
    {banner && <p>{drama.tagline}</p>}
    <span className="watch-cue">立即观看<ArrowUpRight size={18} /></span>
  </div>;
}

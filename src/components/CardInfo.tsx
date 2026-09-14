import{ArrowUpRight}from'lucide-react';
import type{Content}from'../types/content';

import{contentLabel}from'../data/contentLabels';
export function CardInfo({drama,banner=false}:{drama:Content;banner?:boolean}){return <div className={`card-info ${banner?'banner-info':'catalog-info'}`} aria-hidden="true">{banner&&<h2>{drama.title}</h2>}<span className="info-genre">{drama.genre}</span>{banner&&drama.tagline&&<p>{drama.tagline}</p>}<span className="watch-cue">{contentLabel(drama)}<ArrowUpRight size={18}/></span></div>;}

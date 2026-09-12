import { ArrowUpRight, Flame, Sparkles, Search } from 'lucide-react';
import type { Drama } from '../data/dramas';
import { Poster } from './Poster';
import { CardInfo } from './CardInfo';
import { Link, dramaHref } from '../navigation/Router';
export function DramaGrid({ id, title, subtitle, items, latest = false, results = false, onReset }: { id: string; title: string; subtitle: string; items: Drama[]; latest?: boolean; results?: boolean; onReset?: () => void }) {
  return <section id={id} className="drama-section" aria-labelledby={`${id}-heading`}><div className="section-heading"><div><h2 id={`${id}-heading`}>{results ? <Search size={21} /> : latest ? <Sparkles size={21} /> : <Flame size={21} />}{title}</h2><p>{subtitle}</p></div><div className="section-meta"><span className="section-count">{String(items.length).padStart(2, '0')} 部短剧</span>{onReset && <button className="text-button" onClick={onReset}>重置筛选</button>}</div></div>
    <div className="drama-grid">{items.map(drama => <Link className="drama-card drama-link" href={dramaHref(drama.id)} key={drama.id} data-drama-id={drama.id} data-instance={`list-${drama.id}`} style={{ viewTransitionName: `list-${drama.id}` }} aria-label={`立即观看：${drama.title}，${drama.genre}`}><div className="card-poster"><Poster drama={drama} small /><CardInfo drama={drama} /></div><div className="card-title"><h3>{drama.title}</h3><ArrowUpRight size={16} /></div><p>{drama.genre}<span>·</span>{latest ? '新片发现' : '精选故事'}</p></Link>)}</div>
  </section>;
}

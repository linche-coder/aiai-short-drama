import { useLayoutEffect, useRef } from 'react';
import { genres } from '../data/dramas';
import type { Genre } from '../data/dramas';
export function Filters({ selected, onSelect }: { selected: Genre; onSelect: (genre: Genre) => void }) {
  const tabs = useRef<HTMLDivElement>(null);
  const highlight = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const measure = () => {
      const button = tabs.current?.querySelector<HTMLElement>('[aria-pressed="true"]');
      if (!button || !highlight.current) return;
      Object.assign(highlight.current.style, { width: `${button.offsetWidth}px`, height: `${button.offsetHeight}px`, transform: `translate(${button.offsetLeft}px, ${button.offsetTop}px)` });
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (tabs.current) observer.observe(tabs.current);
    return () => observer.disconnect();
  }, [selected]);
  return <div className="home-genre-filter" id="browse" tabIndex={-1}><div ref={tabs} className="genre-filters" role="group" aria-label="题材筛选"><span ref={highlight} className="genre-highlight" aria-hidden="true" />{genres.map(genre => <button key={genre} className={selected === genre ? 'active' : ''} onClick={() => onSelect(genre)} aria-pressed={selected === genre}>{genre}</button>)}</div></div>;
}

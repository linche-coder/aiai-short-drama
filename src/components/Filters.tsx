import { useLayoutEffect, useRef } from 'react';
import { genres } from '../data/dramas';
import type { Genre } from '../data/dramas';
export function FilterOptions({selected,onSelect,options,label}:{selected:string;onSelect:(value:string)=>void;options:{value:string;label:string}[];label:string}) {
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
  }, [selected,options.map(o=>o.value).join("|")]);
  return <div ref={tabs} className="genre-filters" role="group" aria-label={label}><span ref={highlight} className="genre-highlight" aria-hidden="true" />{options.map(option => <button key={option.value} className={selected === option.value ? 'active' : ''} onClick={() => onSelect(option.value)} aria-pressed={selected === option.value}>{option.label}</button>)}</div>;
}

export function Filters({selected,onSelect}:{selected:Genre;onSelect:(genre:Genre)=>void}){return <div className="home-genre-filter" id="browse" tabIndex={-1}><FilterOptions selected={selected} onSelect={onSelect} options={genres.map(value=>({value,label:value}))} label="题材筛选"/></div>;}

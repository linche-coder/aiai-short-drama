import { useCallback, useEffect, useRef, useState } from 'react';
import { SearchX, RotateCcw } from 'lucide-react';
import { Header } from './components/Header';
import { Intro } from './components/Intro';
import { Carousel } from './components/Carousel';
import { AdSlot } from './components/AdSlot';
import { Filters } from './components/Filters';
import { DramaGrid } from './components/DramaGrid';
import { Footer } from './components/Footer';
import { ads, timing } from './config';
import { dramas, groups, filterDramas } from './data/dramas';
import type { Genre } from './data/dramas';
import { useReducedMotion } from './hooks/useReducedMotion';
import { cancelResultsTransition, transitionResults } from './motion/transitions';
import { readHomeState, saveHomeState } from './navigation/homeState';

function firstVisit() { try { return sessionStorage.getItem('aiai:intro-seen') !== 'yes'; } catch { return true; } }
export function HomePage({ onAccount, onMembership, blocked }: { onAccount:()=>void; onMembership:()=>void; blocked:boolean }) {
  const [saved] = useState(readHomeState);
  const [query, setQuery] = useState(saved.query);
  const [criteria, setCriteria] = useState<{ query: string; genre: Genre }>({ query: saved.query, genre: saved.genre });
  const [selected, setSelected] = useState<Genre>(saved.genre);
  const selectedRef = useRef<Genre>(saved.genre);
  const queryRef = useRef(saved.query);
  const searchTimer = useRef<number | undefined>(undefined);
  const [entering, setEntering] = useState(firstVisit);
  const [fullIntro, setFullIntro] = useState(firstVisit);
  const [introKey, setIntroKey] = useState(0);
  const logoRef = useRef<HTMLImageElement>(null);
  const reduced = useReducedMotion();
  const finishIntro = useCallback(() => { setEntering(false); try { sessionStorage.setItem('aiai:intro-seen', 'yes'); } catch { /* Storage is optional. */ } }, []);
  useEffect(() => {
    document.title='爱爱短剧 · 发现你的下一部好故事';
    const scroll=()=>saveHomeState({scroll:scrollY});
    window.addEventListener('scroll',scroll,{passive:true});
    return()=>{clearTimeout(searchTimer.current);cancelResultsTransition();window.removeEventListener('scroll',scroll);saveHomeState({query:queryRef.current,genre:selectedRef.current});};
  }, []);
  const commit = (value: string, genre: Genre) => transitionResults(() => setCriteria({ query: value, genre }), reduced);
  const search = (value: string) => {
    setQuery(value); queryRef.current = value; saveHomeState({query:value}); clearTimeout(searchTimer.current);
    if (!value.trim()) commit('', selectedRef.current);
    else searchTimer.current = window.setTimeout(() => commit(value, selectedRef.current), timing.searchDebounce);
  };
  const selectGenre = (genre: Genre) => { clearTimeout(searchTimer.current); selectedRef.current = genre; saveHomeState({genre}); setSelected(genre); commit(queryRef.current, genre); };
  const reset = () => { clearTimeout(searchTimer.current); queryRef.current = ''; selectedRef.current = '全部'; saveHomeState({query:'',genre:'全部'}); setQuery(''); setSelected('全部'); commit('', '全部'); };
  const active = !!criteria.query.trim() || criteria.genre !== '全部';
  const results = filterDramas(dramas, criteria.query, criteria.genre);
  const replay = () => { window.scrollTo({ top: 0, behavior: 'instant' }); setFullIntro(true); setIntroKey(k => k + 1); setEntering(true); };
  return <><div id="home" className={`app ${entering && fullIntro && !reduced ? 'is-entering' : ''}`} inert={entering}>
    <a href="#browse" className="skip-link">跳到短剧内容</a>
    <Header logoRef={logoRef} query={query} onSearch={search} onAccount={onAccount} onMembership={onMembership} />
    <main><Carousel initialIndex={saved.index} initialPaused={saved.paused} reduced={reduced} blocked={entering || blocked} /><div className="container content"><AdSlot config={ads[0]} /><Filters selected={selected} onSelect={selectGenre} count={results.length} active={active} onReset={reset} />
      <div className="results-wrapper">
        {active ? <><span id="popular" className="section-anchor" /><span id="latest" className="section-anchor" />{results.length ? <DramaGrid id="results" title={criteria.query.trim() ? '搜索结果' : `${criteria.genre}短剧`} subtitle={criteria.query.trim() ? `与「${criteria.query.trim()}」有关的故事` : '循着心动，发现更多好故事'} items={results} results onReset={reset} /> : <section className="empty-state" role="status"><SearchX size={38} /><h2>还没找到这部故事</h2><p>试试其他剧名关键词，或换个题材继续探索。</p><button className="primary-button" onClick={reset}>重置筛选</button></section>}</> : <><DramaGrid id="popular" title="热门推荐" subtitle="精选好故事，下一部心动就在这里" items={groups.popular} /><AdSlot config={ads[1]} /><DramaGrid id="latest" title="最新上线" subtitle="发现新故事，让期待继续" items={groups.latest} latest /></>}
      </div>
    </div></main><Footer />
    {import.meta.env.DEV && <button className="intro-replay" onClick={replay} aria-label="重放品牌开屏"><RotateCcw size={14} /><span>重放开屏</span><small>DEV</small></button>}
    </div>
    {entering && <Intro key={introKey} logoRef={logoRef} full={fullIntro} reduced={reduced} onDone={finishIntro} />}
  </>;
}

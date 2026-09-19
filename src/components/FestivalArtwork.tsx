import {Gift,ArrowUpRight} from 'lucide-react';
import {Link} from '../navigation/Router';
export const festivalAssets={desktop:'/assets/festival/aiai-festival-v4-background-desktop.png',mobile:'/assets/festival/aiai-festival-v4-background-mobile.png',title:'/assets/festival/aiai-festival-v4-title-transparent.png'};
export function FestivalArtwork({compact=false,portrait=false,immersive=false}:{compact?:boolean;portrait?:boolean;immersive?:boolean}){
 return <div className={`festival-artwork${compact?' festival-artwork--compact':''}`}>
  <picture className="festival-background">{!portrait&&<source media={immersive?'(max-width: 900px)':'(max-width: 700px)'} srcSet={festivalAssets.mobile}/>}<img src={portrait?festivalAssets.mobile:festivalAssets.desktop} alt=""/></picture>
  <img className="festival-title-art" src={festivalAssets.title} width="1536" height="1024" alt="月满中秋，礼遇国庆，最高领120积分"/>
  <span className="festival-moonlight" aria-hidden="true"/><span className="festival-spark festival-spark--one" aria-hidden="true"/><span className="festival-spark festival-spark--two" aria-hidden="true"/>
 </div>;
}
export function FestivalStrip(){return <Link className="festival-strip" href="/festival"><span className="festival-strip-icon"><Gift/></span><span><strong>双节福利 · 好故事，共团圆</strong><small>参与领20积分，邀好友再领100积分</small></span><span className="festival-strip-action">去领取 <ArrowUpRight size={18}/></span></Link>;}

import {ArrowRight} from 'lucide-react';
import {Link} from '../navigation/Router';
import {festivalAccessibleLabel,festivalConfig,taskMaximum} from '../services/festivalModel';
import {useFestivalPhase} from '../hooks/useFestivalPhase';
export const festivalAssets={desktop:'/assets/festival/aiai-festival-v4-background-desktop.png',mobile:'/assets/festival/aiai-festival-v4-background-mobile.png',gift:'/assets/festival/moon-gift.png',title:'/assets/festival/aiai-festival-title-350-transparent.png',completeTitle:'/assets/festival/aiai-festival-kv-complete-v6.png'};
export function FestivalArtwork({compact=false,portrait=false,immersive=false}:{compact?:boolean;portrait?:boolean;immersive?:boolean}){
 return <div className={`festival-artwork${compact?' festival-artwork--compact':''}`}>
  <picture className="festival-background">{!portrait&&<source media={immersive?'(max-width: 900px)':'(max-width: 700px)'} srcSet={festivalAssets.mobile}/>}<img src={portrait?festivalAssets.mobile:festivalAssets.desktop} alt=""/></picture>
  <img className="festival-title-art" src={immersive?festivalAssets.completeTitle:festivalAssets.title} width="1536" height="1024" alt={immersive?`月满中秋，礼遇国庆，任务最高领${taskMaximum}积分；开通畅看会员，限时加赠畅看天数`:`月满中秋，礼遇国庆，任务最高领${taskMaximum}积分`}/>
  <span className="festival-moonlight" aria-hidden="true"/><span className="festival-spark festival-spark--one" aria-hidden="true"/><span className="festival-spark festival-spark--two" aria-hidden="true"/>
 </div>;
}
export function FestivalStrip(){
 const phase=useFestivalPhase();
 return <Link className="festival-strip" href={festivalConfig.path} aria-label={festivalAccessibleLabel}>
  <span className="festival-strip-scene" aria-hidden="true"><img src="/assets/festival/home-festival-panorama-200.png" alt=""/></span>
  <img className="festival-strip-title" src={festivalAssets.title} width="1536" height="1024" alt="月满中秋，礼遇国庆，最高领350积分"/>
  <span className="festival-strip-action">{phase==='ended'?'查看活动':phase==='upcoming'?'活动预告':'立即领取'}<ArrowRight size={18}/></span>
 </Link>;
}

import {ArrowRight} from 'lucide-react';
import {Link} from '../navigation/Router';
import {festivalAccessibleLabel,festivalConfig,taskMaximum} from '../services/festivalModel';
import {useFestivalPhase} from '../hooks/useFestivalPhase';
export const festivalAssets={desktop:'/assets/festival/national-day-background-desktop.png',mobile:'/assets/festival/national-day-background-mobile.png',gift:'/assets/festival/national-day-gift.png',title:'/assets/festival/national-day-title.png'};
export function FestivalArtwork({compact=false,portrait=false,immersive=false}:{compact?:boolean;portrait?:boolean;immersive?:boolean}){
 return <div className={`festival-artwork${compact?' festival-artwork--compact':''}`}>
  <picture className="festival-background">{!portrait&&<source media={immersive?'(max-width: 900px)':'(max-width: 700px)'} srcSet={festivalAssets.mobile}/>}<img src={portrait?festivalAssets.mobile:festivalAssets.desktop} alt=""/></picture>
  <img className="festival-title-art" src={festivalAssets.title} alt={`盛世华诞，举国同庆；国庆专属福利，任务最高领${taskMaximum}积分；开通畅看会员，限时加赠畅看天数`}/>
  <span className="festival-gold-haze" aria-hidden="true"/><span className="festival-spark festival-spark--one" aria-hidden="true"/><span className="festival-spark festival-spark--two" aria-hidden="true"/>
 </div>;
}
export function FestivalStrip(){
 const phase=useFestivalPhase();
 return <Link className="festival-strip" href={festivalConfig.path} aria-label={festivalAccessibleLabel}>
  <FestivalArtwork compact/>
  <span className="festival-strip-action">{phase==='ended'?'查看活动':phase==='upcoming'?'活动预告':'立即领取'}<ArrowRight size={18}/></span>
 </Link>;
}

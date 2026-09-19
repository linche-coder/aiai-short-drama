import {Header} from '../components/Header';
import {createContext,useContext,useState, type ReactNode} from 'react';
import {Heart} from 'lucide-react';
import {Link, useRouter} from '../navigation/Router';
import {DialogShell} from '../components/DialogShell';
import {records, useRecords} from '../state/records';
import {accessService} from '../services/access';

const AdultSearchContext=createContext<{query:string;setQuery:(value:string)=>void;committed:string;setCommitted:(value:string)=>void}>(null!);
export const useAdultSearch=()=>useContext(AdultSearchContext);
export const adultTabs = [['home','首页'],['shorts','成人短剧'],['comics','成人漫剧'],['original','原创'],['latest','最新'],['popular','热门']] as const;
export function AdultLayout({children, qualified=false}:{children:ReactNode;qualified?:boolean}) {
 const {route,navigate}=useRouter(),state=useRecords();
 const [dialog,setDialog]=useState<'privacy'|'clear'|'member'|'account'|null>(null),[message,setMessage]=useState('');
 const [query,setQuery]=useState(''),[committed,setCommitted]=useState('');
 const tab=route.params.get('tab')||'home';
 return <AdultSearchContext.Provider value={{query,setQuery,committed,setCommitted}}><Header brandBadge={<span className="brand-zone-mark" aria-label="18+专区"><b>18<sup>+</sup></b><i>专区</i></span>} query={query} onSearch={setQuery} onSubmitSearch={()=>{setCommitted(query.trim());navigate('/18plus/search');}} onAccount={()=>setDialog('account')} navigation={adultTabs.map(([id,label])=>[`/18plus?tab=${id}`,label] as const)} isActive={href=>route.path==='/18plus'&&new URL(href,location.origin).searchParams.get('tab')===tab} extraActions={<Link className="account-button" href="/18plus/wishlist" aria-label="愿望榜"><Heart size={18}/><span>愿望榜</span></Link>}/><div className="adult-shell" data-dialog-open={!!dialog}>
  {children}
  <footer className="container adult-footer"><span>爱爱短剧 <i>·</i> 故事留在这里</span><span>私密收藏 · 自主选择 · 随时离开</span>{qualified&&<button onClick={()=>{accessService.revoke();navigate('/#home');}}>退出18+专区</button>}</footer>
  {dialog&&<DialogShell title={dialog==='member'?'一份会员，包含更多故事':dialog==='account'?'账号服务暂未开放':dialog==='clear'?'清除成人观看历史？':'你的私密空间'} onClose={()=>setDialog(null)}>
   {dialog==='member'?<><p>尊享会员包含悦享会员权益。专区沿用同一会员体系，无需重复购买。访问专区仍需单独完成主动进入确认。</p><p>会员、订单和支付服务尚未开放。</p><Link className="primary-button" href="/membership?context=adult">查看会员方案</Link></>:dialog==='account'?<p>当前未登录。账号服务接入后开放登录；本次愿望榜仅保存在当前页面会话中。</p>:dialog==='clear'?<><p>仅清除当前浏览器打开页面的本地成人观看历史，愿望榜保留。不涉及账号或服务器数据。</p><button className="primary-button" onClick={()=>{records.clearAdultHistory();setMessage('已清除本地观看历史。');setDialog('privacy');}}>确认清除历史</button></>:<>
    <label className="adult-setting"><span>隐藏成人观看历史<small>隐藏只影响展示，不会删除记录</small></span><input type="checkbox" checked={state.privacy.hideAdult} onChange={e=>records.setPrivacy({hideAdult:e.target.checked})}/></label>
    <label className="adult-setting"><span>通知脱敏<small>通知服务尚未接入，不会发送消息</small></span><input type="checkbox" checked={state.privacy.neutralNotifications} onChange={e=>records.setPrivacy({neutralNotifications:e.target.checked})}/></label>
    <button className="secondary-button" onClick={()=>setDialog('clear')}>清除成人观看历史</button><p role="status">{message}</p>
    <button className="text-button" onClick={()=>{accessService.revoke();navigate('/#home');}}>退出18+专区并撤销本次资格</button>
   </>}
  </DialogShell>}
 </div></AdultSearchContext.Provider>;
}

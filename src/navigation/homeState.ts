export interface HomeState {query:string;genre:string;index:number;selectedId:string|null;paused:boolean;scroll:number;hash:string}
const defaults:HomeState={query:'',genre:'全部',index:0,selectedId:null,paused:false,scroll:0,hash:'#home'};
const safePage=(page:string)=>['/','/shorts','/comics','/free','/rankings','/search','/collections','/me'].includes(page);
export function readHomeState(page='/'):HomeState {
 if(!safePage(page))return {...defaults};
 try{const raw=sessionStorage.getItem(`aiai:browse:v2:${page}`);if(!raw){const old=JSON.parse(sessionStorage.getItem('aiai:home')||'{}');return {...defaults,paused:old.paused===true};}const value=JSON.parse(raw);return{query:typeof value.query==='string'?value.query:'',genre:typeof value.genre==='string'?value.genre:'全部',index:Number.isInteger(value.index)&&value.index>=0?value.index:0,selectedId:typeof value.selectedId==='string'?value.selectedId:null,paused:value.paused===true,scroll:Number.isFinite(value.scroll)?Math.max(0,value.scroll):0,hash:['#home','#popular','#latest','#results'].includes(value.hash)?value.hash:'#home'};}catch{return {...defaults};}
}
export function saveHomeState(value:Partial<HomeState>,page='/'){if(!safePage(page))return;try{sessionStorage.setItem(`aiai:browse:v2:${page}`,JSON.stringify({...readHomeState(page),...value}));}catch{/* optional UI snapshot, never access authority */}}

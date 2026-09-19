import type {FestivalConfig} from './src/services/festivalModel';
import {previewFestivalConfig} from './server/previewFestival';
import {createPreviewPoints} from './server/previewPoints';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import{rmSync}from'node:fs';import{resolve,sep}from'node:path';
const stripDemoMedia={name:'strip-demo-media',closeBundle(){const dist=resolve(import.meta.dirname,'dist'),target=resolve(dist,'media','demo');if(!target.startsWith(dist+sep))throw new Error('Refusing to remove demo media outside dist');rmSync(target,{recursive:true,force:true});}};

type PreviewAccount={account:string;password?:string;nickname:string;tier:'free'|'basic'|'premium';membership:{level:number;growth:number;nextLevelGrowth:number;expiresAt:string}|null};
export function previewAuth(accounts:PreviewAccount[],pointsFile=resolve(import.meta.dirname,'.local/preview-points.json'),festivalConfig:FestivalConfig=previewFestivalConfig):Plugin{
 const points=createPreviewPoints(pointsFile,festivalConfig);
 const sessions=new Map<string,{account:PreviewAccount;expiresAt:string}>(),cookieName='aiai_preview_session';
 const json=(response:import('node:http').ServerResponse,status:number,value:unknown,headers:Record<string,string>={})=>{response.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers});response.end(JSON.stringify(value));};
 const body=(request:import('node:http').IncomingMessage)=>new Promise<Record<string,unknown>>((resolveBody,reject)=>{let raw='';request.on('data',chunk=>{raw+=String(chunk);if(raw.length>8192)reject(new Error('request_too_large'));});request.on('end',()=>{try{resolveBody(JSON.parse(raw||'{}') as Record<string,unknown>);}catch{reject(new Error('invalid_json'));}});request.on('error',reject);});
 const token=(request:import('node:http').IncomingMessage)=>request.headers.cookie?.split(';').map(value=>value.trim()).find(value=>value.startsWith(`${cookieName}=`))?.slice(cookieName.length+1);
 const dto=(account:PreviewAccount,expiresAt:string)=>({subject:account.account,nickname:account.nickname,tier:points.tierFor(account.account,account.tier),roles:[],expiresAt,membership:points.member(account.account)?{...account.membership,expiresAt:points.member(account.account)!.expiresAt}:account.membership});
 return{name:'preview-auth',apply:'serve',configureServer(server){server.middlewares.use((request,response,next)=>{void(async()=>{
   const path=new URL(request.url||'/',`http://${request.headers.host||'localhost'}`).pathname;if(!path.startsWith('/api/v1/')){next();return;}
   const referralCookie=request.headers.cookie?.split(';').map(v=>v.trim()).find(v=>v.startsWith('aiai_festival_ref='))?.slice('aiai_festival_ref='.length);
   if(request.method==='POST'&&request.headers.origin&&request.headers.origin!=='http://'+request.headers.host){json(response,403,{code:'access_denied'});return;}
   if(path==='/api/v1/festival/referral'&&request.method==='POST'){
    const input=await body(request);try{const ref=points.referral(input.code,referralCookie);json(response,200,{bound:true},{'Set-Cookie':`aiai_festival_ref=${ref}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000`});}catch{json(response,400,{code:'invalid_invitation'});}return;
   }
   if(path==='/api/v1/auth/register'&&request.method==='POST'){
    const input=await body(request);try{const account=points.register(input,accounts.map(a=>a.account),referralCookie),key=crypto.randomUUID(),expiresAt=new Date(Date.now()+8*60*60*1000).toISOString();sessions.set(key,{account,expiresAt});json(response,200,dto(account,expiresAt),{'Set-Cookie':`${cookieName}=${key}; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800`});}catch(error){const code=error instanceof Error?error.message:'service_unavailable';json(response,code==='account_exists'?409:400,{code});}return;
   }
   if(path==='/api/v1/festival'||path==='/api/v1/festival/claim'){
    const claim=path.endsWith('/claim');if(request.method!==(claim?'POST':'GET')){json(response,405,{code:'method_not_allowed'});return;}
    const key=token(request),session=sessions.get(key||''),valid=session&&Date.parse(session.expiresAt)>Date.now();
    if((claim||key)&&!valid){json(response,401,{code:'session_expired'});return;}
    try{json(response,200,points.festival(valid?session.account.account:null,valid?session.account.tier:'free',claim));}catch(error){json(response,409,{code:error instanceof Error?error.message:'service_unavailable'});}return;
   }
   if(path==='/api/v1/session'&&request.method==='GET'){const key=token(request),session=key?sessions.get(key):undefined;if(!session||Date.parse(session.expiresAt)<=Date.now()){if(key)sessions.delete(key);json(response,200,{subject:null,tier:'free',roles:[],expiresAt:null},key?{'Set-Cookie':`${cookieName}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`}:{});return;}json(response,200,dto(session.account,session.expiresAt));return;}
   if(path==='/api/v1/auth/sign-in'&&request.method==='POST'){const input=await body(request),account=accounts.find(item=>item.account===input.account&&item.password===input.password)||points.authenticate(String(input.account||''),input.password);if(!account){json(response,401,{code:'invalid_credentials'});return;}const key=crypto.randomUUID(),expiresAt=new Date(Date.now()+8*60*60*1000).toISOString();sessions.set(key,{account,expiresAt});json(response,200,dto(account,expiresAt),{'Set-Cookie':`${cookieName}=${key}; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800`});return;}
   if(path==='/api/v1/session'&&request.method==='DELETE'){const key=token(request);if(key)sessions.delete(key);response.writeHead(204,{'Cache-Control':'no-store','Set-Cookie':`${cookieName}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`});response.end();return;}
   if(/^\/api\/v1\/(?:me\/(?:points(?:\/(?:summary|transactions|check-in|demo-purchase))?|unlocks)|contents\/[^/]+\/episodes\/[^/]+\/unlock)$/.test(path)){
    const session=sessions.get(token(request)||'');if(!session||Date.parse(session.expiresAt)<=Date.now()){json(response,401,{code:'session_expired'});return;}
    const mutation=path.endsWith('/check-in')||path.endsWith('/demo-purchase')||path.endsWith('/unlock');
    if(request.method!==(mutation?'POST':'GET')){json(response,405,{code:'method_not_allowed'});return;}
    if(mutation&&request.headers.origin&&request.headers.origin!=='http://'+request.headers.host){json(response,403,{code:'access_denied'});return;}
    const input=mutation?await body(request):{};
    try{const adult=path.includes('/contents/private-preview-')?(await server.ssrLoadModule('/src/dev/adultPreview.ts')).adultPreview:[];const data=points.run(session.account.account,session.account.tier,path,input,adult);json(response,200,path.endsWith('/summary')?data.summary:path.endsWith('/transactions')?data.transactions:path.endsWith('/unlocks')?data.unlocks:data);}catch(error){const code=error instanceof Error?error.message:'service_unavailable';json(response,code==='insufficient_points'||code==='idempotency_conflict'?409:code==='content_unavailable'?404:400,{code});}return;
   }
   if(request.method==='GET'&&(path==='/api/v1/orders'||path.startsWith('/api/v1/orders/'))){
    const session=sessions.get(token(request)||'');if(!session||Date.parse(session.expiresAt)<=Date.now()){json(response,401,{code:'session_expired'});return;}
    const orders=points.orders(session.account.account);
    if(path==='/api/v1/orders')json(response,200,orders);
    else {const order=orders.find(item=>item.id===decodeURIComponent(path.slice('/api/v1/orders/'.length)));json(response,order?200:404,order??{code:'order_not_found'});}
    return;
   }
   json(response,503,{code:'service_unavailable'});
  })().catch(()=>json(response,400,{code:'invalid_request'}));});}};
}

export default defineConfig(({mode})=>{
 const env=loadEnv(mode,import.meta.dirname,'PREVIEW_');
 const accounts=[
  {account:env.PREVIEW_FREE_ACCOUNT||'',password:env.PREVIEW_FREE_PASSWORD||'',nickname:env.PREVIEW_FREE_ACCOUNT||'',tier:'free',membership:null},
  {account:env.PREVIEW_JOY_ACCOUNT||'',password:env.PREVIEW_JOY_PASSWORD||'',nickname:env.PREVIEW_JOY_ACCOUNT||'',tier:'basic',membership:{level:1,growth:0,nextLevelGrowth:1000,expiresAt:'2026-12-31T15:59:59.000Z'}},
  {account:env.PREVIEW_MEMBER_ACCOUNT||'',password:env.PREVIEW_MEMBER_PASSWORD||'',nickname:env.PREVIEW_MEMBER_ACCOUNT||'',tier:'premium',membership:{level:3,growth:1680,nextLevelGrowth:3000,expiresAt:'2026-12-31T15:59:59.000Z'}},
 ] satisfies PreviewAccount[];
 return{plugins:[react(),previewAuth(accounts.filter(item=>item.account&&item.password)),stripDemoMedia],build:{sourcemap:false},server:{watch:{ignored:['**/.local/**','**/docs/**']},port:5173,strictPort:true,fs:{deny:['**/.git/**','**/.local/**','**/private/**','**/docs/**','**/tests/**','**/.env*']}}};
});

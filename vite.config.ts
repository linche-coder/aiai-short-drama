import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import{rmSync}from'node:fs';import{resolve,sep}from'node:path';
const stripDemoMedia={name:'strip-demo-media',closeBundle(){const dist=resolve(import.meta.dirname,'dist'),target=resolve(dist,'media','demo');if(!target.startsWith(dist+sep))throw new Error('Refusing to remove demo media outside dist');rmSync(target,{recursive:true,force:true});}};

type PreviewAccount={account:string;password:string;nickname:string;tier:'free'|'premium';membership:{level:number;growth:number;nextLevelGrowth:number;expiresAt:string}|null};
function previewAuth(accounts:PreviewAccount[]):Plugin{
 const sessions=new Map<string,{account:PreviewAccount;expiresAt:string}>(),cookieName='aiai_preview_session';
 const json=(response:import('node:http').ServerResponse,status:number,value:unknown,headers:Record<string,string>={})=>{response.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers});response.end(JSON.stringify(value));};
 const body=(request:import('node:http').IncomingMessage)=>new Promise<Record<string,unknown>>((resolveBody,reject)=>{let raw='';request.on('data',chunk=>{raw+=String(chunk);if(raw.length>8192)reject(new Error('request_too_large'));});request.on('end',()=>{try{resolveBody(JSON.parse(raw||'{}') as Record<string,unknown>);}catch{reject(new Error('invalid_json'));}});request.on('error',reject);});
 const token=(request:import('node:http').IncomingMessage)=>request.headers.cookie?.split(';').map(value=>value.trim()).find(value=>value.startsWith(`${cookieName}=`))?.slice(cookieName.length+1);
 const dto=(account:PreviewAccount,expiresAt:string)=>({subject:account.account,nickname:account.nickname,tier:account.tier,roles:[],expiresAt,membership:account.membership});
 return{name:'preview-auth',apply:'serve',configureServer(server){server.middlewares.use((request,response,next)=>{void(async()=>{
   const path=new URL(request.url||'/',`http://${request.headers.host||'localhost'}`).pathname;if(!path.startsWith('/api/v1/')){next();return;}
   if(path==='/api/v1/session'&&request.method==='GET'){const key=token(request),session=key?sessions.get(key):undefined;if(!session||Date.parse(session.expiresAt)<=Date.now()){if(key)sessions.delete(key);json(response,200,{subject:null,tier:'free',roles:[],expiresAt:null});return;}json(response,200,dto(session.account,session.expiresAt));return;}
   if(path==='/api/v1/auth/sign-in'&&request.method==='POST'){const input=await body(request),account=accounts.find(item=>item.account===input.account&&item.password===input.password);if(!account){json(response,401,{code:'invalid_credentials'});return;}const key=crypto.randomUUID(),expiresAt=new Date(Date.now()+8*60*60*1000).toISOString();sessions.set(key,{account,expiresAt});json(response,200,dto(account,expiresAt),{'Set-Cookie':`${cookieName}=${key}; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800`});return;}
   if(path==='/api/v1/session'&&request.method==='DELETE'){const key=token(request);if(key)sessions.delete(key);response.writeHead(204,{'Cache-Control':'no-store','Set-Cookie':`${cookieName}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`});response.end();return;}
   json(response,503,{code:'service_unavailable'});
  })().catch(()=>json(response,400,{code:'invalid_request'}));});}};
}

export default defineConfig(({mode})=>{
 const env=loadEnv(mode,import.meta.dirname,'PREVIEW_');
 const accounts=[
  {account:env.PREVIEW_FREE_ACCOUNT||'',password:env.PREVIEW_FREE_PASSWORD||'',nickname:env.PREVIEW_FREE_ACCOUNT||'',tier:'free',membership:null},
  {account:env.PREVIEW_MEMBER_ACCOUNT||'',password:env.PREVIEW_MEMBER_PASSWORD||'',nickname:env.PREVIEW_MEMBER_ACCOUNT||'',tier:'premium',membership:{level:3,growth:1680,nextLevelGrowth:3000,expiresAt:'2026-12-31T15:59:59.000Z'}},
 ] satisfies PreviewAccount[];
 return{plugins:[react(),previewAuth(accounts.filter(item=>item.account&&item.password)),stripDemoMedia],build:{sourcemap:false},server:{port:5173,strictPort:true,fs:{deny:['**/.git/**','**/.local/**','**/private/**','**/docs/**','**/tests/**','**/.env*']}}};
});

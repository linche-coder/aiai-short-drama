import {festivalConfig} from '../src/services/festivalModel';
import {test,expect,request as requests,type APIRequestContext} from '@playwright/test';
import {createServer,type ViteDevServer} from 'vite';
import {previewAuth} from '../vite.config';
import {mkdtempSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';

let server:ViteDevServer,api:APIRequestContext,other:APIRequestContext;
const account='points-http-free',password=crypto.randomUUID();
test.beforeAll(async()=>{
 server=await createServer({configFile:false,plugins:[previewAuth([{account,password,nickname:'HTTP积分测试',tier:'free',membership:null},{account:'points-http-other',password,nickname:'隔离测试',tier:'premium',membership:null}],join(mkdtempSync(join(tmpdir(),'aiai-points-api-')),'points.json'),{...festivalConfig,enabled:false})],server:{host:'127.0.0.1',port:5187,strictPort:true}});await server.listen();
 api=await requests.newContext({baseURL:'http://127.0.0.1:5187'});other=await requests.newContext({baseURL:'http://127.0.0.1:5187'});
 await api.post('/api/v1/auth/sign-in',{data:{account,password}});await other.post('/api/v1/auth/sign-in',{data:{account:'points-http-other',password}});
});
test.afterAll(async()=>{await api?.dispose();await other?.dispose();await server?.close();});

test('真实预览 HTTP：单一积分包、签到、会员畅看、试用顺延和账户隔离',async()=>{
 const summaries=await Promise.all(Array.from({length:8},()=>api.get('/api/v1/me/points/summary').then(r=>r.json())));
 expect(summaries.map(s=>s.balance)).toEqual(Array(8).fill(0));
 const checks=await Promise.all(Array.from({length:8},()=>api.post('/api/v1/me/points/check-in',{data:{}}).then(r=>r.json())));
 expect(checks.map(s=>s.summary.balance)).toEqual(Array(8).fill(1));
 const recharge=await Promise.all(Array.from({length:6},()=>api.post('/api/v1/me/points/demo-purchase',{data:{offerId:'points-220',idempotencyKey:'purchase'}}).then(r=>r.json())));
 expect(recharge.map(s=>s.summary.balance)).toEqual(Array(6).fill(221));
 expect((await api.post('/api/v1/me/points/demo-purchase',{data:{offerId:'points-60',idempotencyKey:'old-package'}})).status()).toBe(400);
 const path='/api/v1/contents/drama-05/episodes/demo-7/unlock';
 const unlocks=await Promise.all(Array.from({length:8},(_,i)=>api.post(path,{data:{idempotencyKey:`unlock-${i}`,pointsCost:0,tier:'premium'}}).then(r=>r.json())));
 expect(unlocks.map(s=>s.summary.balance)).toEqual(Array(8).fill(216));expect(unlocks[0].unlocks).toHaveLength(1);
 const otherData=await other.get('/api/v1/me/points').then(r=>r.json());expect(otherData.summary.balance).toBe(960);expect(otherData.unlocks).toHaveLength(0);
 const month=await api.post('/api/v1/me/points/demo-purchase',{data:{offerId:'view-month',idempotencyKey:'month'}}).then(r=>r.json());
 expect(month.summary.balance).toBe(216);expect(month.summary.tier).toBe('basic');expect(month.summary.monthlyAllowance).toBe(0);
 expect((await api.get('/api/v1/session').then(r=>r.json())).tier).toBe('basic');
 const quarter=await api.post('/api/v1/me/points/demo-purchase',{data:{offerId:'view-quarter',idempotencyKey:'quarter'}}).then(r=>r.json());
 expect(quarter.summary.balance).toBe(216);expect(quarter.summary.tier).toBe('premium');
 const changed=await api.post('/api/v1/contents/drama-05/episodes/demo-8/unlock',{data:{idempotencyKey:'member-watch',quotedCost:10}});expect((await changed.json()).code).toBe('price_changed');
 const watched=await api.post('/api/v1/contents/drama-05/episodes/demo-8/unlock',{data:{idempotencyKey:'member-watch',quotedCost:0}}).then(r=>r.json());expect(watched.summary.balance).toBe(216);expect(watched.unlocks).toHaveLength(1);
 const expiryBefore=Date.parse((await api.get('/api/v1/session').then(r=>r.json())).membership.expiresAt);
 await api.post('/api/v1/me/trial',{data:{}});await api.post('/api/v1/me/trial',{data:{}});
 const expiryAfter=Date.parse((await api.get('/api/v1/session').then(r=>r.json())).membership.expiresAt);expect(expiryAfter-expiryBefore).toBe(86400000);
 expect((await api.post('/api/v1/contents/deleted/episodes/demo-7/unlock',{data:{idempotencyKey:'deleted'}})).status()).toBe(404);
 expect((await api.post(path,{headers:{Origin:'https://untrusted.example'},data:{idempotencyKey:'forged'}})).status()).toBe(403);
 await api.delete('/api/v1/session');expect((await api.get('/api/v1/me/points')).status()).toBe(401);
 await api.post('/api/v1/auth/sign-in',{data:{account,password}});const restored=await api.get('/api/v1/me/points').then(r=>r.json());expect(restored.summary.balance).toBe(216);expect(restored.transactions.filter((t:{type:string})=>t.type==='check_in')).toHaveLength(1);
 const peer=await requests.newContext({baseURL:'http://127.0.0.1:5187'});await peer.post('/api/v1/auth/sign-in',{data:{account,password}});
 const nextPassword='changed-pass-123';expect((await api.post('/api/v1/me/password',{data:{currentPassword:password,newPassword:nextPassword}})).status()).toBe(204);
 expect((await api.get('/api/v1/session').then(r=>r.json())).subject).toBeNull();expect((await peer.get('/api/v1/me/points')).status()).toBe(401);
 expect((await api.post('/api/v1/auth/sign-in',{data:{account,password}})).status()).toBe(401);
 expect((await api.post('/api/v1/auth/sign-in',{data:{account,password:nextPassword}})).status()).toBe(200);await peer.dispose();
});

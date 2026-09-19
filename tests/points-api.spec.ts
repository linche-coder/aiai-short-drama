import {test,expect,request as requests,type APIRequestContext} from '@playwright/test';
import {createServer,type ViteDevServer} from 'vite';
import {previewAuth} from '../vite.config';
import {mkdtempSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
let server:ViteDevServer,api:APIRequestContext,other:APIRequestContext;
const account='points-http-free',password=crypto.randomUUID();
test.beforeAll(async()=>{
 server=await createServer({configFile:false,plugins:[previewAuth([{account,password,nickname:'HTTP积分测试',tier:'free',membership:null},{account:'points-http-other',password,nickname:'隔离测试',tier:'premium',membership:null}],join(mkdtempSync(join(tmpdir(),'aiai-points-api-')),'points.json'))],server:{host:'127.0.0.1',port:5187,strictPort:true}});await server.listen();
 api=await requests.newContext({baseURL:'http://127.0.0.1:5187'});other=await requests.newContext({baseURL:'http://127.0.0.1:5187'});
 await api.post('/api/v1/auth/sign-in',{data:{account,password}});await other.post('/api/v1/auth/sign-in',{data:{account:'points-http-other',password}});
});
test.afterAll(async()=>{await api?.dispose();await other?.dispose();await server?.close();});
test('真实预览HTTP：并发月发放、签到、解锁、价格防伪及账户隔离',async()=>{
 const summaries=await Promise.all(Array.from({length:8},()=>api.get('/api/v1/me/points/summary').then(r=>r.json())));expect(summaries.map(s=>s.balance)).toEqual(Array(8).fill(40));
 const checks=await Promise.all(Array.from({length:8},()=>api.post('/api/v1/me/points/check-in',{data:{}}).then(r=>r.json())));expect(checks.map(s=>s.summary.balance)).toEqual(Array(8).fill(45));
 const path='/api/v1/contents/drama-05/episodes/demo-7/unlock';const unlocks=await Promise.all(Array.from({length:8},(_,i)=>api.post(path,{data:{idempotencyKey:`unlock-${i}`,pointsCost:0,tier:'premium'}}).then(r=>r.json())));expect(unlocks.map(s=>s.summary.balance)).toEqual(Array(8).fill(35));expect(unlocks[0].unlocks).toHaveLength(1);
 const otherData=await other.get('/api/v1/me/points').then(r=>r.json());expect(otherData.summary.balance).toBe(960);expect(otherData.unlocks).toHaveLength(0);
 const recharge=await Promise.all(Array.from({length:6},()=>api.post('/api/v1/me/points/demo-purchase',{data:{offerId:'points-200',idempotencyKey:'purchase'}}).then(r=>r.json())));expect(recharge.map(s=>s.summary.balance)).toEqual(Array(6).fill(235));
 const upgrade=await api.post('/api/v1/me/points/demo-purchase',{data:{offerId:'joy-year',idempotencyKey:'upgrade'}}).then(r=>r.json());expect(upgrade.summary.balance).toBe(515);expect(upgrade.summary.tier).toBe('basic');expect((await api.get('/api/v1/session').then(r=>r.json())).tier).toBe('basic');
 const premium=await api.post('/api/v1/me/points/demo-purchase',{data:{offerId:'premium-year',idempotencyKey:'premium'}}).then(r=>r.json());expect(premium.summary.balance).toBe(1155);
 const changed=await api.post('/api/v1/contents/drama-05/episodes/demo-8/unlock',{data:{idempotencyKey:'discount',quotedCost:10}});expect((await changed.json()).code).toBe('price_changed');
 const discounted=await api.post('/api/v1/contents/drama-05/episodes/demo-8/unlock',{data:{idempotencyKey:'discount',quotedCost:8}}).then(r=>r.json());expect(discounted.summary.balance).toBe(1147);expect(discounted.unlocks[0].pointsSpent).toBe(8);
 expect((await api.post('/api/v1/contents/deleted/episodes/demo-7/unlock',{data:{idempotencyKey:'deleted'}})).status()).toBe(404);
 expect((await api.post(path,{headers:{Origin:'https://untrusted.example'},data:{idempotencyKey:'forged'}})).status()).toBe(403);
 await api.delete('/api/v1/session');expect((await api.get('/api/v1/me/points')).status()).toBe(401);
 await api.post('/api/v1/auth/sign-in',{data:{account,password}});const restored=await api.get('/api/v1/me/points').then(r=>r.json());expect(restored.summary.balance).toBe(1147);expect(restored.transactions.filter((t:{type:string})=>t.type==='check_in')).toHaveLength(1);
});

import{test,expect,request as requests,type APIRequestContext}from'@playwright/test';
import{createServer,type ViteDevServer}from'vite';
import{previewAuth}from'../vite.config';
import{festivalConfig}from'../src/services/festivalModel';
import{newWallet}from'../src/services/pointsModel';
import{mkdtempSync,writeFileSync}from'node:fs';
import{join}from'node:path';
import{tmpdir}from'node:os';

let server:ViteDevServer,first:APIRequestContext,second:APIRequestContext;
const account='member-redemption-http',password=crypto.randomUUID();
test.beforeAll(async()=>{
 const file=join(mkdtempSync(join(tmpdir(),'member-api-')),'wallet.json'),wallet=newWallet();wallet.pointsBalance=33;wallet.memberPointsBalance=100;
 writeFileSync(file,JSON.stringify({wallets:{[account]:wallet},members:{[account]:{tier:'basic',product:'view',expiresAt:new Date(Date.now()+86400000).toISOString()}}}));
 server=await createServer({configFile:false,plugins:[previewAuth([{account,password,nickname:'兑换测试',tier:'free',membership:null}],file,{...festivalConfig,enabled:false})],server:{host:'127.0.0.1',port:5188,strictPort:true}});await server.listen();
 first=await requests.newContext({baseURL:'http://127.0.0.1:5188'});second=await requests.newContext({baseURL:'http://127.0.0.1:5188'});
 for(const client of [first,second])expect((await client.post('/api/v1/auth/sign-in',{data:{account,password}})).status()).toBe(200);
});
test.afterAll(async()=>{await first?.dispose();await second?.dispose();await server?.close();});

test('跨设备并发签到一次；兑换重复提交仅扣分加时一次，余额与会话同步',async()=>{
 const checks=await Promise.all(Array.from({length:6},(_,index)=>(index%2?first:second).post('/api/v1/me/points/check-in',{data:{}}).then(response=>response.json())));
 expect(checks.every(item=>item.summary.memberBalance===101&&item.summary.balance===33)).toBeTruthy();
 expect(checks.filter(item=>item.checkInResult.amount===1)).toHaveLength(1);
 const oldExpiry=Date.parse((await first.get('/api/v1/session').then(response=>response.json())).membership.expiresAt);
 const responses=await Promise.all(Array.from({length:6},(_,index)=>(index%2?first:second).post('/api/v1/me/points/member-redeem',{data:{tierId:'day-7',idempotencyKey:'same-request'}}).then(response=>response.json())));
 expect(responses.every(item=>item.summary.memberBalance===1&&item.summary.balance===33)).toBeTruthy();
 const newExpiry=Date.parse((await second.get('/api/v1/session').then(response=>response.json())).membership.expiresAt);
 expect(newExpiry-oldExpiry).toBe(168*3600000);
 expect(responses[0].memberTransactions.filter((item:{type:string})=>item.type==='member_redeem')).toHaveLength(1);
 expect((await first.post('/api/v1/me/points/member-redeem',{data:{tierId:'day-3',idempotencyKey:'insufficient'}})).status()).toBe(409);
 expect((await first.post('/api/v1/me/points/member-redeem',{data:{tierId:'day-1',days:1000,idempotencyKey:'forged'}})).status()).toBe(400);
 const unchanged=await first.get('/api/v1/me/points').then(response=>response.json());expect(unchanged.summary.memberBalance).toBe(1);expect(unchanged.memberTransactions).toHaveLength(2);
 await first.delete('/api/v1/session');expect((await first.post('/api/v1/me/points/member-redeem',{data:{tierId:'day-1',idempotencyKey:'logged-out'}})).status()).toBe(401);
});

import {test,expect,request as requests,type APIRequestContext} from '@playwright/test';
import {createServer,type ViteDevServer} from 'vite';
import {mkdtempSync,mkdirSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {previewAuth} from '../vite.config';
import {createPreviewPoints} from '../server/previewPoints';
import {festivalConfig} from '../src/services/festivalModel';
const origin='http://127.0.0.1:5189',password='Festival-test-2609';
let server:ViteDevServer,file:string;
const accounts=['host','other','claim','ui','retry','switch'].map(id=>({account:`festival_${id}`,password,nickname:`festival_${id}`,tier:'free' as const,membership:null}));
async function context(account?:string){const api=await requests.newContext({baseURL:origin});if(account)expect((await api.post('/api/v1/auth/sign-in',{data:{account,password}})).ok()).toBeTruthy();return api;}
const data=(api:APIRequestContext,path='/api/v1/festival')=>api.get(path).then(r=>r.json());
test.beforeAll(async()=>{file=join(mkdtempSync(join(tmpdir(),'aiai-festival-')),'points.json');server=await createServer({configFile:false,plugins:[previewAuth(accounts,file)],server:{watch:{ignored:['**/.local/**','**/docs/**']},host:'127.0.0.1',port:5189,strictPort:true}});await server.listen();});
test.afterAll(async()=>{await server?.close();});

test('atomic participation, concurrent requests, retries and persisted recovery',async()=>{
 const api=await context('festival_claim');const before=await data(api,'/api/v1/me/points');
 const results=await Promise.all(Array.from({length:12},()=>api.post('/api/v1/festival/claim',{data:{amount:999,tier:'premium'}}).then(r=>r.json())));
 expect(results.filter(r=>r.awarded)).toHaveLength(1);expect(results.every(r=>r.totalReward===50)).toBeTruthy();
 const wallet=await data(api,'/api/v1/me/points');expect(wallet.summary.balance-before.summary.balance).toBe(50);expect(wallet.transactions.filter((t:{type:string})=>t.type==='festival_participation')).toHaveLength(1);
 const restored=createPreviewPoints(file);expect(restored.festival('festival_claim').totalReward).toBe(50);expect(restored.festival('festival_claim','free',true).awarded).toBe(false);
 expect(wallet.transactions[0].rewardId).toBe(results[0].records[0].id);expect(wallet.transactions[0].activityId).toBe(festivalConfig.id);
 await api.dispose();
});

test('first valid invitation wins; six new registrations award five; existing users, self, copies and retries do not pay',async()=>{
 const host=await context('festival_host'),other=await context('festival_other');await data(host,'/api/v1/me/points');
 const code=(await data(host)).invitationCode,otherCode=(await data(other)).invitationCode;
 const old=await context();await old.post('/api/v1/festival/referral',{data:{code}});await old.post('/api/v1/auth/sign-in',{data:{account:'festival_host',password}});
 expect((await data(host)).totalReward).toBe(0);
 expect((await old.post('/api/v1/auth/register',{data:{account:'festival_host',password}})).status()).toBe(409);
 const guests=await Promise.all(Array.from({length:6},()=>context()));
 for(const guest of guests){await guest.post('/api/v1/festival/referral',{data:{code}});await guest.post('/api/v1/festival/referral',{data:{code:otherCode}});}
 expect((await data(host)).totalReward).toBe(0);
 const registered=await Promise.all(guests.map((guest,i)=>guest.post('/api/v1/auth/register',{data:{account:`invited_${i}`,password}})));expect(registered.every(r=>r.ok())).toBeTruthy();
 expect((await data(host)).invitationReward).toBe(250);expect((await data(host)).successfulInvites).toBe(6);expect((await data(other)).invitationReward).toBe(0);
 const repeats=await Promise.all(Array.from({length:5},()=>guests[0].post('/api/v1/auth/register',{data:{account:'invited_0',password}})));expect(repeats.every(r=>r.status()===409)).toBeTruthy();
 const own=await guests[0].post('/api/v1/festival/claim',{data:{}}).then(r=>r.json());expect(own.participationReward).toBe(50);
 await host.post('/api/v1/festival/claim',{data:{}});const total=await data(host);expect(total.totalReward).toBe(300);expect(total.records).toHaveLength(6);
 await host.post('/api/v1/me/points/check-in',{data:{}});expect((await data(host)).totalReward).toBe(300);expect((await data(host,'/api/v1/me/points')).summary.balance).toBe(345);
 await Promise.all([host,other,old,...guests].map(c=>c.dispose()));
});

test('inactive states, write failure and restart preserve transactional consistency',()=>{
 const temporary=join(mkdtempSync(join(tmpdir(),'aiai-festival-atomic-')),'wallet.json');
 const upcoming=createPreviewPoints(temporary,{...festivalConfig,enabled:false});expect(upcoming.festival('first').phase).toBe('upcoming');expect(()=>upcoming.festival('first','free',true)).toThrow('activity_inactive');
 const active=createPreviewPoints(temporary);mkdirSync(temporary+'.tmp');expect(()=>active.festival('first','free',true)).toThrow();rmSync(temporary+'.tmp',{recursive:true});
 expect(active.festival('first').totalReward).toBe(0);expect(active.festival('first','free',true).totalReward).toBe(50);
 const ended=createPreviewPoints(temporary,{...festivalConfig,enabled:true,endsAt:'2000-01-01T00:00:00Z'});expect(ended.festival('first').phase).toBe('ended');expect(ended.festival('first').totalReward).toBe(50);expect(()=>ended.festival('second','free',true)).toThrow('activity_inactive');
 const state=JSON.parse(readFileSync(temporary,'utf8'));expect(state.wallets.first.pointsBalance).toBe(90);expect(state.festival.rewards.first).toHaveLength(1);
});

test('claim login context, wallet/header/ledger synchronization and repeat reload',async({page})=>{
 await page.addInitScript(()=>sessionStorage.setItem('aiai:intro-seen','yes'));
 await page.goto(origin+'/festival');await page.getByRole('button',{name:'立即参与，领取50积分'}).click();
 await expect(page.getByRole('dialog',{name:'登录注册'})).toBeVisible();
 await page.getByPlaceholder('请输入账号').fill('festival_ui');await page.getByPlaceholder('请输入密码').fill(password);await page.locator('.account-submit').click();
 await expect(page.getByRole('button',{name:'已领取50积分'})).toBeVisible();await expect(page.locator('.points-trigger')).toContainText('90');
 await expect(page.locator('.festival-success')).toContainText('50积分已到账');await page.reload();await expect(page.getByRole('button',{name:'已领取50积分'})).toBeVisible();await expect(page.locator('.festival-success')).toHaveCount(0);
 await page.getByRole('link',{name:'查看积分明细'}).click();await expect(page.getByRole('heading',{name:'双节活动参与奖励',exact:true})).toHaveCount(1);
});

test('failed response after committed claim recovers without double award',async({page})=>{
 await page.request.post(origin+'/api/v1/auth/sign-in',{data:{account:'festival_retry',password}});
 let first=true;await page.route('**/api/v1/festival/claim',async route=>{if(first){first=false;await route.fetch();await route.abort('failed');}else await route.continue();});
 await page.goto(origin+'/festival');await page.getByRole('button',{name:'立即参与，领取50积分'}).click();
 await expect(page.getByRole('button',{name:'已领取50积分'})).toBeVisible();await expect(page.locator('.festival-success')).toHaveCount(0);
 await page.getByRole('button',{name:'重试领取'}).click();await expect(page.locator('.festival-info')).toContainText('已领取过');await expect(page.locator('.festival-success')).toHaveCount(0);
 expect((await page.request.get(origin+'/api/v1/festival').then(r=>r.json())).totalReward).toBe(50);
});

test('responsive layered artwork, all four entry links, clipboard fallback and account isolation',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.addInitScript(()=>sessionStorage.setItem('aiai:intro-seen','yes'));
 await page.goto(origin+'/#home');await page.locator('.hero-festival a').click();await expect(page).toHaveURL(origin+'/festival');
 await page.goto(origin+'/#home');await page.locator('.festival-strip').click();await expect(page).toHaveURL(origin+'/festival');
 await page.goto(origin+'/shorts');await page.getByRole('link',{name:'双节福利，任务最高领350积分，查看活动',exact:true}).click();await expect(page).toHaveURL(origin+'/festival');
 await page.goto(origin+'/18plus');await page.getByRole('button',{name:'确认并进入',exact:true}).click();
 await expect(page.locator('.adult-festival-cta')).toBeVisible();await page.locator('.adult-festival-cta').click();await expect(page).toHaveURL(origin+'/festival');
 await page.request.post(origin+'/api/v1/auth/sign-in',{data:{account:'festival_switch',password}});await page.reload();
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>Promise.reject(new Error('denied'))}}));
 await page.getByRole('button',{name:'复制专属邀请链接'}).click();await expect(page.getByRole('textbox',{name:'专属邀请链接'})).toHaveValue(/\/festival\?invite=/);
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:1000});await expect(page.locator('.festival-title-art')).toBeVisible();await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  const fits=await page.locator('.festival-hero').evaluate(el=>{const a=el.querySelector('.festival-title-art')!.getBoundingClientRect(),b=el.getBoundingClientRect();return a.left>=b.left&&a.right<=b.right&&a.top>=b.top&&a.bottom<=b.bottom;});expect(fits).toBeTruthy();
  await page.screenshot({path:`.local/festival-verified-${width}.png`,fullPage:true});
 }
 await page.request.delete(origin+'/api/v1/session');await page.reload();await expect(page.locator('.festival-totals')).not.toContainText('120');await expect(page.getByRole('button',{name:'登录获取专属邀请链接'})).toBeVisible();
});

test('invitation survives site navigation and registration modal; new user can claim their own reward',async({page})=>{
 const host=await context('festival_other'),code=(await data(host)).invitationCode;
 await page.goto(origin+'/festival?invite='+code);await expect.poll(()=>page.context().cookies().then(c=>c.some(c=>c.name==='aiai_festival_ref'))).toBe(true);
 await page.getByRole('link',{name:'会员中心',exact:true}).click();await page.getByRole('button',{name:'登录 / 注册'}).click();await page.getByRole('tab',{name:'注册',exact:true}).click();
 await page.getByPlaceholder('请输入英文、数字或下划线组合').fill('ui_invited');await page.getByPlaceholder('8–64 个字符').fill(password);await page.getByPlaceholder('再次输入密码').fill(password);await page.getByRole('button',{name:'创建账号',exact:true}).click();
 await expect(page.locator('.account-modal')).toHaveCount(0);expect((await data(host)).invitationReward).toBe(50);
 await page.getByRole('link',{name:'双节福利，任务最高领350积分，查看活动',exact:true}).click();await page.getByRole('button',{name:'立即参与，领取50积分'}).click();await expect(page.locator('.points-trigger')).toHaveText('90');
 await page.locator('.festival-primary').focus();await expect(page.locator('.festival-primary')).toBeDisabled();await host.dispose();
});

test('two tabs claim once and synchronize; ended/upcoming disable new rewards; reduced motion and touch',async({browser})=>{
 const c=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
 await c.request.post(origin+'/api/v1/auth/register',{data:{account:'two_tabs',password}});
 const a=await c.newPage(),b=await c.newPage();await Promise.all([a.goto(origin+'/festival'),b.goto(origin+'/festival')]);
 await Promise.all([a.getByRole('button',{name:'立即参与，领取50积分'}).tap(),b.getByRole('button',{name:'立即参与，领取50积分'}).tap()]);
 await expect(a.locator('.points-trigger')).toHaveText('90');await expect(b.locator('.points-trigger')).toHaveText('90');
 expect((await c.request.get(origin+'/api/v1/festival').then(r=>r.json())).records).toHaveLength(1);
 expect(await a.locator('.festival-moonlight').evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
 await a.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{}}}));await a.getByRole('button',{name:'复制专属邀请链接'}).tap();await expect(a.getByRole('button',{name:'链接已复制'})).toBeVisible();
 const result=await c.request.get(origin+'/api/v1/festival').then(r=>r.json());
 for(const phase of ['upcoming','ended']){await a.route('**/api/v1/festival',r=>r.fulfill({json:{...result,claimed:false,phase}}));await a.reload();await expect(a.locator('.festival-primary')).toBeDisabled();await expect(a.locator('.festival-invite .festival-secondary')).toBeDisabled();await a.unroute('**/api/v1/festival');}
 await c.close();
});

test('late reward response cannot reintroduce the previous account after logout and sign-in',async({page})=>{
 const next=await context();await next.post('/api/v1/auth/register',{data:{account:'next_reward_user',password}});await next.dispose();
 await page.request.post(origin+'/api/v1/auth/register',{data:{account:'slow_reward_user',password}});
 let release!:()=>void;const pending=new Promise<void>(resolve=>{release=resolve;});let committed=false;
 await page.route('**/api/v1/festival/claim',async route=>{const result=await route.fetch();committed=true;await pending;await route.fulfill({response:result});});
 await page.goto(origin+'/festival');await page.getByRole('button',{name:'立即参与，领取50积分'}).click();await expect.poll(()=>committed).toBe(true);
 await page.locator('.account-avatar-link').click();await page.getByRole('button',{name:'退出账号',exact:true}).click();
 await page.getByRole('link',{name:'双节福利，任务最高领350积分，查看活动',exact:true}).click();await page.getByRole('button',{name:'立即参与，领取50积分'}).click();
 await page.getByPlaceholder('请输入账号').fill('next_reward_user');await page.getByPlaceholder('请输入密码').fill(password);await page.locator('.account-submit').click();
 release();await expect(page.locator('.account-modal')).toHaveCount(0);await expect(page.locator('.festival-primary')).toContainText('已领取50积分');
 await expect(page.locator('.festival-totals>div').nth(1)).toContainText('0');await expect(page.locator('.points-trigger')).toHaveText('90');
});

test('membership HTTP concurrent purchase, order ownership, persisted history and UI ledger',async({page})=>{
 const api=await context();await api.post('/api/v1/auth/register',{data:{account:'order_http',password}});
 const results=await Promise.all(Array.from({length:10},()=>api.post('/api/v1/me/points/demo-purchase',{data:{offerId:'premium-year',idempotencyKey:'one-order',bonus:999999,tier:'free'}}).then(r=>r.json())));
 expect(results.every(result=>result.summary.balance===3960)).toBe(true);
 expect((await data(api)).rechargeReward).toBe(3000);expect((await data(api)).appReward).toBe(0);
 const orders=await data(api,'/api/v1/orders');expect(orders).toHaveLength(1);expect(orders[0].festivalRewards).toHaveLength(1);
 const other=await context('festival_other');expect((await other.get('/api/v1/orders/'+orders[0].id)).status()).toBe(404);
 await page.request.post(origin+'/api/v1/auth/sign-in',{data:{account:'order_http',password}});
 await page.goto(origin+'/me/orders');await expect(page.locator('.order-card')).toContainText('双节会员充值加赠 +3000积分');
 await page.locator('.order-card').click();await expect(page.locator('.purchase-festival-bonus')).toContainText('+3000积分');
 await page.getByRole('link',{name:'查看积分明细',exact:true}).click();await expect(page.getByRole('heading',{name:'双节会员充值加赠',exact:true})).toBeVisible();await page.locator('.points-transaction details').click();await expect(page.locator('.points-transaction details')).toContainText(orders[0].id);
 await api.dispose();await other.dispose();
});

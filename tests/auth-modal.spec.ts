import{test,expect}from'@playwright/test';
const docs='docs/auth-modal';

test.beforeEach(async({page})=>{
 await page.addInitScript(()=>sessionStorage.setItem('aiai:intro-seen','yes'));
 await page.route('**/api/v1/session',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({subject:null,tier:'free',roles:[],expiresAt:null})}));
});

test('账号路由在原页面上打开共享弹窗并支持关闭',async({page})=>{
 await page.goto('/account/login?returnTo=%2F%23home');
 await expect(page.getByRole('dialog',{name:'登录注册'})).toBeVisible();
 await expect(page.getByText('用户登录注册',{exact:true})).toHaveCount(0);
 await expect(page.getByRole('heading',{name:'热门推荐'})).toBeVisible();
 await expect(page.getByRole('button',{name:'登录',exact:true})).toBeVisible();
 await expect(page.getByPlaceholder('请输入账号')).toBeVisible();
 await page.screenshot({path:`${docs}/login-desktop-1440.png`});
 await page.getByRole('button',{name:'关闭账号窗口'}).focus();await page.keyboard.press('Shift+Tab');await expect(page.getByRole('button',{name:'登录',exact:true}).last()).toBeFocused();await page.keyboard.press('Tab');await expect(page.getByRole('button',{name:'关闭账号窗口'})).toBeFocused();
 await page.keyboard.press('Escape');
 await expect(page).toHaveURL(/\/#home$/);
 await expect(page.getByRole('dialog')).toHaveCount(0);
 await page.getByRole('button',{name:'登录 / 注册'}).click();
 await expect(page.getByRole('dialog')).toBeVisible();
 await page.goBack();
 await expect(page.getByRole('dialog')).toHaveCount(0);
 await page.getByRole('button',{name:'登录 / 注册'}).click();
 await page.mouse.click(4,120);
 await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('登录错误、显隐密码和真实接口成功回跳',async({page})=>{
 await page.route('**/api/v1/auth/sign-in',route=>route.fulfill({status:401,contentType:'application/json',body:'{}'}));
 await page.goto('/account/login?returnTo=%2Fplay%2Fdrama-05%3Fepisode%3Ddemo-7%23comments');
 await page.getByRole('button',{name:'登录',exact:true}).last().click();
 await expect(page.getByText('请输入账号。')).toBeVisible();
 await page.getByPlaceholder('请输入账号').fill('reader_01');
 await page.getByPlaceholder('请输入密码').fill('secure-pass');
 await page.getByRole('button',{name:'显示密码'}).click();
 await expect(page.getByPlaceholder('请输入密码')).toHaveAttribute('type','text');
 await page.getByRole('button',{name:'登录',exact:true}).last().click();
 await expect(page.getByRole('alert')).toContainText('账号或密码错误');
 await page.unroute('**/api/v1/auth/sign-in');
 await page.route('**/api/v1/auth/sign-in',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({subject:'reader_01',nickname:'读者',tier:'free',roles:[],expiresAt:'2026-10-17T00:00:00.000Z'})}));
 await page.getByRole('button',{name:'登录',exact:true}).last().click();
 await expect(page).toHaveURL(/\/play\/drama-05\?episode=demo-7#comments$/);
});

test('注册字段规则、可选邮箱和成功后自动登录',async({page})=>{
 let requestBody:Record<string,unknown>|null=null;
 await page.route('**/api/v1/auth/register',async route=>{requestBody=route.request().postDataJSON();await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({subject:'story_user',nickname:'story_user',tier:'free',roles:[],expiresAt:'2026-10-17T00:00:00.000Z'})});});
 await page.goto('/account/register?returnTo=%2Fmembership');
 await page.getByPlaceholder('请输入英文、数字或下划线组合').fill('ab');
 await page.getByPlaceholder('8–64 个字符').fill('12345678');
 await page.getByPlaceholder('再次输入密码').fill('87654321');
 await page.getByRole('button',{name:'创建账号'}).click();
 await expect(page.getByText('账号需为 4–20 位英文、数字或下划线。')).toBeVisible();
 await expect(page.getByText('两次输入的密码不一致。')).toBeVisible();
 await page.getByPlaceholder('请输入英文、数字或下划线组合').fill('story_user');
 await page.getByPlaceholder('再次输入密码').fill('12345678');
 await page.getByRole('button',{name:'创建账号'}).click();
 await expect(page).toHaveURL(/\/membership$/);
 expect(requestBody).toEqual({account:'story_user',password:'12345678'});
});

test('找回密码失败时不假报已发送',async({page})=>{
 await page.route('**/api/v1/auth/password-reset',route=>route.fulfill({status:503,contentType:'application/json',body:'{}'}));
 await page.goto('/account/forgot-password?returnTo=%2F%23home');
 await page.getByPlaceholder('请输入绑定邮箱').fill('user@example.com');
 await page.getByRole('button',{name:'发送重置指引'}).click();
 await expect(page.getByRole('alert')).toContainText('暂时不可用');
 await expect(page.getByText('重置指引已发送')).toHaveCount(0);
});

test('拒绝外部回跳并保留受限剧集的会员路径',async({page})=>{
 await page.route('**/api/v1/auth/sign-in',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({subject:'reader_01',nickname:'读者',tier:'free',roles:[],expiresAt:'2026-10-17T00:00:00.000Z'})}));
 await page.goto('/account/login?returnTo=https%3A%2F%2Fevil.example%2Fsteal');
 await page.getByPlaceholder('请输入账号').fill('reader_01');await page.getByPlaceholder('请输入密码').fill('secure-pass');await page.getByRole('button',{name:'登录',exact:true}).last().click();
 await expect(page).toHaveURL(/\/#home$/);await expect(page).not.toHaveURL(/evil\.example/);
 await page.goto('/play/drama-05?episode=demo-1');
 await page.getByRole('button',{name:/第7集，需基础会员权益/}).click();
 await expect(page.getByRole('heading',{name:'本集需要基础会员权益'})).toBeVisible();
 const gate=page.getByRole('dialog');
 await expect(gate.getByRole('button',{name:'关闭',exact:true})).toHaveCount(0);
 await expect(gate.locator('.membership-gate-actions')).toHaveCSS('gap','14px');
 await page.screenshot({path:`${docs}/membership-gate-desktop-1440.png`});
 await page.getByRole('link',{name:'开通会员'}).click();
 await expect(page).toHaveURL(/\/membership\?returnTo=.*demo-7/);
 await page.locator('.plan-card').filter({hasText:'基础月卡'}).getByRole('link',{name:'选择方案'}).click();
 await expect(page).toHaveURL(/\/checkout\?plan=basic-month.*returnTo=.*demo-7/);
 await expect(page.getByText('支付服务正在准备中')).toBeVisible();
 await expect(page.getByText(/sandbox_order|签名密钥|回调地址/)).toHaveCount(0);
});

test('评论登录保留草稿且关闭后回到原集',async({page})=>{
 await page.goto('/play/drama-05?episode=demo-3#comments');
 await page.getByLabel('发表评论').fill('这是一条尚未提交的评论草稿');
 await page.getByRole('button',{name:'发表评论'}).click();
 await expect(page.getByRole('dialog')).toBeVisible();
 await expect(page).toHaveURL(/\/account\/login\?returnTo=.*demo-3.*comments/);
 await page.getByRole('button',{name:'关闭账号窗口'}).click();
 await expect(page).toHaveURL(/\/play\/drama-05\?episode=demo-3#comments$/);
 await expect(page.getByLabel('发表评论')).toHaveValue('这是一条尚未提交的评论草稿');
});

test('桌面与手机注册弹窗截图、内部滚动和无横向溢出',async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto('/account/register?returnTo=%2F%23home');
 await page.screenshot({path:`${docs}/register-desktop-1440.png`});
 await page.setViewportSize({width:390,height:844});
 await page.goto('/account/login?returnTo=%2F%23home');
 await page.screenshot({path:`${docs}/login-mobile-390.png`});
 await page.getByRole('tab',{name:'注册'}).click();
 await page.locator('.account-modal-panel').evaluate(element=>element.scrollTo(0,element.scrollHeight));
 await expect(page.getByRole('button',{name:'创建账号'})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
 await page.screenshot({path:`${docs}/register-mobile-390.png`});
 for(const width of[768,1440]){await page.setViewportSize({width,height:900});await page.goto('/account/login?returnTo=%2F%23home');expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);}
 await page.setViewportSize({width:390,height:520});await page.goto('/account/register?returnTo=%2F%23home');await page.locator('.account-modal-panel').evaluate(element=>element.scrollTo(0,element.scrollHeight));await expect(page.getByRole('button',{name:'创建账号'})).toBeVisible();
});

import{test,expect}from'@playwright/test';

test.beforeEach(async({page})=>{await page.goto('/');await page.evaluate(()=>{localStorage.removeItem('aiai:isolated-sandbox:v1');sessionStorage.removeItem('aiai:isolated-sandbox-session');sessionStorage.setItem('aiai:intro-seen','yes');});});

test('登录回跳只允许站内路径，权益不能在播放页自选',async({page})=>{
 await page.goto('/account/login?returnTo=%2Fplay%2Fdrama-05%3Fepisode%3Ddemo-3%23comments');
 await page.getByRole('button',{name:'进入测试用户 A（免费）'}).click();
 await expect(page).toHaveURL(/\/play\/drama-05\?episode=demo-3#comments$/);
 await expect(page.getByText('当前权益：免费')).toBeVisible();
 await expect(page.getByLabel('账户权益')).toHaveCount(0);
 await page.goto('/me');await page.getByRole('button',{name:'退出账号'}).click();
 await page.goto('/account/login?returnTo=https%3A%2F%2Fevil.example%2Fsteal');
 await page.getByRole('button',{name:'进入测试用户 A（免费）'}).click();
 await expect(page).not.toHaveURL(/evil\.example/);
});

test('沙盒订单幂等发权并阻止跨账号读取',async({page})=>{
 await page.goto('/account/login?returnTo=%2Fcheckout%3Fplan%3Dbasic-month');
 await page.getByRole('button',{name:'进入测试用户 A（免费）'}).click();
 await page.getByLabel(/我已阅读/).check();
 await page.getByRole('button',{name:'创建沙盒订单'}).click();
 await expect(page).toHaveURL(/\/me\/orders\/sandbox_order_/);
 const orderPath=new URL(page.url()).pathname;
 await page.getByRole('button',{name:/成功并发权/}).click();
 await expect(page.getByText('已支付',{exact:true})).toBeVisible();
 await expect(page.getByText('权益已生效',{exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:/成功并发权/})).toBeDisabled();
 await page.goto('/me');
 await page.getByRole('button',{name:'退出账号'}).click();
 await page.goto(`/account/login?returnTo=${encodeURIComponent(orderPath)}`);
 await page.getByRole('button',{name:'进入测试用户 B（高级）'}).click();
 await expect(page.getByText('订单不存在或无权访问')).toBeVisible();
});

test('评论回复点赞通知与作者删除边界',async({page})=>{
 const play='/play/drama-05?episode=demo-1#comments';
 await page.goto(`/account/login?returnTo=${encodeURIComponent(play)}`);
 await page.getByRole('button',{name:'进入测试用户 A（免费）'}).click();
 await page.getByLabel('以 测试用户 A 发表评论').fill('这一集的节奏很紧凑。');
 await page.getByRole('button',{name:'发布到本地沙盒'}).click();
 await expect(page.getByText('这一集的节奏很紧凑。')).toBeVisible();
 await page.goto('/me');await page.getByRole('button',{name:'退出账号'}).click();
 await page.goto(`/account/login?returnTo=${encodeURIComponent(play)}`);await page.getByRole('button',{name:'进入测试用户 B（高级）'}).click();
 const comment=page.locator('.comment-item').filter({hasText:'这一集的节奏很紧凑。'});
 await expect(comment.getByRole('button',{name:'删除'})).toHaveCount(0);
 await comment.locator('.comment-actions button').first().click();
 await comment.getByRole('button',{name:'回复'}).click();
 await page.getByLabel('回复 测试用户 A').fill('同感，转折也很清楚。');
 await page.getByRole('button',{name:'发布到本地沙盒'}).click();
 await expect(page.getByText('同感，转折也很清楚。')).toBeVisible();
 await page.goto('/me');await page.getByRole('button',{name:'退出账号'}).click();
 await page.goto('/account/login?returnTo=%2Fme%2Fmessages');await page.getByRole('button',{name:'进入测试用户 A（免费）'}).click();
 await expect(page.getByText('收到一条沙盒回复')).toBeVisible();
 await page.goto('/me/comments');await page.getByRole('button',{name:'删除'}).click();
 await expect(page.getByText('还没有评论')).toBeVisible();
});

test('游客收藏登录时显式选择合并',async({page})=>{
 await page.goto('/play/drama-05?episode=demo-1');
 await page.getByRole('button',{name:'收藏'}).click();
 await page.getByRole('button',{name:'登录 / 注册'}).click();
 await page.getByRole('button',{name:'进入测试用户 A（免费）'}).click();
 await expect(page.getByRole('heading',{name:'处理游客收藏'})).toBeVisible();
 await page.getByRole('button',{name:'合并到当前测试账号'}).click();
 await page.goto('/me/favorites');
 await expect(page.getByText('凋零前，请对我偏执')).toBeVisible();
});

test('关键页面截图与响应式无横向溢出',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});
 await page.goto('/account/login?returnTo=%2Fme');
 await page.screenshot({path:'docs/closure/login-1440.png',fullPage:true});
 await page.getByRole('button',{name:'进入测试用户 A（免费）'}).click();
 await page.goto('/checkout?plan=premium-month');
 await page.screenshot({path:'docs/closure/checkout-1440.png',fullPage:true});
 await page.goto('/play/drama-05?episode=demo-1#comments');
 await expect(page.getByRole('heading',{name:'评论与讨论'})).toBeVisible();
 await page.screenshot({path:'docs/closure/comments-1440.png',fullPage:true});
 await page.goto('/me');
 await page.screenshot({path:'docs/closure/me-1440.png',fullPage:true});
 for(const width of[390,768,1440]){await page.setViewportSize({width,height:900});await page.goto('/checkout?plan=basic-month');const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);expect(overflow).toBeLessThanOrEqual(1);if(width===390)await page.screenshot({path:'docs/closure/mobile-checkout-390.png',fullPage:true});}
});

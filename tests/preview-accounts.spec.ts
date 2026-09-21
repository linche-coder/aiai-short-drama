import{test,expect}from'@playwright/test';

const accounts=[
 {kind:'免费账号',account:process.env.PREVIEW_FREE_ACCOUNT,password:process.env.PREVIEW_FREE_PASSWORD,status:'当前：免费用户',avatar:'free',screenshot:'account-free-desktop-1440.png'},
 {kind:'会员账号',account:process.env.PREVIEW_MEMBER_ACCOUNT,password:process.env.PREVIEW_MEMBER_PASSWORD,status:'当前：尊享会员',avatar:'member',screenshot:'account-member-desktop-1440.png'},
];

for(const candidate of accounts)test(`${candidate.kind}可通过正式登录弹窗建立预览会话`,async({page})=>{
 expect(candidate.account,`${candidate.kind}账号未配置`).toBeTruthy();
 expect(candidate.password,`${candidate.kind}密码未配置`).toBeTruthy();
 await page.addInitScript(()=>sessionStorage.setItem('aiai:intro-seen','yes'));
 await page.goto('/account/login?returnTo=%2Fmembership');
 await page.getByPlaceholder('请输入账号').fill(candidate.account!);
 await page.getByPlaceholder('请输入密码').fill(candidate.password!);
 await page.getByRole('button',{name:'登录',exact:true}).last().click();
 await expect(page).toHaveURL(/\/membership$/);
 await expect(page.getByRole('heading',{name:'爱爱短剧 畅看会员'})).toBeVisible();
 await page.reload();
 await expect(page.getByRole('heading',{name:'爱爱短剧 畅看会员'})).toBeVisible();
 await page.goto('/me');
 await expect(page.getByRole('heading',{name:candidate.account!,exact:true})).toBeVisible();
 await expect(page.getByText(/体验账号/)).toHaveCount(0);
 const headerAvatar=page.locator(`.account-avatar-link .user-avatar--${candidate.avatar}`);
 await expect(headerAvatar).toBeVisible();
 await expect(headerAvatar.locator('.user-avatar-badge')).toHaveCount(candidate.avatar==='member'?1:0);
 await expect(headerAvatar.locator('.user-avatar-initial')).toHaveText('A');
 await page.screenshot({path:`docs/auth-modal/${candidate.screenshot}`});
 if(candidate.avatar==='free'){
  await page.goto('/me/profile');const profileNavWidth=(await page.getByRole('navigation',{name:'个人中心导航'}).boundingBox())!.width;
  await page.screenshot({path:'docs/auth-modal/profile-avatar-desktop-1440.png'});
  await page.locator('input[type="file"]').setInputFiles({name:'avatar.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64')});
  await expect(page.locator('header .user-avatar-image')).toBeVisible();
  await page.getByRole('button',{name:'恢复默认'}).click();await expect(page.locator('header .user-avatar-initial')).toHaveText('A');
  await page.goto('/me/history');const historyNavWidth=(await page.getByRole('navigation',{name:'个人中心导航'}).boundingBox())!.width;
  expect(Math.abs(profileNavWidth-historyNavWidth)).toBeLessThanOrEqual(1);
 }else{
  await page.locator('header').getByRole('link',{name:'会员中心'}).click();
  await expect(page.locator('.membership-account .membership-status')).toContainText('尊享会员');
  await expect(page.getByRole('heading',{name:'爱爱短剧 畅看会员'})).toBeVisible();
  await page.screenshot({path:'docs/auth-modal/member-center-desktop-1440.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});await page.reload();expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);await page.screenshot({path:'docs/auth-modal/member-center-mobile-390.png',fullPage:true});
  await page.goto('/me');await page.locator('a[href="/membership"]').first().click();await expect(page.locator('.membership-account .membership-status')).toContainText('尊享会员');
 }
});

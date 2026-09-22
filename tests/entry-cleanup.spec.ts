import {test, expect} from '@playwright/test';

test('removed discovery pages and shared festival artwork', async ({page}) => {
  await page.addInitScript(() => sessionStorage.setItem('aiai:intro-seen', 'yes'));
  await page.goto('/');
  await expect(page.getByRole('navigation', {name: '主导航'}).locator('a')).toHaveText(['首页', '真人短剧', 'AI漫剧', '18+专区']);
  await expect(page.locator('.discovery-links,.campaign-section')).toHaveCount(0);
  await expect(page.getByRole('link', {name: '排行榜'})).toHaveCount(0);
  await expect(page.locator('.hero-festival .festival-title-art')).toHaveAttribute('src', /aiai-festival-kv-complete-v6\.png$/);
  await expect(page.locator('.festival-strip .festival-title-art')).toHaveAttribute('src', /aiai-festival-kv-complete-v6\.png$/);

  for (const route of ['/free', '/rankings', '/collections', '/collections/everyday-light']) {
    await page.goto(route);
    await expect(page.getByRole('heading', {name: '没有找到这个页面'})).toBeVisible();
  }

  await page.goto('/18plus');
  await page.getByRole('checkbox', {name: '我已年满18周岁'}).check();
  await page.getByRole('button', {name: '确认并进入'}).click();
  await expect(page.locator('.adult-festival-art .festival-title-art')).toHaveAttribute('src', /aiai-festival-kv-complete-v6\.png$/);
  await expect(page.locator('.adult-cinema-thumb .festival-title-art').first()).toHaveAttribute('src', /aiai-festival-kv-complete-v6\.png$/);
});

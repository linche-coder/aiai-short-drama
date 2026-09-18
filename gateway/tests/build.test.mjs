import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderPage, validateConfig, root } from '../scripts/build.mjs';
import { join } from 'node:path';

const template = await readFile(join(root, 'src/index.html'), 'utf8');
const config = JSON.parse(await readFile(join(root, 'src/lines.json'), 'utf8'));
const fixture = () => ({ ...structuredClone(config), lines: config.lines.map((line, i) => ({ ...line, url: `https://route${i + 1}.example.com/path?source=test#home` })) });

test('预览为 6 个有键盘焦点但无有效链接的明确占位卡片', () => {
  const html = renderPage(config, template);
  assert.equal((html.match(/class="line-card"/g) || []).length, 6);
  assert.equal((html.match(/aria-disabled="true" tabindex="0"/g) || []).length, 6);
  assert.equal((html.match(/地址待配置 · 暂未开放/g) || []).length, 6);
  assert.doesNotMatch(html, /<a[^>]*href=|好故事，一眼入戏|<audio/);
});
test('配置地址生成不依赖 JS 的同标签页原生链接', () => {
  const html = renderPage(fixture(), template);
  assert.equal((html.match(/target="_self"/g) || []).length, 6);
  assert.match(html, /https:\/\/route1.example.com\/path\?source=test#home/);
  assert.doesNotMatch(html, /aria-disabled|onclick|entry=aiai/);
});
test('入口标记仅显式启用后添加，并保留原查询与 hash', () => {
  const input = fixture(); input.entryMarker.enabled = true;
  const html = renderPage(input, template);
  assert.match(html, /source=test&amp;entry=aiai-gateway#home/);
});
test('配置内容正确转义且拒绝非 HTTP(S) 协议', () => {
  const input = fixture(); input.lines[0].name = '<script>"&';
  assert.match(renderPage(input, template), /&lt;script&gt;&quot;&amp;/);
  input.lines[0].url = 'javascript:alert(1)';
  assert.throws(() => validateConfig(input), /HTTP/);
});
test('正式构建阻止遗漏地址、测试域名或未确认的部署域名', () => {
  assert.throws(() => validateConfig(config, true), /填写所有/);
  assert.throws(() => validateConfig(fixture(), true), /测试或占位/);
  const input = fixture(); input.lines = input.lines.slice(0, 5);
  assert.throws(() => validateConfig(input), /6 条线路/);
});

import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';

export const root = fileURLToPath(new URL('../', import.meta.url));
const escape = (value) => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function validateConfig(config, release = false) {
  if (!Array.isArray(config.lines) || config.lines.length !== 6) throw new Error('请配置且仅配置 6 条线路。');
  for (const line of config.lines) {
    if (typeof line.name !== 'string' || !line.name.trim()) throw new Error('线路名称不能为空。');
    if (line.url === null && !release) continue;
    if (typeof line.url !== 'string' || !line.url.trim()) throw new Error('正式发布前必须填写所有线路地址。');
    const url = new URL(line.url);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('线路必须为不含账号密码的 HTTP(S) 地址。');
    if (release && /(^|\.)(example\.(com|org|net)|test|invalid|localhost)$/.test(url.hostname)) throw new Error('正式发布不能使用测试或占位域名。');
  }
  if (config.entryMarker?.enabled && (!config.entryMarker.parameter || !config.entryMarker.value)) throw new Error('入口标记需要参数名和值。');
  if (release) {
    if (!config.deploymentOrigin) throw new Error('正式发布前必须确认部署域名。');
    const origin = new URL(config.deploymentOrigin);
    if (origin.protocol !== 'https:' || origin.origin !== config.deploymentOrigin) throw new Error('部署域名请填写 HTTPS origin，不带末尾斜杠或路径。');
  }
}

export function renderPage(config, template, { release = false } = {}) {
  validateConfig(config, release);
  const cards = config.lines.map((line, index) => {
    const configured = line.url !== null;
    let href = line.url;
    if (configured && config.entryMarker?.enabled) {
      const target = new URL(line.url);
      target.searchParams.set(config.entryMarker.parameter, config.entryMarker.value);
      href = target.href;
    }
    const attributes = configured
      ? `href="${escape(href)}" target="_self"`
      : 'role="link" aria-disabled="true" tabindex="0"';
    return `      <li class="line-item" style="--index:${index}">
        <a class="line-card" ${attributes} aria-labelledby="line-${index}-name line-${index}-url">
          <span class="line-copy">
            <span class="line-name" id="line-${index}-name">${escape(line.name)}</span>
            <span class="line-url" id="line-${index}-url">${configured ? escape(line.url) : '地址待配置 · 暂未开放'}</span>
          </span>
          <span class="line-arrow" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></span>
        </a>
      </li>`;
  }).join('\n');
  return template.replace('<!-- LINES -->', cards).replace('<!-- ROBOTS -->', release ? '' : '<meta name="robots" content="noindex, nofollow">');
}

export async function build({ release = false } = {}) {
  const config = JSON.parse(await readFile(join(root, 'src/lines.json'), 'utf8'));
  const template = await readFile(join(root, 'src/index.html'), 'utf8');
  const html = renderPage(config, template, { release });
  const out = join(root, 'dist');
  await mkdir(join(out, 'assets'), { recursive: true });
  await writeFile(join(out, 'index.html'), html);
  for (const file of ['styles.css', 'particles.js']) await copyFile(join(root, 'src', file), join(out, file));
  await copyFile(join(root, 'public/assets/logo.svg'), join(out, 'assets/logo.svg'));
  return out;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await build({ release: process.argv.includes('--release') });
  console.log('静态页面已生成至 dist/');
}

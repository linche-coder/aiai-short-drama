import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { build, root } from './build.mjs';

const production = process.argv.includes('--dist');
const port = Number(process.env.PORT || 4188);
const output = resolve(root, 'dist');
if (!production) await build();
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml' };
createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (!production && pathname === '/') await build();
    const path = resolve(output, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!path.startsWith(output + sep)) { res.writeHead(403).end(); return; }
    const file = await readFile(path);
    res.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(file);
  } catch { res.writeHead(404).end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log(`爱爱短剧预览：http://127.0.0.1:${port}`));

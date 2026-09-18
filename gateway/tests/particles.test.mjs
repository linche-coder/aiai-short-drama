import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../src/particles.js', import.meta.url), 'utf8');

function environment({ reduced = false, noCanvas = false, mobile = false } = {}) {
  const listeners = new Map();
  let scheduled = 0;
  let drawn = 0;
  const context = new Proxy({}, { get: (_, key) => {
    if (key === 'createRadialGradient') return () => ({ addColorStop() {} });
    return () => { if (key === 'arc') drawn++; };
  }, set: () => true });
  const canvas = () => ({ getContext: () => noCanvas ? null : context });
  const ring = canvas();
  const preference = { matches: reduced, addEventListener: (_, fn) => listeners.set('motion', fn) };
  const document = {
    hidden: false,
    querySelector: selector => ({
      '.brand-particles': ring,
      '.brand-scene': { getBoundingClientRect: () => ({ width: mobile ? 324 : 560, height: 206, left: 0, top: 0 }) },
      '.pointer-glow': { style: { setProperty() {} } },
    })[selector],
    createElement: canvas,
    documentElement: { addEventListener() {} },
    addEventListener: (name, fn) => listeners.set(name, fn),
  };
  const sandbox = {
    document, window: { addEventListener() {} }, console,
    matchMedia: query => query.includes('reduced') ? preference : { matches: true },
    innerWidth: mobile ? 360 : 1440, innerHeight: 900, devicePixelRatio: 2,
    performance: { now: () => 0 },
    requestAnimationFrame: () => ++scheduled,
    cancelAnimationFrame() {},
    IntersectionObserver: class { observe() {} },
  };
  vm.runInNewContext(source, sandbox);
  return { document, listeners, preference, scheduled: () => scheduled, drawn: () => drawn, ring };
}

test('Canvas 不可用时不抛出异常、不调度动画', () => {
  const env = environment({ noCanvas: true });
  assert.equal(env.scheduled(), 0);
});
test('减少动态效果仅绘制静态帧；偏好改变后恢复动画', () => {
  const env = environment({ reduced: true });
  assert.ok(env.drawn() > 0);
  assert.equal(env.scheduled(), 0);
  env.preference.matches = false; env.listeners.get('motion')();
  assert.equal(env.scheduled(), 1);
});
test('切到后台不再调度新帧；回到前台恢复', () => {
  const env = environment();
  assert.equal(env.scheduled(), 1);
  env.document.hidden = true; env.listeners.get('visibilitychange')();
  assert.equal(env.scheduled(), 1);
  env.document.hidden = false; env.listeners.get('visibilitychange')();
  assert.equal(env.scheduled(), 2);
});
test('手机绘制的粒子数和像素密度低于桌面', () => {
  const desktop = environment(), mobile = environment({ mobile: true });
  assert.ok(mobile.drawn() < desktop.drawn() / 2);
  assert.equal(mobile.ring.width, 435);
  assert.equal(desktop.ring.width, 1022);
});

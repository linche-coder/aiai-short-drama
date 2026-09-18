// Adapted from 0912-爱爱短剧/src/motion/introParticles.ts:
// Same seeded orbital dust, layered elliptical geometry and brand palette; dots only.
// The gateway keeps the orbit running and removes the intro's collapse/welcome timeline.
function startParticles() {
  const ring = document.querySelector('.brand-particles');
  const scene = document.querySelector('.brand-scene');
  const glow = document.querySelector('.pointer-glow');
  const ringContext = ring.getContext('2d');
  if (!ringContext) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  let seed = 421;
  const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const colors = ['247,133,198', '183,132,255', '255,149,101'];
  const sprites = colors.map(color => {
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 40;
    const c = sprite.getContext('2d');
    if (!c) return null;
    const gradient = c.createRadialGradient(20, 20, 0, 20, 20, 20);
    gradient.addColorStop(0, `rgba(${color},.4)`);
    gradient.addColorStop(.22, `rgba(${color},.15)`);
    gradient.addColorStop(1, `rgba(${color},0)`);
    c.fillStyle = gradient;
    c.fillRect(0, 0, 40, 40);
    return sprite;
  });
  const dust = Array.from({ length: 210 }, (_, i) => ({
    angle: random() * Math.PI * 2, radius: .89 + random() * .22,
    speed: .065 + random() * .1, size: .45 + random() ** 2 * 1.15,
    depth: random(),
    color: i % 13 === 0 ? 2 : i % 3 === 0 ? 1 : 0,
  }));
  let sw = 0, sh = 0, mobile = false;
  let sceneRect = scene.getBoundingClientRect();
  let sceneVisible = true, frame = 0, last = 0, elapsed = 0;
  const pointer = { x: -2000, y: -2000 };
  const follow = { x: 280, y: 103 };

  function fit(canvas, context, w, h) {
    const dpr = Math.min(devicePixelRatio || 1, mobile ? 1.25 : 1.75);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function resize() {
    mobile = innerWidth <= 600;
    sceneRect = scene.getBoundingClientRect(); sw = sceneRect.width; sh = sceneRect.height;
    // A 12px transparent drawing margin preserves the full particle halos.
    fit(ring, ringContext, sw + 24, sh + 24);
    ringContext.translate(12, 12);
    draw();
  }
  function displace(x, y, offsetX = 0, offsetY = 0) {
    if (mobile || reduced.matches || !finePointer.matches) return { x, y };
    const dx = x + offsetX - pointer.x, dy = y + offsetY - pointer.y;
    const distance = Math.hypot(dx, dy);
    const force = Math.max(0, 1 - distance / 110) * 7;
    return { x: x + dx / (distance || 1) * force, y: y + dy / (distance || 1) * force };
  }
  function dot(c, p, x, y, alpha, size) {
    c.globalAlpha = alpha;
    if (sprites[p.color]) c.drawImage(sprites[p.color], x - size * 5, y - size * 5, size * 10, size * 10);
    c.fillStyle = `rgb(${colors[p.color]})`;
    c.beginPath(); c.arc(x, y, size, 0, Math.PI * 2); c.fill();
    c.globalAlpha = 1;
  }
  function draw() {
    const time = reduced.matches ? 0 : elapsed;
    if (sceneVisible) {
      ringContext.clearRect(-12, -12, sw + 24, sh + 24);
      const count = mobile ? 100 : 210;
      const rx = sw * .414, ry = sh * .31;
      for (let i = 0; i < count; i++) {
        const p = dust[i];
        const angle = p.angle + time * p.speed;
        const point = a => displace(sw / 2 + Math.cos(a) * rx * p.radius,
          sh / 2 + Math.sin(a) * ry * p.radius + Math.cos(a) * rx * .075 * p.radius,
          sceneRect.left, sceneRect.top);
        const { x, y } = point(angle);
        const alpha = (.22 + p.depth * .53) * (.85 + .15 * Math.sin(time * .6 + p.angle));
        dot(ringContext, p, x, y, alpha, p.size * (.8 + .25 * Math.sin(angle)));
      }
    }
    if (!mobile && !reduced.matches && finePointer.matches) {
      const targetX = Math.max(sw * .2, Math.min(sw * .8, pointer.x < 0 ? sw / 2 : pointer.x - sceneRect.left));
      const targetY = Math.max(sh * .2, Math.min(sh * .8, pointer.y < 0 ? sh / 2 : pointer.y - sceneRect.top));
      follow.x += (targetX - follow.x) * .065;
      follow.y += (targetY - follow.y) * .065;
      // Move a fully feathered light instead of moving its center against a crop.
      glow.style.setProperty('--glow-x', `${Math.max(-12, Math.min(12, (follow.x - sw / 2) * .07))}px`);
      glow.style.setProperty('--glow-y', `${Math.max(-6, Math.min(6, (follow.y - sh / 2) * .1))}px`);
    }
  }
  function tick(now) {
    if (document.hidden || reduced.matches) { frame = 0; return; }
    if (now - last >= (mobile ? 1000 / 30 : 1000 / 45)) {
      elapsed += Math.min((now - last) / 1000, .06);
      last = now;
      draw();
    }
    frame = requestAnimationFrame(tick);
  }
  function restart() {
    cancelAnimationFrame(frame); frame = 0; last = performance.now();
    if (document.hidden) return;
    draw();
    if (!reduced.matches) frame = requestAnimationFrame(tick);
  }
  window.addEventListener('pointermove', event => { pointer.x = event.clientX; pointer.y = event.clientY; }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { pointer.x = pointer.y = -2000; });
  window.addEventListener('scroll', () => { sceneRect = scene.getBoundingClientRect(); }, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', restart);
  reduced.addEventListener('change', restart);
  new IntersectionObserver(entries => { sceneVisible = entries[0].isIntersecting; }).observe(scene);
  resize(); restart();
}

// Decoration is optional: links are native anchors already present in the HTML.
try { startParticles(); } catch (error) { console.warn('粒子效果未启用，线路访问不受影响。', error); }

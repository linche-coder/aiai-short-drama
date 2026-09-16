import timeline from './introTimeline.json' with { type: 'json' };

export function introGeometry(width: number, height: number) {
  const logoWidth = Math.min(410, width * .66, height * .95);
  return { width: logoWidth, x: width / 2, y: height * .43,
    rx: Math.min(320, width * .41, height * .58), ry: Math.min(155, width * .23, height * .25) };
}

/** Seeded layered orbital dust; each particle spirals inward on its own clock. */
export function createIntroParticles(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d');
  let width = 0, height = 0;
  let seed = 421;
  const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const particles = Array.from({ length: 280 }, (_, i) => ({
    angle: random() * Math.PI * 2, radius: .89 + random() * .22,
    speed: .11 + random() * .16, size: .75 + random() ** 2 * 2.15,
    depth: random(), delay: random() * 170, trail: i % 9 === 0,
    color: i % 13 === 0 ? '255,149,101' : i % 3 === 0 ? '183,132,255' : '247,133,198',
  }));
  const resize = () => {
    width = innerWidth; height = innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, width < 600 ? 1.5 : 2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    context?.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  return {
    resize,
    draw(waitSeconds: number, elapsed: number | null, reduced: boolean) {
      if (!context) return;
      const c = context, g = introGeometry(width, height);
      c.clearRect(0, 0, width, height);
      if (elapsed !== null && elapsed >= timeline.gather) return;
      const count = width < 600 ? 144 : 280;
      for (const p of particles.slice(0, count)) {
        const collapse = elapsed === null || reduced ? 0 : Math.max(0, Math.min(1,
          (elapsed - timeline.accelerate - p.delay) / (timeline.gather - timeline.accelerate - p.delay)));
        const radius = p.radius * (1 - collapse ** 1.65);
        const acceleration = elapsed === null || reduced ? 0 : elapsed / 1000;
        const angle = p.angle + (reduced ? 0 : waitSeconds * p.speed) + acceleration ** 1.6 * (2.4 + p.depth) + collapse * 1.2;
        const point = (a: number) => ({ x: g.x + Math.cos(a) * g.rx * radius,
          y: g.y + Math.sin(a) * g.ry * radius + Math.cos(a) * g.rx * .075 * radius });
        const { x, y } = point(angle);
        const alpha = (.3 + p.depth * .6) * (1 - collapse ** 4);
        const size = p.size * (.8 + .25 * Math.sin(angle));
        // A very small radial halo avoids large expensive canvas shadow blurs.
        const glow = c.createRadialGradient(x, y, 0, x, y, size * 4);
        glow.addColorStop(0, `rgba(${p.color},${alpha * .24})`); glow.addColorStop(1, `rgba(${p.color},0)`);
        c.fillStyle = glow; c.fillRect(x - size * 4, y - size * 4, size * 8, size * 8);
        if (p.trail) {
          const tail = point(angle - .028 - acceleration * .05);
          c.beginPath(); c.moveTo(tail.x, tail.y); c.lineTo(x, y);
          c.strokeStyle = `rgba(${p.color},${alpha * .38})`; c.lineWidth = size * .65; c.stroke();
        }
        c.beginPath(); c.arc(x, y, size, 0, Math.PI * 2);
        c.fillStyle = `rgba(${p.color},${alpha})`; c.fill();
      }
    },
  };
}

// labgfx.js — richer dark-canvas helpers for the "Lab" showcase interactives.
//
// Builds on the shared, verified bloch.js projection/camera and adds: a shaded
// 3D-looking sphere, glowing strokes/dots, a rAF loop helper, easing and a tiny
// RNG. Dark-native (the showcase theme is fixed dark). Site code, so Date.now /
// Math.random are fine here (the ban on those is workflow-script only).

import { fitCanvas, makeCamera, attachDrag, projectBloch, scaleFor } from './bloch.js';
import { prefersReducedMotion, lerp } from './scrolly.js';

export { fitCanvas, makeCamera, attachDrag, projectBloch, scaleFor, prefersReducedMotion, lerp };

export const LAB = {
  bg: '#0b0e16',
  panel: '#0f1320',
  grid: '#2a3556',
  ink: '#e7e9f0',
  dim: '#9aa3bd',
  accent: '#8b93f8',
  accentBright: '#c2c8ff',
  teal: '#34e7c9',
  amber: '#fbbf24',
  rose: '#fb7185',
};

export function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
export function easeOutCubic(t) { t = clamp(t, 0, 1); return 1 - Math.pow(1 - t, 3); }
export function easeInOutCubic(t) { t = clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
export function rand(a = 1, b) { return b === undefined ? Math.random() * a : a + Math.random() * (b - a); }

// A glowing stroke. `path` issues only moveTo/lineTo/arc; we own begin/stroke.
export function glowStroke(ctx, color, width, blur, path) {
  ctx.save();
  ctx.shadowColor = color; ctx.shadowBlur = blur;
  ctx.strokeStyle = color; ctx.lineWidth = width;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); path(); ctx.stroke();
  ctx.restore();
}

export function glowDot(ctx, x, y, r, color, blur = 12) {
  ctx.save();
  ctx.shadowColor = color; ctx.shadowBlur = blur;
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// requestAnimationFrame loop. fn(dt, t) in seconds; dt clamped for tab-switches.
export function rafLoop(fn) {
  let raf = 0, last = 0, running = false;
  function frame(ts) {
    if (!running) return;
    const t = ts / 1000;
    const dt = last ? Math.min(0.05, t - last) : 0;
    last = t;
    fn(dt, t);
    raf = requestAnimationFrame(frame);
  }
  return {
    start() { if (running) return; running = true; last = 0; raf = requestAnimationFrame(frame); },
    stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; },
    get running() { return running; },
  };
}

// Shaded Bloch sphere: a volume disc + depth-faded indigo lat/long grid + a
// glowing equator + pole labels. cam is {yaw,pitch}; pal is a LAB-like palette.
export function drawLabSphere(ctx, cam, w, h, pal) {
  const s = scaleFor(w, h);
  const cx = w / 2, cy = h / 2;

  // Volume: an off-centre radial gradient reads as a lit ball.
  const g = ctx.createRadialGradient(cx - s * 0.32, cy - s * 0.34, s * 0.08, cx, cy, s * 1.08);
  g.addColorStop(0, 'rgba(86,98,160,0.55)');
  g.addColorStop(0.55, 'rgba(30,38,70,0.34)');
  g.addColorStop(1, 'rgba(8,10,18,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy, s * 1.04, 0, Math.PI * 2); ctx.fill();

  // Rim.
  ctx.save();
  ctx.strokeStyle = 'rgba(150,160,235,0.16)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, s, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();

  const depthAlpha = (z) => 0.10 + 0.5 * ((z + 1) / 2);
  function ring(pointFn, color, glow) {
    const N = 84; let prev = null;
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2;
      const p = projectBloch(pointFn(a), cam, w, h, s);
      if (prev) {
        ctx.save();
        if (glow) { ctx.shadowColor = color; ctx.shadowBlur = 6; }
        ctx.strokeStyle = color;
        ctx.globalAlpha = depthAlpha((prev.z + p.z) / 2);
        ctx.lineWidth = glow ? 1.6 : 1;
        ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(p.x, p.y); ctx.stroke();
        ctx.restore();
      }
      prev = p;
    }
    ctx.globalAlpha = 1;
  }

  // Latitudes (z = const) and longitudes (meridians).
  for (let k = -2; k <= 2; k++) {
    const zz = k / 3, r = Math.sqrt(Math.max(0, 1 - zz * zz));
    ring((a) => ({ x: r * Math.cos(a), y: r * Math.sin(a), z: zz }), pal.grid, false);
  }
  for (let m = 0; m < 6; m++) {
    const ph = (m / 6) * Math.PI;
    ring((a) => ({ x: Math.sin(a) * Math.cos(ph), y: Math.sin(a) * Math.sin(ph), z: Math.cos(a) }), pal.grid, false);
  }
  // Equator, glowing.
  ring((a) => ({ x: Math.cos(a), y: Math.sin(a), z: 0 }), pal.accent, true);

  // Pole labels.
  const top = projectBloch({ x: 0, y: 0, z: 1.2 }, cam, w, h, s);
  const bot = projectBloch({ x: 0, y: 0, z: -1.2 }, cam, w, h, s);
  ctx.fillStyle = pal.dim;
  ctx.font = `${Math.max(11, Math.round(w * 0.03))}px ui-monospace, monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('|0⟩', top.x, top.y);
  ctx.fillText('|1⟩', bot.x, bot.y);
}

// Glowing state-vector arrow from origin to Bloch point v.
export function drawLabArrow(ctx, cam, w, h, v, pal, color) {
  const s = scaleFor(w, h);
  const col = color || pal.accentBright;
  const O = projectBloch({ x: 0, y: 0, z: 0 }, cam, w, h, s);
  const T = projectBloch(v, cam, w, h, s);

  glowStroke(ctx, col, 3, 14, () => { ctx.moveTo(O.x, O.y); ctx.lineTo(T.x, T.y); });

  const near = projectBloch({ x: v.x * 0.84, y: v.y * 0.84, z: v.z * 0.84 }, cam, w, h, s);
  const dx = T.x - near.x, dy = T.y - near.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const hs = Math.max(7, s * 0.1);
  ctx.save();
  ctx.shadowColor = col; ctx.shadowBlur = 12; ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(T.x, T.y);
  ctx.lineTo(T.x - hs * ux - hs * 0.5 * uy, T.y - hs * uy + hs * 0.5 * ux);
  ctx.lineTo(T.x - hs * ux + hs * 0.5 * uy, T.y - hs * uy - hs * 0.5 * ux);
  ctx.closePath(); ctx.fill();
  ctx.restore();

  glowDot(ctx, T.x, T.y, 3.4, '#ffffff', 10);
}

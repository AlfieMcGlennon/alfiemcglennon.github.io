// labgfx.js — richer canvas helpers for the "Lab" interactives, PALETTE-DRIVEN.
//
// Builds on the shared, verified bloch.js projection/camera and adds a shaded
// sphere, (optionally) glowing strokes/dots, a rAF loop, easing and a tiny RNG.
// It reads the site's CSS tokens so the SAME component renders warm/light on the
// parchment site and dark+glowing in the dark showcase (which sets --lab-glow):
//   light  : --lab-glow unset -> 0 -> crisp ink line-art on parchment
//   dark   : body.showcase sets --lab-glow:14 etc -> glowing on slate
// Site code, so Date.now / Math.random are fine here (the ban is workflow-only).

import { fitCanvas, makeCamera, attachDrag, projectBloch, scaleFor } from './bloch.js';
import { prefersReducedMotion, lerp } from './scrolly.js';

export { fitCanvas, makeCamera, attachDrag, projectBloch, scaleFor, prefersReducedMotion, lerp };

export function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
export function easeOutCubic(t) { t = clamp(t, 0, 1); return 1 - Math.pow(1 - t, 3); }
export function easeInOutCubic(t) { t = clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
export function rand(a = 1, b) { return b === undefined ? Math.random() * a : a + Math.random() * (b - a); }

// #rgb / #rrggbb (or any CSS colour that already has alpha) -> rgba string.
export function hexA(hex, a) {
  if (typeof hex !== 'string') return `rgba(67,56,202,${a})`;
  let h = hex.trim();
  if (h[0] !== '#') return h; // already rgb()/named — return as-is (alpha ignored)
  h = h.slice(1);
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return `rgba(${r},${g},${b},${a})`;
}

// Read the live theme. Defaults are the warm parchment tokens; --lab-* let the
// dark showcase override grid/glow/accent without touching component code.
export function labPalette(el = document.documentElement) {
  const css = getComputedStyle(el);
  const g = (n, f) => (css.getPropertyValue(n).trim() || f);
  const accent = g('--accent', '#4338ca');
  return {
    surface: g('--bg-raised', '#f7f6f2'),
    ink: g('--ink', '#1c1917'),
    dim: g('--ink-muted', '#78716c'),
    grid: g('--lab-grid', g('--rule', '#ddd8d0')),
    accent,
    accentBright: g('--lab-accent-bright', accent),
    teal: g('--teal', '#0f766e'),
    amber: g('--amber', '#b45309'),
    glow: parseFloat(g('--lab-glow', '0')) || 0, // shadow-blur px; 0 in light
  };
}

// A stroke that glows only when blur > 0 (dark showcase); crisp otherwise.
export function glowStroke(ctx, color, width, blur, path) {
  ctx.save();
  if (blur > 0) { ctx.shadowColor = color; ctx.shadowBlur = blur; }
  ctx.strokeStyle = color; ctx.lineWidth = width;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); path(); ctx.stroke();
  ctx.restore();
}

export function glowDot(ctx, x, y, r, color, blur = 0) {
  ctx.save();
  if (blur > 0) { ctx.shadowColor = color; ctx.shadowBlur = blur; }
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

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

// Shaded sphere: a soft accent bloom for volume, depth-faded grid, a stronger
// equator, pole labels. Reads everything from `pal` so it adapts to the theme.
export function drawLabSphere(ctx, cam, w, h, pal) {
  const s = scaleFor(w, h);
  const cx = w / 2, cy = h / 2;
  const glassy = pal.glow > 0;

  const g = ctx.createRadialGradient(cx - s * 0.32, cy - s * 0.34, s * 0.08, cx, cy, s * 1.08);
  g.addColorStop(0, hexA(pal.accent, glassy ? 0.42 : 0.14));
  g.addColorStop(0.55, hexA(pal.accent, glassy ? 0.20 : 0.05));
  g.addColorStop(1, hexA(pal.accent, 0));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy, s * 1.04, 0, Math.PI * 2); ctx.fill();

  ctx.save();
  ctx.strokeStyle = hexA(pal.ink, glassy ? 0.16 : 0.12); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, s, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();

  const depthAlpha = (z) => 0.12 + 0.5 * ((z + 1) / 2);
  function ring(pointFn, color, glow) {
    const N = 84; let prev = null;
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2;
      const p = projectBloch(pointFn(a), cam, w, h, s);
      if (prev) {
        ctx.save();
        if (glow && pal.glow > 0) { ctx.shadowColor = color; ctx.shadowBlur = 6; }
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

  for (let k = -2; k <= 2; k++) {
    const zz = k / 3, r = Math.sqrt(Math.max(0, 1 - zz * zz));
    ring((a) => ({ x: r * Math.cos(a), y: r * Math.sin(a), z: zz }), pal.grid, false);
  }
  for (let m = 0; m < 6; m++) {
    const ph = (m / 6) * Math.PI;
    ring((a) => ({ x: Math.sin(a) * Math.cos(ph), y: Math.sin(a) * Math.sin(ph), z: Math.cos(a) }), pal.grid, false);
  }
  ring((a) => ({ x: Math.cos(a), y: Math.sin(a), z: 0 }), pal.accent, true);

  const top = projectBloch({ x: 0, y: 0, z: 1.2 }, cam, w, h, s);
  const bot = projectBloch({ x: 0, y: 0, z: -1.2 }, cam, w, h, s);
  ctx.fillStyle = pal.dim;
  ctx.font = `${Math.max(11, Math.round(w * 0.03))}px ui-monospace, monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('|0⟩', top.x, top.y);
  ctx.fillText('|1⟩', bot.x, bot.y);
}

// Glowing/crisp state-vector arrow from origin to Bloch point v.
export function drawLabArrow(ctx, cam, w, h, v, pal, color) {
  const s = scaleFor(w, h);
  const col = color || pal.accent;
  const O = projectBloch({ x: 0, y: 0, z: 0 }, cam, w, h, s);
  const T = projectBloch(v, cam, w, h, s);

  glowStroke(ctx, col, 3, pal.glow, () => { ctx.moveTo(O.x, O.y); ctx.lineTo(T.x, T.y); });

  const near = projectBloch({ x: v.x * 0.84, y: v.y * 0.84, z: v.z * 0.84 }, cam, w, h, s);
  const dx = T.x - near.x, dy = T.y - near.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const hs = Math.max(7, s * 0.1);
  ctx.save();
  if (pal.glow > 0) { ctx.shadowColor = col; ctx.shadowBlur = pal.glow; }
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(T.x, T.y);
  ctx.lineTo(T.x - hs * ux - hs * 0.5 * uy, T.y - hs * uy + hs * 0.5 * ux);
  ctx.lineTo(T.x - hs * ux + hs * 0.5 * uy, T.y - hs * uy - hs * 0.5 * ux);
  ctx.closePath(); ctx.fill();
  ctx.restore();

  glowDot(ctx, T.x, T.y, 3.2, pal.glow > 0 ? '#ffffff' : col, pal.glow);
}

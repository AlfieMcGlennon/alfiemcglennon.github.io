// bloch.js — shared, dependency-free 2D-canvas line-art Bloch sphere.
//
// Used by the single-qubit toys (QubitBloch, BlochFlatten, RotationSim). It is
// light-theme native: it draws ink/rule line art on a parchment canvas using
// the site's real tokens, NOT the dark canvas of the older copula toys. The
// projection mirrors the proven approach in TrivariateCopula.astro (yaw about
// the vertical, pitch tilt, orthographic), but attachDrag returns a detach()
// so re-initialisation on client navigation does not leak window listeners.
//
// Coordinate convention: a Bloch vector v = {x: <X>, y: <Y>, z: <Z>} with the
// z-axis vertical (|0> at the top pole, |1> at the bottom). Pure states have
// |v| = 1; an entangled qubit's reduced vector sits inside the sphere.

function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

export const DEFAULT_PALETTE = {
  ink: '#1c1917',
  rule: '#ddd8d0',
  muted: '#78716c',
  accent: '#4338ca', // quantum indigo for the state vector
  amber: '#b45309',
  teal: '#0f766e',
  surface: '#f7f6f2',
};

// Read the site's CSS custom properties so the toy tracks the real theme.
export function paletteFromCSS(el = document.documentElement) {
  const css = getComputedStyle(el);
  const get = (name, fallback) => (css.getPropertyValue(name).trim() || fallback);
  return {
    ink: get('--ink', DEFAULT_PALETTE.ink),
    rule: get('--rule', DEFAULT_PALETTE.rule),
    muted: get('--ink-muted', DEFAULT_PALETTE.muted),
    accent: get('--arrow', DEFAULT_PALETTE.accent),
    amber: get('--amber', DEFAULT_PALETTE.amber),
    teal: get('--teal', DEFAULT_PALETTE.teal),
    surface: get('--bg-raised', DEFAULT_PALETTE.surface),
  };
}

export function makeCamera(yaw = -0.62, pitch = 0.5) {
  return { yaw, pitch };
}

// DPR-aware sizing. Returns CSS pixel {w, h}; sets the backing store + transform.
export function fitCanvas(canvas, ctx) {
  const r = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(1, Math.round(r.width));
  const h = Math.max(1, Math.round(r.height));
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { w, h };
}

// Project a draw-space point (y vertical, z depth) to screen + depth.
function projectRaw(x, y, z, cam, w, h, scale) {
  const cr = Math.cos(cam.yaw), sr = Math.sin(cam.yaw);
  let px = x * cr - z * sr;
  let pz = x * sr + z * cr;
  const ct = Math.cos(cam.pitch), st = Math.sin(cam.pitch);
  const py = y * ct - pz * st;
  pz = y * st + pz * ct;
  return { x: w / 2 + px * scale, y: h / 2 - py * scale, z: pz };
}

// Project a Bloch vector {x,y,z} (z vertical = |0>/|1> axis).
export function projectBloch(v, cam, w, h, scale) {
  return projectRaw(v.x, v.z, v.y, cam, w, h, scale);
}

export function scaleFor(w, h) { return Math.min(w, h) * 0.34; }

// Drag-to-rotate. Mutates cam.yaw/cam.pitch; calls onChange on movement.
// Returns detach() so re-init does not stack listeners.
export function attachDrag(canvas, cam, onChange) {
  let drag = false, lx = 0, ly = 0;
  const point = (e) => {
    const t = (e.touches && e.touches[0]) ? e.touches[0] : e;
    return { x: t.clientX, y: t.clientY };
  };
  const down = (e) => { drag = true; const p = point(e); lx = p.x; ly = p.y; if (e.cancelable) e.preventDefault(); };
  const move = (e) => {
    if (!drag) return;
    const p = point(e);
    cam.yaw += (p.x - lx) * 0.01;
    cam.pitch = clamp(cam.pitch + (p.y - ly) * 0.007, 0.06, 1.45);
    lx = p.x; ly = p.y;
    if (e.cancelable) e.preventDefault();
    if (onChange) onChange();
  };
  const up = () => { drag = false; };
  canvas.addEventListener('mousedown', down);
  window.addEventListener('mousemove', move);
  window.addEventListener('mouseup', up);
  canvas.addEventListener('touchstart', down, { passive: false });
  window.addEventListener('touchmove', move, { passive: false });
  window.addEventListener('touchend', up);
  return function detach() {
    canvas.removeEventListener('mousedown', down);
    window.removeEventListener('mousemove', move);
    window.removeEventListener('mouseup', up);
    canvas.removeEventListener('touchstart', down);
    window.removeEventListener('touchmove', move);
    window.removeEventListener('touchend', up);
  };
}

function ringAlpha(depth) { return 0.18 + 0.5 * clamp((depth + 1) / 2, 0, 1); }

// Draw one great circle, parametrised by pointFn(angle) -> Bloch {x,y,z}.
// alphaMul scales the whole ring (used to fade off-slice rings when flattening).
function drawRing(ctx, cam, w, h, scale, pointFn, colour, alphaMul = 1) {
  if (alphaMul < 0.02) return;
  const N = 72;
  let prev = null;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const p = projectBloch(pointFn(a), cam, w, h, scale);
    if (prev) {
      ctx.strokeStyle = colour;
      ctx.globalAlpha = ringAlpha((prev.z + p.z) / 2) * alphaMul;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
    prev = p;
  }
  ctx.globalAlpha = 1;
}

// The full sphere: three great circles, three axes, basis labels.
// opts.flatten (0..1) fades the equator, the Y-Z meridian, the Y axis and the
// |+i> label, so the sphere visibly collapses onto its X-Z slice.
// opts.clear=false skips the background fill (caller has already cleared).
export function drawSphere(ctx, cam, w, h, palette = DEFAULT_PALETTE, opts = {}) {
  const scale = scaleFor(w, h);
  const flat = clamp(opts.flatten || 0, 0, 1);
  const off = 1 - flat;
  if (opts.clear !== false) {
    ctx.fillStyle = palette.surface;
    ctx.fillRect(0, 0, w, h);
  }

  // Great circles. The X-Z meridian is the slice and stays full; the equator
  // and Y-Z meridian fade out as the sphere is flattened onto the slice.
  drawRing(ctx, cam, w, h, scale, (a) => ({ x: Math.cos(a), y: Math.sin(a), z: 0 }), palette.rule, off);
  drawRing(ctx, cam, w, h, scale, (a) => ({ x: Math.sin(a), y: 0, z: Math.cos(a) }), palette.rule, 1);
  drawRing(ctx, cam, w, h, scale, (a) => ({ x: 0, y: Math.sin(a), z: Math.cos(a) }), palette.rule, off);

  // Axes through the centre (X and Z stay; Y fades with flattening).
  const axes = [
    { a: { x: -1, y: 0, z: 0 }, b: { x: 1, y: 0, z: 0 }, m: 1 },
    { a: { x: 0, y: -1, z: 0 }, b: { x: 0, y: 1, z: 0 }, m: off },
    { a: { x: 0, y: 0, z: -1 }, b: { x: 0, y: 0, z: 1 }, m: 1 },
  ];
  ctx.strokeStyle = palette.muted;
  ctx.lineWidth = 1;
  for (const ax of axes) {
    if (ax.m < 0.02) continue;
    const pa = projectBloch(ax.a, cam, w, h, scale);
    const pb = projectBloch(ax.b, cam, w, h, scale);
    ctx.globalAlpha = 0.45 * ax.m;
    ctx.beginPath();
    ctx.moveTo(pa.x, pa.y);
    ctx.lineTo(pb.x, pb.y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  if (opts.labels !== false) {
    const labels = [
      { p: { x: 0, y: 0, z: 1.18 }, t: '|0⟩', m: 1 },
      { p: { x: 0, y: 0, z: -1.18 }, t: '|1⟩', m: 1 },
      { p: { x: 1.2, y: 0, z: 0 }, t: '|+⟩', m: 1 },
      { p: { x: 0, y: 1.2, z: 0 }, t: '|+i⟩', m: off },
    ];
    ctx.font = `${Math.max(10, Math.round(w * 0.034))}px ui-monospace, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const l of labels) {
      if (l.m < 0.05) continue;
      const p = projectBloch(l.p, cam, w, h, scale);
      ctx.fillStyle = palette.muted;
      ctx.globalAlpha = l.m;
      ctx.fillText(l.t, p.x, p.y);
    }
    ctx.globalAlpha = 1;
  }
}

// Draw the state vector from the origin to Bloch point v, with optional
// theta/phi guide lines (the dashed drop to the equator and the longitude leg).
export function drawStateArrow(ctx, cam, w, h, v, palette = DEFAULT_PALETTE, opts = {}) {
  const scale = scaleFor(w, h);
  const O = projectBloch({ x: 0, y: 0, z: 0 }, cam, w, h, scale);
  const T = projectBloch(v, cam, w, h, scale);

  if (opts.guides) {
    const foot = { x: v.x, y: v.y, z: 0 };
    const pf = projectBloch(foot, cam, w, h, scale);
    ctx.strokeStyle = palette.amber;
    ctx.globalAlpha = 0.7;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(T.x, T.y); ctx.lineTo(pf.x, pf.y); ctx.stroke(); // theta leg
    ctx.beginPath(); ctx.moveTo(O.x, O.y); ctx.lineTo(pf.x, pf.y); ctx.stroke(); // phi leg
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }

  // Shaft.
  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(O.x, O.y);
  ctx.lineTo(T.x, T.y);
  ctx.stroke();

  // Arrowhead, oriented in screen space.
  const near = projectBloch({ x: v.x * 0.86, y: v.y * 0.86, z: v.z * 0.86 }, cam, w, h, scale);
  const dx = T.x - near.x, dy = T.y - near.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const hs = Math.max(6, scale * 0.09);
  ctx.fillStyle = palette.accent;
  ctx.beginPath();
  ctx.moveTo(T.x, T.y);
  ctx.lineTo(T.x - hs * ux - hs * 0.5 * uy, T.y - hs * uy + hs * 0.5 * ux);
  ctx.lineTo(T.x - hs * ux + hs * 0.5 * uy, T.y - hs * uy - hs * 0.5 * ux);
  ctx.closePath();
  ctx.fill();

  // Tip dot.
  ctx.beginPath();
  ctx.arc(T.x, T.y, 3, 0, Math.PI * 2);
  ctx.fill();
}

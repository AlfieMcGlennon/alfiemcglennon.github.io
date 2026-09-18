// hero-lab-physical.js — the "Physical" hero variant: the sky as a computed
// model of Reading right now. Unlike Atmosphere's condition-keyed palette
// table, the gradient here is derived continuously from the sun's ACTUAL
// solar elevation (src/scripts/solar.js) and then modified by the live
// condition; the sun and moon are drawn at their true azimuth/elevation, not
// decorative placeholders. A single <canvas> renders, back to front: stars,
// sun/moon (or a twilight glow when the sun is below the horizon), drawn
// cumulus/stratus cloud layers with parallax, a soft haze band, an abstract
// downland horizon silhouette, and — in front of everything — precipitation
// and (for thunderstorms) an occasional soft sheet-lightning brightness lift.
//
// Cost discipline mirrors the other two Hero Lab canvases: cloud "shapes"
// are painted ONCE into small offscreen template canvases (a handful of
// distinct cumulus + stratus templates, built lazily on first use — never at
// module load, to keep this side-effect-free until a variant actually
// mounts). Per-frame work for every cloud instance is a translate +
// drawImage; nothing per-instance is reallocated once buildClouds/buildRain
// have run for the current reading. Solar/lunar positions are recomputed
// once per data update AND on a 60s tick (astronomical correctness, not
// animation) — that tick is itself gated by the same start/stop the rAF loop
// uses, so reduced motion really does mean "one static frame, then nothing".

import { watchMotionGate } from './hero-lab-motion.js';
import { sunPosition, moonPosition, moonIlluminatedFraction, twilightPhase } from './solar.js';

const READING_LAT = 51.4543;
const READING_LON = -0.9781;

function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
function lerp(a, b, t) { return a + (b - a) * t; }

// Deterministic pseudo-random in [0,1) from an integer seed — same trick as
// hero-lab-atmosphere.js's STARS/blobs: stable across resizes/data updates,
// no RNG dependency, "random-looking" without needing to be a real RNG.
function rand(i) {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

function mixHex(a, b, t) {
  const pa = hexToRgb(a);
  const pb = hexToRgb(b);
  const r = Math.round(pa.r + (pb.r - pa.r) * t);
  const g = Math.round(pa.g + (pb.g - pa.g) * t);
  const bl = Math.round(pa.b + (pb.b - pa.b) * t);
  return `rgb(${r},${g},${bl})`;
}

// ---------------------------------------------------------------------------
// Band geometry — shared by the sun/moon mapping (A) and the horizon (E) so
// the ridge sits exactly where the sun/moon would touch down.

const HORIZON_FRAC = 0.82; // horizon line at ~82% of band height
const TOP_ELEV_FRAC = 0.06; // ~60deg elevation maps near the top of the band
const MAX_MAPPED_ELEV = 60;

// Azimuth range the daylight arc is stretched across, left -> right. Wider
// than the strict E/S/W (90/180/270) so a British-summer sunrise/sunset
// (well north of due E/W) still lands on-canvas rather than clipping.
const AZ_MIN = 40;
const AZ_MAX = 320;

function xForAzimuth(azDeg, w) {
  const t = clamp((azDeg - AZ_MIN) / (AZ_MAX - AZ_MIN), 0, 1);
  return t * w;
}

function yForElevation(elevDeg, h) {
  const t = clamp(elevDeg / MAX_MAPPED_ELEV, 0, 1);
  return HORIZON_FRAC * h - t * (HORIZON_FRAC - TOP_ELEV_FRAC) * h;
}

// ---------------------------------------------------------------------------
// B. Palette — continuous in solar elevation, keyed off twilightPhase(),
// then modified (not replaced) by the live condition.

function baseSkyForElevation(elevDeg) {
  const phase = twilightPhase(elevDeg);
  if (phase === 'day') {
    return { top: '#9ec4dc', mid: mixHex('#9ec4dc', '#f0d4a0', 0.42), bot: '#f0d4a0' };
  }
  if (phase === 'golden') {
    // t: 0 at the day boundary (12deg), 1 right at the horizon (3deg) — the
    // "ramp toward the horizon" the brief describes.
    const t = clamp((12 - elevDeg) / 9, 0, 1);
    return {
      top: mixHex('#9ec4dc', '#8aa9c6', t * 0.6),
      mid: mixHex('#eecf9a', '#ecb37a', t),
      bot: mixHex('#f0d4a0', '#e8763f', t),
    };
  }
  if (phase === 'civil') {
    // t: 0 at the golden boundary (3deg), 1 at the nautical boundary (-6deg).
    const t = clamp((3 - elevDeg) / 9, 0, 1);
    return {
      top: mixHex('#7d9dc0', '#5b5470', t),
      mid: mixHex('#c9805a', '#8a5a72', t),
      bot: mixHex('#e8763f', '#a8523a', t),
    };
  }
  if (phase === 'nautical') {
    // t: 0 at the civil boundary (-6deg), 1 at the night boundary (-12deg).
    const t = clamp((-6 - elevDeg) / 6, 0, 1);
    return {
      top: mixHex('#5b5470', '#12212f', t),
      mid: mixHex('#4a4258', '#152738', t),
      bot: mixHex('#a8523a', '#1c3245', t),
    };
  }
  // night
  return { top: '#0e1924', mid: '#12212f', bot: '#16293a' };
}

const CONDITION_MODIFIERS = {
  overcast: { toward: '#97a4ae', amt: 0.5 },
  fog: { toward: '#c1c2b8', amt: 0.55 },
  drizzle: { toward: '#7e8b96', amt: 0.4 },
  rain: { toward: '#6f7c8a', amt: 0.48 },
  thunderstorm: { toward: '#14161c', amt: 0.8 },
  snow: { toward: '#dde2e6', amt: 0.4 },
};

function applyConditionModifier(pal, condition) {
  const mod = CONDITION_MODIFIERS[condition];
  if (!mod) return pal;
  return {
    top: mixHex(pal.top, mod.toward, mod.amt),
    mid: mixHex(pal.mid, mod.toward, mod.amt * 0.9),
    bot: mixHex(pal.bot, mod.toward, mod.amt * 0.8),
  };
}

// ---------------------------------------------------------------------------
// F. Override behaviour — the lab override can force isDay against reality.
// Azimuth is always the true value; only elevation is synthesized, and only
// when the forced state actually conflicts with what the sky is doing.

function effectiveElevation(reading, realElevDeg) {
  const wantsDay = !!(reading && reading.isDay);
  const realIsDay = realElevDeg >= 0;
  if (wantsDay && !realIsDay) return Math.max(realElevDeg, 30);
  if (!wantsDay && realIsDay) return -15;
  return realElevDeg;
}

// ---------------------------------------------------------------------------
// A / stars — ~40 deterministic static stars (no twinkle, so they're correct
// in the reduced-motion single frame too), confined to the upper sky so they
// never collide with the horizon ridge.

const STARS = Array.from({ length: 40 }, (_, i) => ({
  x: rand(i * 6.1 + 211),
  y: rand(i * 8.3 + 223) * HORIZON_FRAC * 0.92,
  r: 0.5 + rand(i * 11.7 + 227) * 0.85,
  a: 0.3 + rand(i * 13.9 + 229) * 0.55,
}));

// ---------------------------------------------------------------------------
// C. Cloud templates — painted once into offscreen canvases, lazily, never
// at module load. Reused across every instance; per-instance variety comes
// from random scale/position/opacity, not from having many templates.

const CUMULUS_W = 220;
const CUMULUS_H = 128;
const STRATUS_W = 900;
const STRATUS_H = 60;
const CUMULUS_TEMPLATE_COUNT = 4;
const STRATUS_TEMPLATE_COUNT = 3;

let cumulusTemplates = null;
let stratusTemplates = null;

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

// Fades the fully-painted template toward transparent at its left/right
// edges and along its flat clipped baseline, so (a) tiling two copies for
// horizontal wraparound never shows a hard seam and (b) the clip's flat cut
// reads as a soft settle rather than a ruler line. Cheap: runs once per
// template, never per frame.
function fadeTemplateEdges(ctx, w, h, baseY) {
  ctx.save();
  ctx.globalCompositeOperation = 'destination-in';
  const hFade = ctx.createLinearGradient(0, 0, w, 0);
  hFade.addColorStop(0, 'rgba(0,0,0,0)');
  hFade.addColorStop(0.08, 'rgba(0,0,0,1)');
  hFade.addColorStop(0.92, 'rgba(0,0,0,1)');
  hFade.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = hFade;
  ctx.fillRect(0, 0, w, h);

  const vFade = ctx.createLinearGradient(0, baseY * 0.82, 0, baseY);
  vFade.addColorStop(0, 'rgba(0,0,0,1)');
  vFade.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = vFade;
  ctx.fillRect(0, baseY * 0.82, w, baseY * 0.18);
  ctx.restore();
}

// Flat-bottomed cumulus family: clip to a flat baseline, then layer
// overlapping soft ellipses above it (under-shading pass, then a brighter
// main-body pass) — same silhouette family as the Almanac line-art glyph,
// realized procedurally instead of as one fixed hand-drawn path.
function paintCloudTemplate(ctx, w, h, seed, opts) {
  const { minArcs, maxArcs, elong, baseFrac } = opts;
  const baseY = h * baseFrac;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, w, baseY);
  ctx.clip();

  const arcCount = minArcs + Math.floor(rand(seed * 3.7 + 1) * (maxArcs - minArcs + 1));

  const pass = (fillStyle, liftMul, radMul, yNudge) => {
    ctx.fillStyle = fillStyle;
    for (let i = 0; i < arcCount; i++) {
      const t = arcCount > 1 ? i / (arcCount - 1) : 0.5;
      const jitter = (rand(seed * 9.3 + i * 1.9) - 0.5) * (0.84 / Math.max(1, arcCount - 1)) * 0.8;
      const cx = w * clamp(0.08 + 0.84 * t + jitter, 0.02, 0.98);
      const ry = h * (0.3 + rand(seed * 5.1 + i * 2.3) * 0.22) * radMul;
      const rx = ry * elong;
      const cy = baseY - ry * (0.55 + rand(seed * 7.7 + i) * 0.35) * liftMul + yNudge;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // Soft edge via a light shadow blur on the under-shading pass only — cheap
  // because this runs once per template, never per frame.
  ctx.shadowColor = 'rgba(255,255,255,0.5)';
  ctx.shadowBlur = elong > 2 ? 10 : 6;
  pass('rgba(148,150,158,0.22)', 1, 1.02, 3);
  ctx.shadowBlur = 0;
  pass('rgba(255,255,255,0.95)', 1.08, 1, 0);
  ctx.restore();

  fadeTemplateEdges(ctx, w, h, baseY);
}

function ensureTemplates() {
  if (cumulusTemplates && stratusTemplates) return;
  cumulusTemplates = Array.from({ length: CUMULUS_TEMPLATE_COUNT }, (_, i) => {
    const c = makeCanvas(CUMULUS_W, CUMULUS_H);
    paintCloudTemplate(c.getContext('2d'), CUMULUS_W, CUMULUS_H, (i + 1) * 17.3, {
      minArcs: 4, maxArcs: 7, elong: 1, baseFrac: 0.86,
    });
    return c;
  });
  stratusTemplates = Array.from({ length: STRATUS_TEMPLATE_COUNT }, (_, i) => {
    const c = makeCanvas(STRATUS_W, STRATUS_H);
    paintCloudTemplate(c.getContext('2d'), STRATUS_W, STRATUS_H, (i + 1) * 29.7 + 500, {
      minArcs: 6, maxArcs: 9, elong: 2.6, baseFrac: 0.78,
    });
    return c;
  });
}

const STRATUS_COVER_THRESHOLD = 0.85;

function buildCloudLayer(coverFrac, seedBase, isFar) {
  const count = Math.round(coverFrac * (isFar ? 7 : 5));
  const arr = [];
  for (let i = 0; i < count; i++) {
    const seed = seedBase + i * 7.13;
    arr.push({
      template: Math.floor(rand(seed * 1.7) * CUMULUS_TEMPLATE_COUNT),
      x0: rand(seed * 2.3) * 1.4 - 0.2,
      y: (isFar ? 0.06 : 0.18) + rand(seed * 3.1) * (isFar ? 0.32 : 0.36),
      scale: (isFar ? 0.14 : 0.24) + rand(seed * 4.1) * (isFar ? 0.09 : 0.15),
      speed: (isFar ? 0.005 : 0.012) + rand(seed * 5.3) * (isFar ? 0.005 : 0.009),
      opacity: ((isFar ? 0.3 : 0.5) + rand(seed * 6.7) * (isFar ? 0.22 : 0.3)) * clamp(0.35 + coverFrac, 0, 1),
    });
  }
  return arr;
}

function buildStratusSlabs(coverFrac) {
  const count = 3;
  const arr = [];
  for (let i = 0; i < count; i++) {
    const seed = 900 + i * 41.3;
    arr.push({
      template: i % STRATUS_TEMPLATE_COUNT,
      x0: rand(seed) * 1.6 - 0.3,
      y: 0.05 + i * 0.11 + rand(seed * 1.9) * 0.06,
      scale: 0.16 + rand(seed * 2.7) * 0.05,
      speed: 0.0035 + rand(seed * 3.3) * 0.003,
      opacity: 0.55 + rand(seed * 4.1) * 0.3 * coverFrac,
    });
  }
  return arr;
}

function buildClouds(reading) {
  const cover = reading ? reading.cloudCover : 45;
  const coverFrac = clamp(cover / 100, 0, 1);
  if (coverFrac > STRATUS_COVER_THRESHOLD) {
    return { mode: 'stratus', slabs: buildStratusSlabs(coverFrac) };
  }
  return {
    mode: 'cumulus',
    far: buildCloudLayer(coverFrac, 100, true),
    near: buildCloudLayer(coverFrac, 400, false),
  };
}

// Wind drives both cloud drift and rain slant: direction (which way it's
// blowing TOWARD, i.e. wind_direction_10m + 180) picks left-vs-right, speed
// scales how fast/how slanted.
function windDrift(reading) {
  const dir = reading ? reading.windDir : 235;
  const speed = reading ? reading.windSpeed : 14;
  const rad = ((dir + 180) * Math.PI) / 180;
  const horiz = Math.sin(rad);
  const sign = horiz >= 0 ? 1 : -1;
  const speedMul = 0.4 + clamp(speed, 0, 50) / 50 * 1.6;
  return { sign, speedMul, slantPx: horiz * clamp(speed, 0, 50) * 0.16 };
}

// ---------------------------------------------------------------------------
// D. Precipitation

function buildPrecip(reading) {
  const precip = reading ? reading.precipitation : 0;
  const cond = reading ? reading.condition : 'partly-cloudy';
  let mode = 'none';
  if (precip > 0.02) {
    if (cond === 'snow') mode = 'snow';
    else if (cond === 'drizzle') mode = 'drizzle';
    else if (cond === 'rain' || cond === 'thunderstorm') mode = 'rain';
  }
  if (mode === 'none') return { mode, drops: [] };

  const intensity = clamp(precip, 0, 10);
  let count;
  if (mode === 'rain') count = Math.round(40 + clamp(intensity / 8, 0, 1) * 50); // 40-90
  else if (mode === 'drizzle') count = Math.round(16 + clamp(intensity / 3, 0, 1) * 14); // sparser
  else count = Math.round(45 + clamp(intensity / 6, 0, 1) * 35); // denser snow

  const arr = [];
  for (let i = 0; i < count; i++) {
    const seed = i * 4.37 + 9001;
    arr.push({
      x: rand(seed),
      y: rand(seed + 1),
      speed: 0.45 + rand(seed + 2) * (mode === 'drizzle' ? 0.3 : 0.75),
      wander: rand(seed + 3) * Math.PI * 2,
    });
  }
  return { mode, drops: arr };
}

// ---------------------------------------------------------------------------
// E. Horizon — one abstract downland ridge in two overlapping layers, static
// geometry rebuilt only on resize, coloured from the current palette.

function buildRidge(w, h) {
  const horizonY = h * HORIZON_FRAC;
  const bandH = Math.min(55, h * 0.18);
  const segs = 6;
  const layer = (seed, ampScale, liftPx) => {
    const pts = [];
    for (let i = 0; i <= segs; i++) {
      const x = (i / segs) * w;
      const y =
        horizonY -
        liftPx -
        (Math.sin(i * 1.7 + seed) * 0.5 + 0.5) * bandH * ampScale -
        rand(seed + i * 3.3) * bandH * 0.22 * ampScale;
      pts.push({ x, y });
    }
    return pts;
  };
  return { horizonY, bandH, far: layer(11.3, 0.5, 4), near: layer(41.7, 0.85, 12) };
}

function fillSmoothPath(ctx, pts, w, h, color) {
  ctx.beginPath();
  ctx.moveTo(0, pts[0].y);
  for (let i = 0; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2;
    const my = (pts[i].y + pts[i + 1].y) / 2;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
  }
  ctx.lineTo(w, pts[pts.length - 1].y);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

// ---------------------------------------------------------------------------

export function initPhysical(root) {
  const canvas = root.querySelector('[data-physical-canvas]');
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  let w = 0;
  let h = 0;
  let dpr = 1;
  let data = null;
  let clouds = { mode: 'cumulus', far: [], near: [] };
  let precip = { mode: 'none', drops: [] };
  let ridge = { horizonY: 0, bandH: 0, far: [], near: [] };
  let drift = { sign: 1, speedMul: 1, slantPx: 0 };

  let realSun = { elevation: 20, azimuth: 180 };
  let realMoon = { elevation: -20, azimuth: 0 };
  let moonFrac = 0.5;

  let raf = 0;
  let minuteTimer = 0;
  let running = false;
  let lastFrame = 0;
  let tAccum = 0;
  let nextFlash = 6 + Math.random() * 8;
  let flashFrames = 0;

  function updateCelestial() {
    const now = new Date();
    realSun = sunPosition(now, READING_LAT, READING_LON);
    realMoon = moonPosition(now, READING_LAT, READING_LON);
    moonFrac = moonIlluminatedFraction(now);
  }

  function applyPalette() {
    const effElev = effectiveElevation(data, realSun.elevation);
    const base = baseSkyForElevation(effElev);
    const pal = applyConditionModifier(base, data ? data.condition : 'partly-cloudy');
    root.style.setProperty('--phy-top', pal.top);
    root.style.setProperty('--phy-mid', pal.mid);
    root.style.setProperty('--phy-bot', pal.bot);
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    w = Math.max(1, Math.round(rect.width));
    h = Math.max(1, Math.round(rect.height));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ridge = buildRidge(w, h);
    drawFrame(tAccum);
  }

  function drawFrame(t) {
    ensureTemplates();
    ctx.clearRect(0, 0, w, h);

    const effElev = effectiveElevation(data, realSun.elevation);
    const cloudFrac = clamp((data ? data.cloudCover : 45) / 100, 0, 1);
    const isNightScene = effElev < 0;

    // 1. Stars (behind everything, upper sky only).
    if (isNightScene) {
      const starAlpha = clamp(-effElev / 12, 0, 1) * (1 - cloudFrac * 0.85);
      if (starAlpha > 0.01) {
        ctx.fillStyle = '#fff';
        STARS.forEach((st) => {
          ctx.globalAlpha = st.a * starAlpha;
          ctx.beginPath();
          ctx.arc(st.x * w, st.y * h, st.r, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1;
      }
    }

    // 2. Sun (true position, disc + two glow layers) or, below the horizon,
    // a twilight glow bleeding up from the horizon at the sun's azimuth.
    const sunX = xForAzimuth(realSun.azimuth, w);
    if (effElev > 0) {
      const sunY = yForElevation(effElev, h);
      const sunDim = clamp(1 - cloudFrac * 0.5, 0.3, 1);
      const core = 4.5; // ~9px core diameter
      let g = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, core * 9);
      g.addColorStop(0, `rgba(255,225,170,${0.32 * sunDim})`);
      g.addColorStop(1, 'rgba(255,225,170,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(sunX, sunY, core * 9, 0, Math.PI * 2);
      ctx.fill();
      g = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, core * 3.2);
      g.addColorStop(0, `rgba(255,244,214,${0.72 * sunDim})`);
      g.addColorStop(1, 'rgba(255,244,214,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(sunX, sunY, core * 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = sunDim;
      ctx.fillStyle = 'rgba(255,250,235,0.98)';
      ctx.beginPath();
      ctx.arc(sunX, sunY, core, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    } else {
      const glowAlpha = clamp((effElev + 15) / 15, 0, 1);
      if (glowAlpha > 0.01) {
        const g = ctx.createRadialGradient(sunX, ridge.horizonY, 0, sunX, ridge.horizonY, w * 0.45);
        g.addColorStop(0, `rgba(255,190,130,${0.5 * glowAlpha})`);
        g.addColorStop(1, 'rgba(255,190,130,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(sunX, ridge.horizonY, w * 0.45, h * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 3. Moon — only while the scene reads as night and the moon is above
    // its own real horizon; shaped by illuminated fraction.
    if (isNightScene && realMoon.elevation > 0) {
      const moonAlpha = clamp(1 - cloudFrac * 0.9, 0, 1);
      if (moonAlpha > 0.02) {
        const mx = xForAzimuth(realMoon.azimuth, w);
        const my = yForElevation(realMoon.elevation, h);
        const r = 10;
        ctx.save();
        ctx.globalAlpha = moonAlpha;
        let g = ctx.createRadialGradient(mx, my, 0, mx, my, r * 3.2);
        g.addColorStop(0, 'rgba(226,232,240,0.35)');
        g.addColorStop(1, 'rgba(226,232,240,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(mx, my, r * 3.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = 'rgba(232,236,242,0.92)';
        ctx.arc(mx, my, r, 0, Math.PI * 2);
        ctx.fill();

        if (moonFrac < 0.92) {
          const shift = r * (2 - moonFrac * 2) * 0.62;
          ctx.globalCompositeOperation = 'destination-out';
          ctx.beginPath();
          ctx.arc(mx + shift, my, r * 1.04, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalCompositeOperation = 'source-over';
        }
        ctx.restore();
      }
    }

    // 4. Cloud layers — precomputed shapes, translate + drawImage only.
    if (clouds.mode === 'stratus') {
      clouds.slabs.forEach((s) => {
        const tmpl = stratusTemplates[s.template];
        const destW = w * 1.15; // >= w, so two adjacent copies always span the viewport
        const destH = s.scale * h;
        const travelPx = t * s.speed * drift.sign * drift.speedMul * w;
        const bx = (((s.x0 * w + travelPx) % destW) + destW) % destW - destW;
        ctx.globalAlpha = s.opacity;
        ctx.drawImage(tmpl, bx, s.y * h, destW, destH);
        ctx.drawImage(tmpl, bx + destW, s.y * h, destW, destH);
        ctx.globalAlpha = 1;
      });
    } else {
      [clouds.far, clouds.near].forEach((layer) => {
        layer.forEach((c) => {
          const tmpl = cumulusTemplates[c.template];
          const destW = c.scale * w;
          const destH = destW * (CUMULUS_H / CUMULUS_W);
          const travel = t * c.speed * drift.sign * drift.speedMul;
          const bx = ((((c.x0 + travel) % 1.4) + 1.4) % 1.4 - 0.2) * w;
          const by = c.y * h;
          ctx.globalAlpha = c.opacity;
          ctx.drawImage(tmpl, bx, by, destW, destH);
          ctx.globalAlpha = 1;
        });
      });
    }

    // 5. Haze — soft blend between the sky/cloud layers and the ridge.
    const hazeColor = hexToRgb('#1c1712');
    const hazeGrad = ctx.createLinearGradient(0, ridge.horizonY - ridge.bandH * 1.4, 0, ridge.horizonY);
    hazeGrad.addColorStop(0, `rgba(${hazeColor.r},${hazeColor.g},${hazeColor.b},0)`);
    hazeGrad.addColorStop(1, isNightScene ? 'rgba(5,9,14,0.32)' : 'rgba(240,196,140,0.22)');
    ctx.fillStyle = hazeGrad;
    ctx.fillRect(0, ridge.horizonY - ridge.bandH * 1.4, w, ridge.bandH * 1.4);

    // 6. Horizon — abstract Berkshire-downs ridge, two layers for depth.
    const farColor = mixHex(isNightScene ? '#0d1520' : '#e8a35c', isNightScene ? '#040709' : '#241a12', isNightScene ? 0.35 : 0.45);
    const nearColor = mixHex(isNightScene ? '#0a1017' : '#c97a3f', isNightScene ? '#020406' : '#1c130d', isNightScene ? 0.5 : 0.6);
    fillSmoothPath(ctx, ridge.far, w, h, farColor);
    fillSmoothPath(ctx, ridge.near, w, h, nearColor);

    // 7. Precipitation — in front of the whole scene.
    if (precip.mode === 'rain' || precip.mode === 'drizzle') {
      const isRain = precip.mode === 'rain';
      ctx.strokeStyle = isRain ? 'rgba(110,128,142,0.58)' : 'rgba(140,150,160,0.32)';
      ctx.lineWidth = isRain ? 1.25 : 1;
      const len = isRain ? 18 : 9;
      precip.drops.forEach((s) => {
        const py = ((((s.y + t * s.speed) % 1) + 1) % 1) * h;
        const px = ((s.x * w + drift.slantPx * t * 40) % w + w) % w;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + drift.slantPx * 0.6, py + len);
        ctx.stroke();
      });
    } else if (precip.mode === 'snow') {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      precip.drops.forEach((s) => {
        const py = ((((s.y + t * s.speed * 0.4) % 1) + 1) % 1) * h;
        const px = ((s.x * w + Math.sin(t * 1.3 + s.wander * 6) * 12) % w + w) % w;
        ctx.beginPath();
        ctx.arc(px, py, 1.7, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // 8. Sheet lightning — a brief, soft whole-canvas brightness lift only.
    if (flashFrames > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.14)';
      ctx.fillRect(0, 0, w, h);
      flashFrames--;
    }
  }

  function frame(now) {
    raf = 0;
    if (!running) return;
    if (now - lastFrame < 33) {
      raf = requestAnimationFrame(frame);
      return;
    }
    const dt = lastFrame ? (now - lastFrame) / 1000 : 0;
    lastFrame = now;
    tAccum += dt;

    if (data && data.condition === 'thunderstorm' && tAccum > nextFlash) {
      flashFrames = 2;
      nextFlash = tAccum + 6 + Math.random() * 8;
    }

    drawFrame(tAccum);
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    lastFrame = 0;
    raf = requestAnimationFrame(frame);
    if (!minuteTimer) {
      minuteTimer = window.setInterval(() => {
        updateCelestial();
        applyPalette();
      }, 60000);
    }
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    if (minuteTimer) {
      clearInterval(minuteTimer);
      minuteTimer = 0;
    }
  }

  updateCelestial();
  clouds = buildClouds(null);
  precip = buildPrecip(null);
  drift = windDrift(null);
  applyPalette();
  resize();
  window.addEventListener('resize', resize);

  watchMotionGate(root, {
    onChange(active) {
      if (active) start();
      else stop();
    },
  });

  return {
    setData(reading) {
      data = reading;
      updateCelestial();
      clouds = buildClouds(reading);
      precip = buildPrecip(reading);
      drift = windDrift(reading);
      applyPalette();
      drawFrame(tAccum);
    },
  };
}

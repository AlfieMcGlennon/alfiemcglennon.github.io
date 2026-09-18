// hero-lab-atmosphere.js — the "Atmosphere" hero variant: a layered sky band
// (CSS gradient, driven by custom properties) plus a thin canvas layer for
// soft drifting cloud blobs and, when it's actually precipitating in
// Reading, rain/snow streaks. The gradient itself never repaints per frame
// (it's set once per data update); only the canvas overlay animates, and
// that overlay is a fixed, small set of precomputed shapes translated over
// time — no per-frame allocation.

import { watchMotionGate } from './hero-lab-motion.js';

function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

// Deterministic pseudo-random in [0,1) from an integer seed — enough
// "randomness" for a natural-looking scatter without a real RNG or a
// dependency, and stable across resizes.
function rand(i) {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// A sparse, deterministic star field for clear/partly-cloudy nights — drawn
// static (no twinkle) so it also appears in the reduced-motion frame.
const STARS = Array.from({ length: 26 }, (_, i) => ({
  x: rand(i * 5.3 + 31),
  y: rand(i * 7.9 + 37) * 0.55,
  r: 0.5 + rand(i * 11.3 + 41) * 0.9,
  a: 0.35 + rand(i * 13.7 + 43) * 0.5,
}));

// Local-hour dusk/dawn tint bias, folded into the palette pick below.
function isDuskDawn(hour) {
  return (hour >= 5 && hour < 8) || (hour >= 17 && hour < 20);
}

function paletteFor(reading, hour) {
  if (!reading) {
    return { top: '#afc7d3', mid: '#d8d4c2', bot: '#e0c093', sun: 0.8 };
  }
  if (!reading.isDay) {
    return { top: '#0e1924', mid: '#16293a', bot: '#22303c', sun: 0 };
  }
  const cond = reading.condition;
  const dusk = isDuskDawn(hour);
  const table = {
    clear: { top: '#a3c3da', mid: '#dcd7c1', bot: '#e7c48f', sun: 1 },
    'partly-cloudy': { top: '#afc7d3', mid: '#d8d4c2', bot: '#e0c093', sun: 0.8 },
    overcast: { top: '#97a4ae', mid: '#b3bbbf', bot: '#d4c8b4', sun: 0.25 },
    fog: { top: '#a9b0ac', mid: '#c1c2b8', bot: '#d8d2c2', sun: 0.15 },
    drizzle: { top: '#7e8b96', mid: '#98a0a4', bot: '#b4b0a2', sun: 0.15 },
    rain: { top: '#6f7c8a', mid: '#8c95a0', bot: '#aba99e', sun: 0 },
    snow: { top: '#c5d3df', mid: '#dde2e6', bot: '#e7e4d8', sun: 0.3 },
    thunderstorm: { top: '#3a4252', mid: '#5a5e68', bot: '#736c62', sun: 0 },
  };
  const p = table[cond] || table['partly-cloudy'];
  if (!dusk) return p;
  // Warm the horizon and mid band toward amber near sunrise/sunset.
  return { top: p.top, mid: mixHex(p.mid, '#e8a35c', 0.35), bot: mixHex(p.bot, '#e8763f', 0.4), sun: p.sun };
}

function mixHex(a, b, t) {
  const pa = hexToRgb(a);
  const pb = hexToRgb(b);
  const r = Math.round(pa.r + (pb.r - pa.r) * t);
  const g = Math.round(pa.g + (pb.g - pa.g) * t);
  const bl = Math.round(pa.b + (pb.b - pa.b) * t);
  return `rgb(${r},${g},${bl})`;
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

export function initAtmosphere(root) {
  const canvas = root.querySelector('[data-atmosphere-canvas]');
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  let w = 0;
  let h = 0;
  let dpr = 1;
  let blobs = [];
  let streaks = [];
  let mode = 'none'; // 'rain' | 'snow' | 'none'
  let slantX = 3;
  let hazeGrad = null;
  let raf = 0;
  let running = false;
  let lastFrame = 0;
  let tAccum = 0;
  let data = null;

  // Pre-render one cloud as a cluster of soft ellipses on a flattened base —
  // a drawn form instead of a structureless radial smudge. Built once per
  // data update; per-frame cost is a single drawImage.
  function makeCloudSprite(seed) {
    const px = 160;
    const c = document.createElement('canvas');
    c.width = px * 2;
    c.height = px;
    const g = c.getContext('2d');
    const n = 4 + Math.floor(rand(seed) * 3);
    const baseY = px * 0.74;
    g.fillStyle = '#fff';
    for (let i = 0; i < n; i++) {
      const cx = px * 0.4 + (i / (n - 1)) * px * 1.2 + (rand(seed + i * 1.7) - 0.5) * px * 0.14;
      const rw = px * (0.2 + rand(seed + i * 2.3) * 0.18);
      const rh = rw * (0.5 + rand(seed + i * 3.1) * 0.28);
      g.beginPath();
      g.ellipse(cx, baseY - rh * (0.5 + rand(seed + i * 4.3) * 0.4), rw, rh, 0, 0, Math.PI * 2);
      g.fill();
    }
    g.globalCompositeOperation = 'destination-out';
    g.fillRect(0, baseY, c.width, c.height - baseY);
    g.globalCompositeOperation = 'source-atop';
    const sh = g.createLinearGradient(0, baseY - px * 0.28, 0, baseY);
    sh.addColorStop(0, 'rgba(0,0,0,0)');
    sh.addColorStop(1, 'rgba(118,106,96,0.22)');
    g.fillStyle = sh;
    g.fillRect(0, 0, c.width, c.height);
    const out = document.createElement('canvas');
    out.width = c.width;
    out.height = c.height;
    const og = out.getContext('2d');
    og.filter = 'blur(3px)';
    og.drawImage(c, 0, 0);
    return out;
  }

  function buildBlobs(reading) {
    const cloud = reading ? reading.cloudCover : 45;
    const isDay = reading ? reading.isDay : true;
    const count = Math.round(clamp(cloud / 100, 0, 1) * 7) + 2;
    const arr = [];
    for (let i = 0; i < count; i++) {
      const far = rand(i * 6.7 + 8) < 0.45; // back layer: smaller, slower, fainter
      arr.push({
        x0: rand(i * 3.1 + 1) * 1.3 - 0.15,
        y: (far ? 0.05 : 0.16) + rand(i * 5.7 + 2) * (far ? 0.2 : 0.3),
        w: (far ? 0.12 : 0.2) + rand(i * 7.3 + 3) * (far ? 0.08 : 0.14),
        speed: (far ? 0.004 : 0.008) + rand(i * 2.3 + 4) * (far ? 0.006 : 0.012),
        opacity: ((far ? 0.2 : 0.32) + rand(i * 4.1 + 5) * 0.2) * (isDay ? 1 : 0.5),
        sprite: makeCloudSprite(i * 9.4 + 51),
      });
    }
    return arr;
  }

  function buildStreaks(reading) {
    const precip = reading ? reading.precipitation : 0;
    const cond = reading ? reading.condition : 'partly-cloudy';
    if (precip > 0.05 && cond === 'snow') mode = 'snow';
    else if (precip > 0.05 && (cond === 'rain' || cond === 'drizzle' || cond === 'thunderstorm')) mode = 'rain';
    else mode = 'none';

    if (mode === 'none') return [];
    const windDir = reading ? reading.windDir : 235;
    const windSpeed = reading ? reading.windSpeed : 14;
    slantX = (windDir > 180 ? -1 : 1) * (2 + clamp(windSpeed, 0, 50) * 0.14);
    const intensity = clamp(precip, 0, 8);
    const count = mode === 'rain' ? Math.round(intensity * 8) + 38 : Math.round(intensity * 4) + 24;
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: rand(i * 3.7 + 9),
        y: rand(i * 6.1 + 11),
        speed: 0.3 + rand(i * 8.3 + 13) * 0.5,
        drift: (rand(i * 9.7 + 17) - 0.5) * 0.4,
      });
    }
    return arr;
  }

  function applyPalette() {
    const hour = data && data.fetchedAt ? new Date(data.fetchedAt).getUTCHours() : 12;
    // fetchedAt is a UTC timestamp; approximate local hour via Europe/London
    // formatting for the dusk/dawn check (cheap, done once per data update).
    let localHr = hour;
    try {
      localHr = parseInt(
        new Date(data ? data.fetchedAt : Date.now()).toLocaleTimeString('en-GB', {
          hour: '2-digit',
          hour12: false,
          timeZone: 'Europe/London',
        }),
        10
      );
    } catch (e) { /* keep UTC fallback */ }

    const pal = paletteFor(data, localHr);
    root.style.setProperty('--atm-top', pal.top);
    root.style.setProperty('--atm-mid', pal.mid);
    root.style.setProperty('--atm-bot', pal.bot);
    root.style.setProperty('--atm-sun', String(pal.sun));
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    w = Math.max(1, Math.round(rect.width));
    h = Math.max(1, Math.round(rect.height));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    hazeGrad = ctx.createLinearGradient(0, h * 0.68, 0, h);
    hazeGrad.addColorStop(0, 'rgba(250,246,238,0)');
    hazeGrad.addColorStop(1, 'rgba(250,246,238,0.18)');
    drawFrame(tAccum);
  }

  function drawFrame(t) {
    ctx.clearRect(0, 0, w, h);

    if (data && !data.isDay && (data.condition === 'clear' || data.condition === 'partly-cloudy')) {
      const dim = data.condition === 'clear' ? 1 : 0.55;
      ctx.fillStyle = '#fff';
      STARS.forEach((st) => {
        ctx.globalAlpha = st.a * dim;
        ctx.beginPath();
        ctx.arc(st.x * w, st.y * h, st.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }

    blobs.forEach((b) => {
      const bx = (((b.x0 + t * b.speed) % 1.3 + 1.3) % 1.3 - 0.15) * w;
      const bw = b.w * w;
      const bh = bw * 0.5;
      ctx.globalAlpha = b.opacity;
      ctx.drawImage(b.sprite, bx - bw / 2, b.y * h - bh / 2, bw, bh);
    });
    ctx.globalAlpha = 1;

    if (hazeGrad && (data ? data.isDay : true)) {
      ctx.fillStyle = hazeGrad;
      ctx.fillRect(0, h * 0.68, w, h * 0.32);
    }

    if (mode === 'rain') {
      ctx.strokeStyle = 'rgba(112,126,138,0.6)';
      ctx.lineWidth = 1.1;
      streaks.forEach((s) => {
        const py = (((s.y + t * s.speed) % 1) + 1) % 1 * h;
        const px = ((s.x * w + s.drift * t * 60) % w + w) % w;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + slantX, py + 17);
        ctx.stroke();
      });
    } else if (mode === 'snow') {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      streaks.forEach((s) => {
        const py = (((s.y + t * s.speed * 0.4) % 1) + 1) % 1 * h;
        const px = ((s.x * w + Math.sin(t * 1.4 + s.drift * 10) * 10) % w + w) % w;
        ctx.beginPath();
        ctx.arc(px, py, 1.6, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }

  function frame(now) {
    raf = 0;
    if (!running) return;
    if (now - lastFrame < 40) {
      raf = requestAnimationFrame(frame);
      return;
    }
    const dt = lastFrame ? (now - lastFrame) / 1000 : 0;
    lastFrame = now;
    tAccum += dt;
    drawFrame(tAccum);
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    lastFrame = 0;
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  blobs = buildBlobs(null);
  streaks = buildStreaks(null);
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
      blobs = buildBlobs(reading);
      streaks = buildStreaks(reading);
      applyPalette();
      drawFrame(tAccum);
    },
  };
}

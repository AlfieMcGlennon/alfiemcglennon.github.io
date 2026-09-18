// hero-lab-synoptic.js — the "Synoptic" hero variant: a drifting isoline
// field on a <canvas>, styled like a pressure chart. Every parameter is
// precomputed once per data update (buildLines) so the per-frame cost is
// just a handful of sine evaluations per sample point — no particle system,
// no per-frame allocation beyond a Path2D-free stroke.
//
// Scientific hooks (not just decoration):
//  - contour SPACING tightens as pressure_msl drops below ~1013 hPa, and
//    relaxes as it rises above it, echoing how isobars pack together in a
//    low and spread out in a high.
//  - contour DENSITY/amplitude responds to cloud_cover.
//  - DRIFT direction/speed follows wind_direction_10m / wind_speed_10m.
//  - a couple of lines are labelled with an implied pressure value, the way
//    a synoptic chart labels isobars.

import { watchMotionGate } from './hero-lab-motion.js';

function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

export function initSynoptic(root) {
  const canvas = root.querySelector('[data-synoptic-canvas]');
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  let w = 0;
  let h = 0;
  let dpr = 1;
  let built = { lines: [] };
  let data = null;
  let phase = 0;
  let raf = 0;
  let running = false;
  let lastFrame = 0;

  function paletteFor(reading) {
    if (!reading) {
      return { stroke: 'rgba(15,118,110,0.3)', accent: 'rgba(180,83,9,0.36)', wash: null };
    }
    if (!reading.isDay) {
      return { stroke: 'rgba(28,55,68,0.4)', accent: 'rgba(15,118,110,0.4)', wash: 'rgba(20,32,42,0.05)' };
    }
    const cond = reading.condition;
    if (cond === 'rain' || cond === 'thunderstorm' || cond === 'drizzle') {
      return { stroke: 'rgba(30,64,84,0.42)', accent: 'rgba(15,118,110,0.4)', wash: 'rgba(60,72,82,0.06)' };
    }
    if (cond === 'snow') {
      return { stroke: 'rgba(70,98,112,0.34)', accent: 'rgba(15,118,110,0.3)', wash: 'rgba(198,210,216,0.1)' };
    }
    if (cond === 'overcast' || cond === 'fog') {
      return { stroke: 'rgba(68,64,60,0.3)', accent: 'rgba(120,113,108,0.34)', wash: 'rgba(120,113,108,0.05)' };
    }
    return { stroke: 'rgba(15,118,110,0.32)', accent: 'rgba(180,83,9,0.36)', wash: null };
  }

  function buildLines(reading) {
    const pressure = reading ? reading.pressure : 1016;
    const cloud = reading ? reading.cloudCover : 45;
    // Lower pressure -> tighter spacing; higher pressure -> calmer, wider spacing.
    const spacing = clamp(52 - (1013 - pressure) * 0.9, 22, 66);
    const count = Math.ceil(h / spacing) + 6;
    const density = clamp(cloud / 100, 0, 1);
    const lines = [];
    for (let i = 0; i < count; i++) {
      const seed = (i + 1) * 12.9898;
      lines.push({
        baseY: (i - 3) * spacing,
        ampA: 8 + 14 * density + (Math.sin(seed) * 0.5 + 0.5) * 8,
        freqA: 0.005 + (Math.sin(seed * 1.7) * 0.5 + 0.5) * 0.004,
        phaseA: seed,
        ampB: 4 + (Math.cos(seed * 0.7) * 0.5 + 0.5) * 6,
        freqB: 0.013 + (Math.cos(seed * 2.1) * 0.5 + 0.5) * 0.006,
        phaseB: seed * 1.3,
        labelled: i % 4 === 1,
      });
    }
    return { lines, spacing };
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    w = Math.max(1, Math.round(rect.width));
    h = Math.max(1, Math.round(rect.height));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    built = buildLines(data);
    drawFrame(phase);
  }

  function drawFrame(driftPx) {
    ctx.clearRect(0, 0, w, h);
    const pal = paletteFor(data);
    if (pal.wash) {
      ctx.fillStyle = pal.wash;
      ctx.fillRect(0, 0, w, h);
    }

    const windDeg = data ? data.windDir : 235;
    const angle = (windDeg * Math.PI) / 180;
    const dx = Math.sin(angle) * driftPx;
    const dy = Math.cos(angle) * driftPx * 0.12;

    const samples = 42;
    const step = w / samples;
    const midLine = Math.floor(built.lines.length / 2);

    built.lines.forEach((line, idx) => {
      ctx.beginPath();
      for (let s = 0; s <= samples; s++) {
        const x = s * step;
        const y =
          line.baseY +
          dy +
          Math.sin((x + dx) * line.freqA + line.phaseA) * line.ampA +
          Math.sin((x + dx) * line.freqB + line.phaseB) * line.ampB;
        if (s === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      // Chart convention: the labelled isobars are the emphasized ones.
      ctx.lineWidth = line.labelled ? 1.7 : 1;
      ctx.strokeStyle = idx % 5 === 2 ? pal.accent : pal.stroke;
      ctx.stroke();

      if (line.labelled && data) {
        const labelX = (w * 0.1 + idx * 53) % (w * 0.72) + w * 0.06;
        const labelY =
          line.baseY +
          dy +
          Math.sin((labelX + dx) * line.freqA + line.phaseA) * line.ampA +
          Math.sin((labelX + dx) * line.freqB + line.phaseB) * line.ampB +
          3.5;
        const val = Math.round(data.pressure - (idx - midLine) * 1.3);
        ctx.save();
        ctx.font = '10px "JetBrains Mono", ui-monospace, monospace';
        ctx.textAlign = 'center';
        // Break the isobar behind the label, the way a chart does.
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(247, 246, 242, 0.92)';
        ctx.strokeText(String(val), labelX, labelY);
        ctx.fillStyle = pal.accent;
        ctx.globalAlpha = 0.9;
        ctx.fillText(String(val), labelX, labelY);
        ctx.restore();
      }
    });
  }

  function frame(now) {
    raf = 0;
    if (!running) return;
    if (now - lastFrame < 32) {
      raf = requestAnimationFrame(frame);
      return;
    }
    lastFrame = now;
    const speed = data ? clamp(data.windSpeed, 2, 45) : 12;
    phase += speed * 0.55 * (32 / 1000);
    drawFrame(phase);
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
      built = buildLines(data);
      drawFrame(phase);
    },
  };
}

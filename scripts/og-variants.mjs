// Two understated OG-card directions for the quantum-weather post, to compare.
// Calmer than the first card: no result/stats line, no busy decomposition panel.
// Renders to .qa-tmp/og-variants/ for preview; the chosen one becomes og-card.png.
// Run: node scripts/og-variants.mjs
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const OUT = 'C:/Website/alfiemcglennon.github.io/.qa-tmp/og-variants';
mkdirSync(OUT, { recursive: true });

const W = 1200, H = 630;
const BG = '#f0efe9', INK = '#1a1a1a', INK_DIM = '#44403c', MUTED = '#78716c';
const ACCENT = '#4338ca', TEAL = '#0a554f', TEAL2 = '#0f766e';
const SANS = "'Outfit','Segoe UI',system-ui,-apple-system,'Helvetica Neue',Arial,sans-serif";
const MONO = "'JetBrains Mono',Consolas,'Cascadia Code','Courier New',monospace";

const TAU = Math.PI * 2;
function wave(x0, x1, yb, amp, fn, K = 240) {
  let peak = 0;
  for (let i = 0; i <= K; i++) peak = Math.max(peak, Math.abs(fn(i / K)));
  let d = '';
  for (let i = 0; i <= K; i++) {
    const t = i / K, x = x0 + (x1 - x0) * t, y = yb - (amp * fn(t)) / (peak || 1);
    d += (i ? 'L' : 'M') + x.toFixed(2) + ' ' + y.toFixed(2) + ' ';
  }
  return d.trim();
}
const comp = (t) => 0.60 * Math.sin(TAU * t) + 0.30 * Math.sin(2 * TAU * t + 0.6) + 0.20 * Math.sin(3 * TAU * t + 1.3);
const frame = (inner) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="${BG}"/>
${inner}
</svg>`;

// Variant A: quiet left-aligned, a single thin wave as a baseline rule.
const A = frame(`
  <text x="92" y="150" font-family="${MONO}" font-size="22" letter-spacing="3" fill="${TEAL}">QUANTUM ML &#183; WEATHER</text>
  <text x="88" y="270" font-family="${SANS}" font-size="86" font-weight="600" fill="${INK}" letter-spacing="-2">Reading a Quantum</text>
  <text x="88" y="362" font-family="${SANS}" font-size="86" font-weight="600" fill="${INK}" letter-spacing="-2">Weather Model</text>
  <text x="92" y="430" font-family="${SANS}" font-size="27" fill="${INK_DIM}">Reading what a quantum circuit learned about the weather.</text>
  <path d="${wave(92, 1108, 520, 22, comp)}" fill="none" stroke="${ACCENT}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.55"/>
  <text x="92" y="582" font-family="${MONO}" font-size="21" fill="${MUTED}">Alfie McGlennon&#8194;&#183;&#8194;alfiemcglennon.com</text>
`);

// Variant B: centred and minimal, a small wave mark above the title.
const B = frame(`
  <path d="${wave(500, 700, 178, 20, comp)}" fill="none" stroke="${ACCENT}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="600" y="320" text-anchor="middle" font-family="${SANS}" font-size="84" font-weight="600" fill="${INK}" letter-spacing="-2">Reading a Quantum</text>
  <text x="600" y="410" text-anchor="middle" font-family="${SANS}" font-size="84" font-weight="600" fill="${INK}" letter-spacing="-2">Weather Model</text>
  <text x="600" y="478" text-anchor="middle" font-family="${SANS}" font-size="26" fill="${INK_DIM}">What a quantum circuit learned about the weather.</text>
  <text x="600" y="560" text-anchor="middle" font-family="${MONO}" font-size="21" fill="${MUTED}">Alfie McGlennon&#8194;&#183;&#8194;alfiemcglennon.com</text>
`);

for (const [name, svg] of Object.entries({ 'A-quiet': A, 'B-minimal': B })) {
  await sharp(Buffer.from(svg)).png().toFile(`${OUT}/og-${name}.png`);
  console.log('wrote', `${OUT}/og-${name}.png`);
}

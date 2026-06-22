// Open Graph card for "Reading a Quantum Weather Model".
// 1200x630 warm-parchment card on the site palette. Understated direction:
// title + one quiet subtitle + a single thin signature wave as a baseline rule.
// No result/stats line, no busy panel. Run: node scripts/og-quantum-weather.mjs
import sharp from 'sharp';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, readFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'public', 'images', 'quantum-weather');
mkdirSync(outDir, { recursive: true });
const outputPath = join(outDir, 'og-card.png');

const W = 1200, H = 630;
const BG = '#f0efe9', INK = '#1a1a1a', INK_DIM = '#44403c', MUTED = '#78716c';
const ACCENT = '#4338ca', TEAL = '#0a554f';
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

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${BG}"/>
  <path d="${wave(500, 700, 178, 20, comp)}" fill="none" stroke="${ACCENT}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="600" y="320" text-anchor="middle" font-family="${SANS}" font-size="84" font-weight="600" fill="${INK}" letter-spacing="-2">Reading a Quantum</text>
  <text x="600" y="410" text-anchor="middle" font-family="${SANS}" font-size="84" font-weight="600" fill="${INK}" letter-spacing="-2">Weather Model</text>
  <text x="600" y="478" text-anchor="middle" font-family="${SANS}" font-size="26" fill="${INK_DIM}">What a quantum circuit learned about the weather.</text>
  <text x="600" y="560" text-anchor="middle" font-family="${MONO}" font-size="21" fill="${MUTED}">Alfie McGlennon&#8194;&#183;&#8194;alfiemcglennon.com</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile(outputPath);
const head = readFileSync(outputPath).subarray(16, 24);
console.log(`Wrote ${outputPath} -> ${head.readUInt32BE(0)}x${head.readUInt32BE(4)} px`);

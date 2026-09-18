// Contextual LinkedIn cards: each pairs a real post figure with a headline and
// an explanation, mapped to Alfie's narrative arc (built -> what survived ->
// how I read it). 1080x1080. Reuses figures from the rendered dev page.
// Run: node scripts/linkedin-context.mjs   (dev server up, .qa-tmp/page3.html present)
import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'node:fs';

const OUT = 'C:/Website/New Blog post/linkedin';
mkdirSync(OUT, { recursive: true });
const S = 1080;
const BG = '#f0efe9', RAISED = '#f7f6f2', RULE = '#ddd8d0';
const INK = '#1a1a1a', INK_DIM = '#44403c', MUTED = '#78716c';
const ACCENT = '#4338ca', TEAL = '#0a554f';
const SANS = "'Outfit','Segoe UI',system-ui,-apple-system,'Helvetica Neue',Arial,sans-serif";
const MONO = "'JetBrains Mono',Consolas,'Cascadia Code','Courier New',monospace";

const html = readFileSync('C:/Website/alfiemcglennon.github.io/.qa-tmp/page3.html', 'utf8');
const svgs = (html.match(/<svg[\s\S]*?<\/svg>/g) || []).map((s) =>
  s.replace(/\sdata-astro-[a-z0-9-]+(="[^"]*")?/g, '').replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '));
const [SIGNATURE, , CIRCUIT, RESULTS] = svgs;
const place = (svg, x, y, w, h) => svg.replace('<svg ', `<svg x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet" `);

const TAU = Math.PI * 2;
function wavePath(x0, x1, yb, amp, K = 240) {
  const fn = (t) => 0.60 * Math.sin(TAU * t) + 0.30 * Math.sin(2 * TAU * t + 0.6) + 0.20 * Math.sin(3 * TAU * t + 1.3);
  let peak = 0; for (let i = 0; i <= K; i++) peak = Math.max(peak, Math.abs(fn(i / K)));
  let d = ''; for (let i = 0; i <= K; i++) { const t = i / K, x = x0 + (x1 - x0) * t, y = yb - amp * fn(t) / peak; d += (i ? 'L' : 'M') + x.toFixed(2) + ' ' + y.toFixed(2) + ' '; }
  return d.trim();
}
const panel = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${RAISED}" stroke="${RULE}" stroke-width="1.5"/>`;
const byline = (y) => `<text x="90" y="${y}" font-family="${MONO}" font-size="21" fill="${MUTED}">Alfie McGlennon &#183; MSc Climate Change &amp; AI, University of Reading</text>`;
const lines = (x, y, dy, size, fill, font, arr, weight = '400') =>
  arr.map((t, i) => `<text x="${x}" y="${y + i * dy}" font-family="${font}" font-size="${size}" font-weight="${weight}" fill="${fill}">${t}</text>`).join('\n');
const card = (inner) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}"><rect width="${S}" height="${S}" fill="${BG}"/>${inner}</svg>`;

// Card 1 — What I built (claim + honest caveat, context-forward)
const built = card(`
  <text x="90" y="140" font-family="${MONO}" font-size="22" letter-spacing="2.5" fill="${TEAL}">BUILT &amp; RUN ON IBM'S 156-QUBIT HERON</text>
  ${lines(88, 252, 76, 64, INK, SANS, ['A weather model, run on a', 'real quantum computer.'], '600')}
  <text x="90" y="404" font-family="${SANS}" font-size="30" font-weight="600" fill="${ACCENT}">And it beat the persistence baseline.</text>
  ${lines(90, 482, 40, 27, INK_DIM, SANS, [
    'Deliberately simple: next-day temperature over a single grid square,',
    'a low-signal task that classical methods already do very well.',
    'The point was to learn quantum, not to claim a breakthrough.'])}
  <path d="${wavePath(90, 990, 730, 26)}" fill="none" stroke="${ACCENT}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" opacity="0.5"/>
  ${byline(900)}
`);

// Card 2 — What survived (the detailed result figure + context)
const survived = card(`
  <text x="90" y="140" font-family="${MONO}" font-size="22" letter-spacing="2.5" fill="${TEAL}">WHAT SURVIVED THE HARDWARE NOISE</text>
  ${lines(88, 226, 64, 52, INK, SANS, ['It beat persistence, and', 'stayed readable on hardware.'], '600')}
  ${panel(70, 338, 940, 462)}
  ${place(RESULTS, 90, 352, 900, 436)}
  ${lines(90, 852, 34, 25, INK_DIM, SANS, [
    'The forecast edged the baseline; the coupling map survived the noise (r ≈ 0.96).',
    'No quantum advantage at this size, but it is lean and you can read it.'])}
  ${byline(958)}
`);

// Card 3 — How I read it (signature wave + Fourier explanation)
const read = card(`
  <text x="90" y="140" font-family="${MONO}" font-size="22" letter-spacing="2.5" fill="${TEAL}">READING WHAT IT LEARNED</text>
  ${lines(88, 224, 66, 50, INK, SANS, ['Maths from 1822 turns the circuit', 'into something you can read.'], '600')}
  ${panel(70, 330, 940, 300)}
  ${place(SIGNATURE, 95, 360, 890, 262)}
  ${lines(90, 690, 36, 25, INK_DIM, SANS, [
    "A variational quantum circuit's output is a truncated Fourier series.",
    'Fourier decomposition (Joseph Fourier, 1822) recovers which variable and',
    'spatial relationships it weighted. On an easy problem I could check it',
    'against theory, and it weighted them sensibly.'])}
  ${byline(900)}
`);

const cards = { 'ctx-1-built': built, 'ctx-2-survived': survived, 'ctx-3-read': read };
for (const [name, svg] of Object.entries(cards)) {
  await sharp(Buffer.from(svg), { density: 150 }).png().toFile(`${OUT}/linkedin-${name}.png`);
  console.log('wrote', `${OUT}/linkedin-${name}.png`);
}

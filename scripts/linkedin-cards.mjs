// Generate a set of LinkedIn-ready 1080x1080 share cards for the
// "Reading a Quantum Weather Model" post. Square format reads larger in the
// LinkedIn feed than the 1.91:1 OG card. Reuses the post's real SVG figures
// (extracted from the rendered dev page) so the cards match the post exactly.
//
// Prereq: dev server running, and .qa-tmp/page3.html fetched from the post URL.
// Run: node scripts/linkedin-cards.mjs
import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'node:fs';

const OUT = 'C:/Website/New Blog post/linkedin';
mkdirSync(OUT, { recursive: true });

const S = 1080;
const BG = '#f0efe9', RAISED = '#f7f6f2', RULE = '#ddd8d0';
const INK = '#1a1a1a', INK_DIM = '#44403c', MUTED = '#78716c';
const ACCENT = '#4338ca', TEAL = '#0a554f', TEAL2 = '#0f766e', TEAL_SOFT = '#5b9b95';
const SANS = "'Outfit','Segoe UI',system-ui,-apple-system,'Helvetica Neue',Arial,sans-serif";
const MONO = "'JetBrains Mono',Consolas,'Cascadia Code','Courier New',monospace";

// --- pull the real figures out of the rendered page ---
const html = readFileSync('C:/Website/alfiemcglennon.github.io/.qa-tmp/page3.html', 'utf8');
const svgs = (html.match(/<svg[\s\S]*?<\/svg>/g) || []).map((s) =>
  s.replace(/\sdata-astro-[a-z0-9-]+(="[^"]*")?/g, '')
   .replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')
);
const [SIGNATURE, , CIRCUIT, RESULTS] = svgs;
// nest a figure svg at a position/size (its viewBox handles the scaling)
const place = (svg, x, y, w, h) =>
  svg.replace('<svg ', `<svg x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet" `);

// --- shared helpers ---
const TAU = Math.PI * 2;
function wave(x0, x1, yb, amp, fn, K = 220) {
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
const f1 = (t) => Math.sin(TAU * t), f2 = (t) => Math.sin(2 * TAU * t + 0.6), f3 = (t) => Math.sin(3 * TAU * t + 1.3);
const panel = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="${RAISED}" stroke="${RULE}" stroke-width="1.5"/>`;
const byline = (y) => `<text x="90" y="${y}" font-family="${MONO}" font-size="22" fill="${MUTED}">Alfie McGlennon &#183; MSc Climate Change &amp; AI, University of Reading</text>`;
const card = (inner) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
<rect width="${S}" height="${S}" fill="${BG}"/>
${inner}
</svg>`;

// --- Card A: hero / title ---
const hero = card(`
  <text x="90" y="180" font-family="${MONO}" font-size="24" letter-spacing="3" fill="${TEAL}">QUANTUM MACHINE LEARNING &#183; WEATHER</text>
  <text x="86" y="348" font-family="${SANS}" font-size="94" font-weight="600" fill="${INK}" letter-spacing="-2">Reading a Quantum</text>
  <text x="86" y="452" font-family="${SANS}" font-size="94" font-weight="600" fill="${INK}" letter-spacing="-2">Weather Model</text>
  <rect x="92" y="492" width="132" height="8" rx="2" fill="${ACCENT}"/>
  ${panel(90, 556, 900, 250)}
  <line x1="150" y1="681" x2="930" y2="681" stroke="${RULE}" stroke-width="1" stroke-dasharray="2 6"/>
  <path d="${wave(150, 930, 681, 66, comp)}" fill="none" stroke="${ACCENT}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="540" y="852" text-anchor="middle" font-family="${MONO}" font-size="18" fill="${MUTED}">whatever a circuit like this computes is a stack of simple waves</text>
  <text x="90" y="918" font-family="${MONO}" font-size="22" fill="${TEAL2}">beat persistence &#183; interpretable &#183; survives real hardware</text>
  ${byline(972)}
`);

// --- Card D: the idea (decomposition) ---
const idea = card(`
  <text x="90" y="180" font-family="${MONO}" font-size="24" letter-spacing="3" fill="${TEAL}">THE IDEA</text>
  ${panel(90, 228, 900, 372)}
  <line x1="140" y1="414" x2="520" y2="414" stroke="${RULE}" stroke-width="1" stroke-dasharray="2 6"/>
  <path d="${wave(140, 520, 414, 78, comp)}" fill="none" stroke="${ACCENT}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="565" y="426" text-anchor="middle" font-family="${MONO}" font-size="40" fill="${INK_DIM}">=</text>
  <path d="${wave(615, 950, 330, 24, f1)}" fill="none" stroke="${ACCENT}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="${wave(615, 950, 414, 24, f2)}" fill="none" stroke="${TEAL2}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="${wave(615, 950, 498, 24, f3)}" fill="none" stroke="${TEAL_SOFT}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="330" y="566" text-anchor="middle" font-family="${MONO}" font-size="18" fill="${MUTED}">one signal</text>
  <text x="782" y="566" text-anchor="middle" font-family="${MONO}" font-size="18" fill="${MUTED}">a sum of simple waves</text>
  <text x="88" y="712" font-family="${SANS}" font-size="62" font-weight="600" fill="${INK}" letter-spacing="-1.5">A quantum circuit is secretly</text>
  <text x="88" y="784" font-family="${SANS}" font-size="62" font-weight="600" fill="${INK}" letter-spacing="-1.5">a stack of simple waves.</text>
  <text x="92" y="852" font-family="${SANS}" font-size="28" fill="${INK_DIM}">So you can read what it learned, with maths from 1822.</text>
  ${byline(972)}
`);

// --- Card B: the result (bold numbers, readable at feed size) ---
const result = card(`
  <text x="90" y="150" font-family="${MONO}" font-size="24" letter-spacing="3" fill="${TEAL}">THE RESULT &#183; ON REAL IBM QUANTUM HARDWARE</text>
  <text x="86" y="262" font-family="${SANS}" font-size="58" font-weight="600" fill="${INK}" letter-spacing="-1.5">What survived the move to hardware</text>

  <text x="88" y="450" font-family="${SANS}" font-size="110" font-weight="600" fill="${ACCENT}" letter-spacing="-3">2.55 °C</text>
  <text x="92" y="500" font-family="${SANS}" font-size="27" fill="${INK_DIM}">forecast error, edging the 2.68 °C persistence baseline</text>

  <text x="88" y="652" font-family="${SANS}" font-size="110" font-weight="600" fill="${ACCENT}" letter-spacing="-3">r &#8776; 0.96</text>
  <text x="92" y="702" font-family="${SANS}" font-size="27" fill="${INK_DIM}">the learned coupling map held, simulation vs hardware</text>

  <line x1="92" y1="788" x2="988" y2="788" stroke="${RULE}" stroke-width="1"/>
  <text x="90" y="858" font-family="${SANS}" font-size="32" fill="${INK}">No quantum advantage. But you can read what it learned.</text>
  ${byline(966)}
`);

// --- Card C: the model (wraps the real circuit figure) ---
const model = card(`
  <text x="90" y="150" font-family="${MONO}" font-size="24" letter-spacing="3" fill="${TEAL}">THE MODEL</text>
  ${panel(118, 206, 844, 596)}
  ${place(CIRCUIT, 138, 222, 804, 510)}
  <text x="540" y="858" text-anchor="middle" font-family="${SANS}" font-size="27" fill="${INK_DIM}">9 qubits, one map cell each. Decompose it and the couplings become readable.</text>
  ${byline(960)}
`);

const cards = { '1-hero': hero, '2-idea': idea, '3-result': result, '4-model': model };
for (const [name, svg] of Object.entries(cards)) {
  await sharp(Buffer.from(svg), { density: 150 }).png().toFile(`${OUT}/linkedin-${name}.png`);
  console.log('wrote', `${OUT}/linkedin-${name}.png`);
}

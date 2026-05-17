// Build the static Open Graph image at public/og-image.png.
// Run: node scripts/og-image.mjs
//
// 1200x630, warm parchment background, name + tagline + URL.
// No images, gradients, or logos: plain text on the site's palette.

import sharp from 'sharp';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputPath = join(__dirname, '..', 'public', 'og-image.png');

const WIDTH = 1200;
const HEIGHT = 630;

const BG = '#f0efe9';
const INK = '#1a1a1a';
const TEAL = '#0a554f';
const MUTED = '#78716c';

const SANS = "'Outfit','Segoe UI',system-ui,-apple-system,'Helvetica Neue',Arial,sans-serif";
const MONO = "'JetBrains Mono',Consolas,'Cascadia Code','Courier New',monospace";

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${BG}"/>

  <text x="90" y="290"
        font-family="${SANS}"
        font-size="104"
        font-weight="600"
        fill="${INK}"
        letter-spacing="-2">Alfie McGlennon</text>

  <text x="94" y="360"
        font-family="${MONO}"
        font-size="32"
        font-weight="400"
        fill="${TEAL}"
        letter-spacing="0.5">Climate Risk, ML &amp; Compound Extremes</text>

  <text x="94" y="430"
        font-family="${MONO}"
        font-size="22"
        font-weight="400"
        fill="${MUTED}"
        letter-spacing="0.5">alfiemcglennon.com</text>
</svg>`;

await sharp(Buffer.from(svg))
  .png()
  .toFile(outputPath);

console.log(`Wrote ${outputPath} (${WIDTH}x${HEIGHT})`);

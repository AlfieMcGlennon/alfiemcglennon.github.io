// Build the CV PDF from src/data/cv.json.
//
// 1. Reads cv.json and the LaTeX template module.
// 2. Writes build/cv/cv.tex.
// 3. If `pdflatex` is on PATH (local dev), runs it twice and copies
//    public/cv.pdf so Astro picks it up as a static asset.
// 4. If pdflatex is not available (CI runner before latex-action runs),
//    the script exits 0 and leaves the .tex for the action to compile.
//
// Run: node scripts/build-cv.mjs

import { readFile, writeFile, mkdir, copyFile, access } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

import { renderTex } from '../src/data/cv.tex.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const jsonPath = join(repoRoot, 'src', 'data', 'cv.json');
const buildDir = join(repoRoot, 'build', 'cv');
const texPath = join(buildDir, 'cv.tex');
const pdfPath = join(buildDir, 'cv.pdf');
const publicPdfPath = join(repoRoot, 'public', 'cv.pdf');

async function exists(p) {
  try {
    await access(p, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function which(cmd) {
  const probe = spawnSync(
    process.platform === 'win32' ? 'where' : 'which',
    [cmd],
    { stdio: 'ignore' }
  );
  return probe.status === 0;
}

const cv = JSON.parse(await readFile(jsonPath, 'utf8'));
const texSource = renderTex(cv);

await mkdir(buildDir, { recursive: true });
await writeFile(texPath, texSource, 'utf8');
console.log(`Wrote ${texPath}`);

if (!which('pdflatex')) {
  console.log(
    'pdflatex not found on PATH; skipping PDF compilation.\n' +
      'The .tex file is ready for CI (xu-cheng/latex-action) to compile.'
  );
  process.exit(0);
}

// Run pdflatex twice so titlesec / hyperref references settle.
for (let pass = 1; pass <= 2; pass++) {
  const result = spawnSync(
    'pdflatex',
    ['-interaction=nonstopmode', '-halt-on-error', 'cv.tex'],
    { cwd: buildDir, stdio: 'inherit' }
  );
  if (result.status !== 0) {
    console.error(`pdflatex pass ${pass} failed (exit ${result.status}).`);
    process.exit(1);
  }
}

if (!(await exists(pdfPath))) {
  console.error('pdflatex completed but cv.pdf was not produced.');
  process.exit(1);
}

await mkdir(dirname(publicPdfPath), { recursive: true });
await copyFile(pdfPath, publicPdfPath);
console.log(`Wrote ${publicPdfPath}`);

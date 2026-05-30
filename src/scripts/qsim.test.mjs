// qsim.test.mjs — verification harness for qsim.js. Run: node src/scripts/qsim.test.mjs
//
// This is the HARD GATE for the page's Fourier payoff. It asserts:
//   (1) gate identities and expectation-value conventions;
//   (2) the DFT is correct on a known signal;
//   (3) the single-qubit data re-uploading model is a degree-L truncated
//       Fourier series with integer frequencies 0..L, reality c_{-n}=c_n*,
//       and L -> L+1 adds exactly one new top frequency
//       (research/TRACK_A_foundations.md, section 2.7).
// Deterministic, non-degenerate trainable params are used so the gate is
// reproducible rather than flaky.

import {
  StateVector, blochVector, dft, binToFreq, reuploadSamples,
} from './qsim.js';

let passed = 0, failed = 0;
const fails = [];
function ok(name, cond, detail = '') {
  if (cond) { passed++; }
  else { failed++; fails.push(name + (detail ? `  [${detail}]` : '')); }
}
function near(name, a, b, tol = 1e-9) {
  ok(name, Math.abs(a - b) <= tol, `${a} vs ${b} (tol ${tol})`);
}

function basis(n, idx) {
  const sv = new StateVector(n);
  sv.re.fill(0); sv.im.fill(0);
  sv.re[idx] = 1;
  return sv;
}

// --- (1) Gate identities & expectation conventions ----------------------------
{
  const z = new StateVector(1);
  near('|0>: <Z>=+1', z.expectationZ(0), 1);
  near('|0>: <X>=0', z.expectationX(0), 0);
  near('|0>: <Y>=0', z.expectationY(0), 0);

  const plus = new StateVector(1).applyH(0);
  near('H|0>: <X>=+1', plus.expectationX(0), 1);
  near('H|0>: <Z>=0', plus.expectationZ(0), 0);
  near('H|0>: P(0)=0.5', plus.probabilities()[0], 0.5);

  near('X|0>: <Z>=-1', new StateVector(1).applyX(0).expectationZ(0), -1);
  near('H^2|0>: <Z>=+1', new StateVector(1).applyH(0).applyH(0).expectationZ(0), 1);
  near('RX(pi)|0>: P(1)=1', new StateVector(1).applyRX(0, Math.PI).probOne(0), 1);
  near('RX(pi)|0>: <Z>=-1', new StateVector(1).applyRX(0, Math.PI).expectationZ(0), -1);

  // |+i> = S H |0>, should sit on +Y
  const plusI = new StateVector(1).applyH(0).applyS(0);
  near('S H|0>: <Y>=+1', plusI.expectationY(0), 1);
  near('S H|0>: <Z>=0', plusI.expectationZ(0), 0);

  // RZ is invisible in the Z basis, but moves <X>/<Y>.
  const a = new StateVector(1).applyH(0);
  const xBefore = a.expectationX(0);
  a.applyRZ(0, 1.0);
  near('RZ keeps <Z>=0', a.expectationZ(0), 0);
  near('RZ keeps P(0)=0.5', a.probabilities()[0], 0.5);
  ok('RZ changes <X>', Math.abs(a.expectationX(0) - xBefore) > 0.1, `dX=${a.expectationX(0) - xBefore}`);

  // ...until a Hadamard turns the phase into a measurable swing.
  near('|+>,RZ(0),H: <Z>=+1', new StateVector(1).applyH(0).applyRZ(0, 0).applyH(0).expectationZ(0), 1);
  near('|+>,RZ(pi),H: <Z>=-1', new StateVector(1).applyH(0).applyRZ(0, Math.PI).applyH(0).expectationZ(0), -1);
  near('|+>,RZ(pi/2),H: <Z>=0', new StateVector(1).applyH(0).applyRZ(0, Math.PI / 2).applyH(0).expectationZ(0), 0);
}

// --- Two-qubit: CNOT, Bell, measurement correlation ---------------------------
{
  // CNOT truth table (control=qubit0, target=qubit1; little-endian indices).
  let sv = basis(2, 1); // |q1=0, q0=1>
  sv.applyCNOT(0, 1);
  near('CNOT: control=1 flips target', sv.probabilities()[3], 1); // -> |q1=1,q0=1>
  sv = basis(2, 0).applyCNOT(0, 1);
  near('CNOT: control=0 leaves target', sv.probabilities()[0], 1);

  // Bell state (|00>+|11>)/sqrt2 from H(0), CNOT(0,1).
  const bell = new StateVector(2).applyH(0).applyCNOT(0, 1);
  const p = bell.probabilities();
  near('Bell P(00)=0.5', p[0], 0.5);
  near('Bell P(11)=0.5', p[3], 0.5);
  near('Bell P(01)=0', p[1], 0);
  near('Bell P(10)=0', p[2], 0);
  const b0 = blochVector(bell, 0);
  near('Bell qubit0 reduced |r|=0 (x)', b0.x, 0);
  near('Bell qubit0 reduced |r|=0 (z)', b0.z, 0);

  // Measuring one qubit perfectly conditions the other.
  const m1 = new StateVector(2).applyH(0).applyCNOT(0, 1);
  const out1 = m1.measureQubit(0, () => 0.1); // 0.1 < 0.5 -> outcome 1
  ok('measure forces outcome 1', out1 === 1, `out=${out1}`);
  near('after q0=1, <Z(q1)>=-1', m1.expectationZ(1), -1);
  const m2 = new StateVector(2).applyH(0).applyCNOT(0, 1);
  const out2 = m2.measureQubit(0, () => 0.9); // 0.9 >= 0.5 -> outcome 0
  ok('measure forces outcome 0', out2 === 0, `out=${out2}`);
  near('after q0=0, <Z(q1)>=+1', m2.expectationZ(1), 1);
}

// --- (2) DFT correctness on a known signal ------------------------------------
{
  const N = 64;
  const f = new Float64Array(N);
  for (let k = 0; k < N; k++) f[k] = Math.cos(3 * (2 * Math.PI * k) / N); // cos(3x)
  const D = dft(f);
  near('DFT cos(3x): c_+3 = 0.5', D.re[3], 0.5, 1e-9);
  near('DFT cos(3x): c_-3 = 0.5', D.re[N - 3], 0.5, 1e-9);
  near('DFT cos(3x): c_+3 imag = 0', D.im[3], 0, 1e-9);
  let leak = 0;
  for (let m = 0; m < N; m++) if (m !== 3 && m !== N - 3) leak += D.mag[m];
  ok('DFT cos(3x): no leakage', leak < 1e-9, `leak=${leak}`);
}

// --- (3) THE GATE: re-uploading model is a truncated Fourier series -----------
function genParams(L) {
  // Deterministic, non-degenerate trainable blocks (none a multiple of pi).
  const p = [];
  for (let j = 0; j <= L; j++) p.push([0.5 + 0.37 * j, 1.1 + 0.21 * j, 0.8 + 0.13 * j]);
  return p;
}

const N = 256;
const TOL_NONZERO = 1e-6; // detection threshold; "zero" bins sit ~1e-14
const maxFreqByL = {};

for (let L = 1; L <= 6; L++) {
  const samples = reuploadSamples(L, genParams(L), N);
  const D = dft(samples);

  // (a) No spectral power beyond |n| = L.
  let outsidePower = 0;
  let maxAbsNonzero = 0;
  for (let m = 0; m < N; m++) {
    const freq = binToFreq(m, N);
    if (D.mag[m] > TOL_NONZERO) {
      if (Math.abs(freq) > maxAbsNonzero) maxAbsNonzero = Math.abs(freq);
      if (Math.abs(freq) > L) outsidePower += D.mag[m] * D.mag[m];
    }
  }
  ok(`L=${L}: no power beyond freq L`, outsidePower < 1e-12, `outsidePower=${outsidePower}`);

  // (b) The top frequency L is actually present (degree is exactly L).
  ok(`L=${L}: top frequency = L`, maxAbsNonzero === L, `maxAbsNonzero=${maxAbsNonzero}`);
  ok(`L=${L}: freq-L coefficient is robustly nonzero`, D.mag[L] > 1e-4, `|c_L|=${D.mag[L]}`);
  maxFreqByL[L] = maxAbsNonzero;

  // (c) Reality: c_{-n} = conj(c_n)  ->  re[N-n]=re[n], im[N-n]=-im[n].
  let realityErr = 0;
  for (let n = 1; n <= L; n++) {
    realityErr = Math.max(realityErr, Math.abs(D.re[N - n] - D.re[n]), Math.abs(D.im[N - n] + D.im[n]));
  }
  ok(`L=${L}: reality c_-n = conj(c_n)`, realityErr < 1e-9, `realityErr=${realityErr}`);

  // (d) Frequencies are exactly the integers (no non-integer leakage). Implied
  // by sampling a full period on N points, but assert it: only integer bins
  // carry weight, which they do by construction of the DFT bins.
}

// (d) L -> L+1 adds exactly one new top frequency.
for (let L = 1; L <= 5; L++) {
  ok(`increment: maxfreq(${L + 1}) = maxfreq(${L}) + 1`,
    maxFreqByL[L + 1] === maxFreqByL[L] + 1,
    `${maxFreqByL[L]} -> ${maxFreqByL[L + 1]}`);
}

// --- Report -------------------------------------------------------------------
console.log(`\nqsim verification: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error('\nFAILURES:');
  for (const f of fails) console.error('  - ' + f);
  process.exit(1);
} else {
  console.log('All checks passed. The Fourier payoff is verified against the simulator.');
}

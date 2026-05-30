// qsim.js — a tiny, dependency-free quantum statevector simulator.
//
// This single module is imported by BOTH the interactive toys (in each
// component's inline <script>) AND the Node verification harness
// (qsim.test.mjs). That is deliberate: the code that draws the Fourier
// payoff on the page is the exact code the gate verifies.
//
// Conventions (fixed once, matching research/TRACK_A_foundations.md):
//   - Rotations use the physics/Qiskit convention  R_P(t) = exp(-i t P / 2).
//       RZ(t) = diag(e^{-it/2}, e^{+it/2}).
//   - The data-encoding gate is  S(x) = e^{-i x Z / 2} = RZ(x)
//       (generator Z/2, eigenvalues +/- 1/2, gap 1 -> integer frequencies).
//   - Qubits are little-endian: qubit q is bit q of the amplitude index,
//       so basis index i has qubit q in state (i >> q) & 1. Qubit 0 is the
//       least significant bit.
//   - Amplitudes are held as two parallel Float64Arrays (re, im) of length 2^n,
//       so hot loops allocate nothing.
//   - Bloch vector of a (possibly reduced) qubit q is (<X>, <Y>, <Z>); for an
//       entangled qubit this lies inside the sphere, which is correct.

export class StateVector {
  constructor(nQubits) {
    this.nQubits = nQubits;
    this.dim = 1 << nQubits;
    this.re = new Float64Array(this.dim);
    this.im = new Float64Array(this.dim);
    this.re[0] = 1; // |00...0>
  }

  clone() {
    const sv = new StateVector(this.nQubits);
    sv.re.set(this.re);
    sv.im.set(this.im);
    return sv;
  }

  reset() {
    this.re.fill(0);
    this.im.fill(0);
    this.re[0] = 1;
    return this;
  }

  // Apply a single-qubit gate g = [[a,b],[c,d]] (each entry complex {*r,*i})
  // to qubit q. new0 = a*x0 + b*x1, new1 = c*x0 + d*x1.
  applySingle(q, g) {
    const { ar, ai, br, bi, cr, ci, dr, di } = g;
    const re = this.re, im = this.im;
    const bit = 1 << q;
    for (let i = 0; i < this.dim; i++) {
      if (i & bit) continue; // process each pair once, from the bit=0 index
      const j = i | bit;
      const x0r = re[i], x0i = im[i], x1r = re[j], x1i = im[j];
      re[i] = ar * x0r - ai * x0i + br * x1r - bi * x1i;
      im[i] = ar * x0i + ai * x0r + br * x1i + bi * x1r;
      re[j] = cr * x0r - ci * x0i + dr * x1r - di * x1i;
      im[j] = cr * x0i + ci * x0r + dr * x1i + di * x1r;
    }
    return this;
  }

  applyRX(q, t) {
    const c = Math.cos(t / 2), s = Math.sin(t / 2);
    return this.applySingle(q, { ar: c, ai: 0, br: 0, bi: -s, cr: 0, ci: -s, dr: c, di: 0 });
  }

  applyRY(q, t) {
    const c = Math.cos(t / 2), s = Math.sin(t / 2);
    return this.applySingle(q, { ar: c, ai: 0, br: -s, bi: 0, cr: s, ci: 0, dr: c, di: 0 });
  }

  applyRZ(q, t) {
    const c = Math.cos(t / 2), s = Math.sin(t / 2);
    // diag(e^{-it/2}, e^{+it/2})
    return this.applySingle(q, { ar: c, ai: -s, br: 0, bi: 0, cr: 0, ci: 0, dr: c, di: s });
  }

  applyH(q) {
    const h = Math.SQRT1_2;
    return this.applySingle(q, { ar: h, ai: 0, br: h, bi: 0, cr: h, ci: 0, dr: -h, di: 0 });
  }

  // Phase gate diag(1, e^{i lambda}). S = Phase(pi/2), T = Phase(pi/4).
  applyPhase(q, lambda) {
    return this.applySingle(q, { ar: 1, ai: 0, br: 0, bi: 0, cr: 0, ci: 0, dr: Math.cos(lambda), di: Math.sin(lambda) });
  }
  applyS(q) { return this.applyPhase(q, Math.PI / 2); }
  applyT(q) { return this.applyPhase(q, Math.PI / 4); }
  applyX(q) { return this.applySingle(q, { ar: 0, ai: 0, br: 1, bi: 0, cr: 1, ci: 0, dr: 0, di: 0 }); }
  applyY(q) { return this.applySingle(q, { ar: 0, ai: 0, br: 0, bi: -1, cr: 0, ci: 1, dr: 0, di: 0 }); }
  applyZ(q) { return this.applySingle(q, { ar: 1, ai: 0, br: 0, bi: 0, cr: 0, ci: 0, dr: -1, di: 0 }); }

  // The data-encoding gate S(x) = e^{-i x Z / 2}. Alias of RZ for readability
  // in the re-uploading model.
  encodeZ(q, x) { return this.applyRZ(q, x); }

  // Controlled-NOT: flip `target` where `control` is 1.
  applyCNOT(control, target) {
    const cb = 1 << control, tb = 1 << target;
    const re = this.re, im = this.im;
    for (let i = 0; i < this.dim; i++) {
      if ((i & cb) && !(i & tb)) {
        const j = i | tb;
        const tr = re[i], ti = im[i];
        re[i] = re[j]; im[i] = im[j];
        re[j] = tr; im[j] = ti;
      }
    }
    return this;
  }

  probabilities() {
    const re = this.re, im = this.im;
    const p = new Float64Array(this.dim);
    for (let i = 0; i < this.dim; i++) p[i] = re[i] * re[i] + im[i] * im[i];
    return p;
  }

  // <Z_q> = sum_i |amp_i|^2 * (+1 if bit q is 0 else -1)
  expectationZ(q) {
    const re = this.re, im = this.im;
    const bit = 1 << q;
    let s = 0;
    for (let i = 0; i < this.dim; i++) {
      const w = (i & bit) ? -1 : 1;
      s += w * (re[i] * re[i] + im[i] * im[i]);
    }
    return s;
  }

  // <X_q> = sum_{i: bit q = 0} 2*(re_i re_j + im_i im_j),  j = i with bit q set
  expectationX(q) {
    const re = this.re, im = this.im;
    const bit = 1 << q;
    let s = 0;
    for (let i = 0; i < this.dim; i++) {
      if (i & bit) continue;
      const j = i | bit;
      s += 2 * (re[i] * re[j] + im[i] * im[j]);
    }
    return s;
  }

  // <Y_q> = sum_{i: bit q = 0} 2*(re_i im_j - im_i re_j)
  expectationY(q) {
    const re = this.re, im = this.im;
    const bit = 1 << q;
    let s = 0;
    for (let i = 0; i < this.dim; i++) {
      if (i & bit) continue;
      const j = i | bit;
      s += 2 * (re[i] * im[j] - im[i] * re[j]);
    }
    return s;
  }

  // Probability that qubit q reads 1.
  probOne(q) {
    const re = this.re, im = this.im;
    const bit = 1 << q;
    let p = 0;
    for (let i = 0; i < this.dim; i++) if (i & bit) p += re[i] * re[i] + im[i] * im[i];
    return p;
  }

  // Single-shot measurement of the whole register. Returns the basis index.
  sample(rng = Math.random) {
    const r = rng();
    let acc = 0;
    const re = this.re, im = this.im;
    for (let i = 0; i < this.dim; i++) {
      acc += re[i] * re[i] + im[i] * im[i];
      if (r < acc) return i;
    }
    return this.dim - 1;
  }

  // Histogram of `shots` whole-register measurements.
  sampleCounts(shots, rng = Math.random) {
    const counts = new Int32Array(this.dim);
    for (let n = 0; n < shots; n++) counts[this.sample(rng)]++;
    return counts;
  }

  // Projectively measure qubit q, collapse the state, and return the outcome
  // (0 or 1). After this, the other qubits' conditional distribution can be
  // read with probabilities()/expectation*().
  measureQubit(q, rng = Math.random) {
    const bit = 1 << q;
    const p1 = this.probOne(q);
    const outcome = rng() < p1 ? 1 : 0;
    const re = this.re, im = this.im;
    let norm = 0;
    for (let i = 0; i < this.dim; i++) {
      const keep = (((i & bit) ? 1 : 0) === outcome);
      if (!keep) { re[i] = 0; im[i] = 0; }
      else norm += re[i] * re[i] + im[i] * im[i];
    }
    const s = norm > 0 ? 1 / Math.sqrt(norm) : 0;
    for (let i = 0; i < this.dim; i++) { re[i] *= s; im[i] *= s; }
    return outcome;
  }
}

// Bloch vector (<X>,<Y>,<Z>) of qubit q within state sv (default qubit 0).
export function blochVector(sv, q = 0) {
  return { x: sv.expectationX(q), y: sv.expectationY(q), z: sv.expectationZ(q) };
}

// Inverse map: a Bloch vector to (theta, phi). For mixed/interior vectors,
// theta/phi describe the direction; the length is |r|.
export function anglesFromBloch({ x, y, z }) {
  const r = Math.hypot(x, y, z);
  const zc = Math.max(-1, Math.min(1, r > 0 ? z / r : z));
  return { theta: Math.acos(zc), phi: Math.atan2(y, x), r };
}

// Discrete Fourier transform of real samples taken at x_k = 2*pi*k/N.
// Returns coefficients c_m = (1/N) sum_k f_k e^{-i 2pi m k / N}, so that
// f_k = sum_m c_m e^{i 2pi m k / N}. For a Fourier series with integer
// frequencies, frequency n maps to bin n (n>=0) and bin N+n (n<0). Naive
// O(N^2) is ample for N up to a few hundred and matches the harness exactly.
export function dft(samples) {
  const N = samples.length;
  const re = new Float64Array(N);
  const im = new Float64Array(N);
  const mag = new Float64Array(N);
  for (let m = 0; m < N; m++) {
    let sr = 0, si = 0;
    for (let k = 0; k < N; k++) {
      const ang = (-2 * Math.PI * m * k) / N;
      sr += samples[k] * Math.cos(ang);
      si += samples[k] * Math.sin(ang);
    }
    re[m] = sr / N;
    im[m] = si / N;
    mag[m] = Math.hypot(re[m], im[m]);
  }
  return { N, re, im, mag };
}

// Map a DFT bin index to a signed frequency (… -2,-1,0,1,2 …).
export function binToFreq(m, N) {
  return m <= N / 2 ? m : m - N;
}

// 2x2 matrix of a named gate, as complex [re,im] pairs, for the toy 3 display.
export function gateMatrix(name, t = 0) {
  const c = Math.cos(t / 2), s = Math.sin(t / 2), h = Math.SQRT1_2;
  switch (name) {
    case 'RX': return [[[c, 0], [0, -s]], [[0, -s], [c, 0]]];
    case 'RY': return [[[c, 0], [-s, 0]], [[s, 0], [c, 0]]];
    case 'RZ': return [[[c, -s], [0, 0]], [[0, 0], [c, s]]];
    case 'H': return [[[h, 0], [h, 0]], [[h, 0], [-h, 0]]];
    case 'X': return [[[0, 0], [1, 0]], [[1, 0], [0, 0]]];
    case 'Y': return [[[0, 0], [0, -1]], [[0, 1], [0, 0]]];
    case 'Z': return [[[1, 0], [0, 0]], [[0, 0], [-1, 0]]];
    case 'S': return [[[1, 0], [0, 0]], [[0, 0], [0, 1]]];
    case 'T': return [[[1, 0], [0, 0]], [[0, 0], [h, h]]];
    default: return [[[1, 0], [0, 0]], [[0, 0], [1, 0]]];
  }
}

// ---------------------------------------------------------------------------
// The single-qubit data re-uploading model (the payoff). Building it here, in
// the shared core, guarantees the page's toy and the verification harness run
// the identical circuit.
//
// U(x) = W^{(L+1)} S(x) W^{(L)} ... S(x) W^{(1)},  observable Z,  f(x) = <Z>.
// Each trainable block W is a general single-qubit rotation RZ(c) RY(b) RZ(a).
// `params` is an array of L+1 triples [a,b,c].
// ---------------------------------------------------------------------------
export function applyTrainableBlock(sv, q, [a, b, c]) {
  sv.applyRZ(q, a);
  sv.applyRY(q, b);
  sv.applyRZ(q, c);
  return sv;
}

export function reuploadValue(x, L, params) {
  const sv = new StateVector(1);
  applyTrainableBlock(sv, 0, params[0]);
  for (let j = 0; j < L; j++) {
    sv.encodeZ(0, x); // S(x) = e^{-i x Z/2}
    applyTrainableBlock(sv, 0, params[j + 1]);
  }
  return sv.expectationZ(0);
}

// Sample f(x) = <Z> over a full period [0, 2*pi) on N points.
export function reuploadSamples(L, params, N) {
  const f = new Float64Array(N);
  for (let k = 0; k < N; k++) {
    f[k] = reuploadValue((2 * Math.PI * k) / N, L, params);
  }
  return f;
}

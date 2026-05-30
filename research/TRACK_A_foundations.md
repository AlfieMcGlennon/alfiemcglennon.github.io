# Single-Qubit Foundations of Data Re-uploading: From the Bloch Sphere to a Truncated Fourier Series

*Track A (foundations). Internal deliverable. British English. Every load-bearing claim is pinned to a primary source; bracketed keys resolve in the annotated bibliography (§5).*

---

## Conventions fixed for this document (read first)

The literature agrees on the *physics* of single-qubit gates but **not** on the global-phase choices for individual gates: Nielsen & Chuang's `R_z`, `S`, `T` and "phase gate" act identically up to a global phase yet carry different overall phases. To avoid ambiguity, this document fixes one convention set and uses it throughout:

- **Rotation convention:** `R_P(t) = exp(-i t P / 2)` for `P ∈ {X, Y, Z}` (the physics/Qiskit sign convention) [NC-ch4-sol; Qiskit-RX; Qiskit-RZ].
- **Encoding generator:** the data-encoding gate is `S(x) = e^{-i x Z/2}`, i.e. generator `H = Z/2` with eigenvalues `±½` and **gap 1**. This choice makes the accessible Fourier frequencies the clean integers `0, 1, …, L` (see §3–§4). The alternative gauge `H = Z` (Pauli eigenvalues `±1`, gap 2) appears in places in Schuld–Sweke–Meyer and gives `Ω = {−2, 0, 2}` at a single layer; the gauge-independent statement is **base frequency = eigenvalue gap of the encoding generator** [SchuldSwekeMeyer2021].
- **Global phase is unobservable**, so where a gate is only needed up to global phase we use the symmetric `R_Z` form rather than the phase-gate form `P(λ) = diag(1, e^{iλ})`. These differ by `P(λ) = e^{iλ/2} R_Z(λ)` [Qiskit-RZ].

Open global-phase questions are tracked in §6.

---

## Part I — States, gates, measurement

### 1.1 The qubit state and the Bloch sphere

A pure single-qubit state is, in full generality,

> `|ψ⟩ = α|0⟩ + β|1⟩`, with `α, β ∈ ℂ` and `|α|² + |β|² = 1` (N&C eq. 1.1) [N&C-ch1].

Using normalisation, N&C rewrite this (eq. 1.3) as

> `|ψ⟩ = e^{iγ}( cos(θ/2)|0⟩ + e^{iφ} sin(θ/2)|1⟩ )`,

and state verbatim that we "*can* **ignore** the factor of `e^{iγ}` out the front, because it has **no observable effects**", giving (eq. 1.4)

> `|ψ⟩ = cos(θ/2)|0⟩ + e^{iφ} sin(θ/2)|1⟩` [N&C-ch1].

N&C: "The numbers θ and φ define a point on the unit three-dimensional sphere … This sphere is often called the **Bloch sphere**" [N&C-ch1]. The standard ranges are `0 ≤ θ ≤ π` (polar/colatitude angle measured from the +z = |0⟩ pole) and `0 ≤ φ < 2π` (azimuth) [Wiki-Bloch].

**Two real degrees of freedom.** A normalised state in ℂ² carries four real numbers (two complex amplitudes); normalisation removes one, and the unobservable global phase `e^{iγ}` removes another, leaving exactly **two** real parameters, θ and φ — the angular coordinates of a point on the sphere's surface [Wiki-Bloch; qubit.guide]. Wikipedia states the reduction explicitly: "only the relative phase between the coefficients … has any physical meaning," so the global phase can be fixed (e.g. by making the |0⟩ coefficient real and non-negative), "giving rise to the three dimensions of the Bloch sphere" [Wiki-Bloch] — three Cartesian coordinates constrained to the unit sphere, i.e. two free angles. qubit.guide makes the same point: "states that are identical up to a global phase are physically indistinguishable," whereas the **relative phase φ** is physical [qubit.guide].

**φ (relative phase) is physical — and is the seat of interference.** The relative phase φ is *not* a redundant gauge freedom like γ: it is a genuine coordinate (it sets the longitude). It has no effect on the *computational-basis* outcome distribution but governs outcomes in any other basis (see §1.3). Multiple independent sources state that phase information is accessed through interference under a basis change: "By applying Hadamard gates before measurement, the relative phase influences measurement outcomes through interference effects of probability amplitudes"; states differing only in relative phase "have different phases that allow quantum algorithms to perform interference" [postquantum-Had; researchgate-Phases].

**Bloch vector = Pauli expectations.** The point on the sphere has Cartesian coordinates

> `(x, y, z) = (sinθ cosφ, sinθ sinφ, cosθ) = (⟨X⟩, ⟨Y⟩, ⟨Z⟩)`.

IBM Quantum Learning gives the density-matrix form `ρ = ½( I + sinθ cosφ · σ_x + sinθ sinφ · σ_y + cosθ · σ_z )` [IBM-Bloch]; Wikipedia states these components "are the expectations of the three Pauli matrices X, Y, Z" [Wiki-Bloch]. Note that **`z = cosθ` depends on θ only, not φ** — which is exactly why an `R_Z` rotation (which changes φ) is invisible to a Z-measurement (§1.3).

### 1.2 Single-qubit gates as rotations (exact matrices)

**Pauli and basic gates** (N&C; corroborated by Wikipedia's quantum-logic-gate page) [Wiki-Gate]:

```
X = [0 1]      Y = [0 -i]     Z = [1  0]     H = 1/√2 [1  1]
    [1 0]          [i  0]         [0 -1]              [1 -1]

S = [1 0]      T = [1     0    ]
    [0 i]          [0  e^{iπ/4}]
```

Properties: `S² = Z`, `T² = S`, `T⁴ = Z`; T is sometimes called the "π/8 gate" (a historical misnomer from writing it as `e^{iπ/8}·diag(e^{-iπ/8}, e^{iπ/8})`) [Wiki-Gate; arXiv-CliffordT]. The Hadamard is Hermitian and unitary (`H² = I`) and effects the basis swap `HZH = X`, `HXH = Z` — "it flips x̂ and ẑ" on the Bloch sphere [Wiki-Gate; QSNP-X].

**Rotation operators — the `e^{-i t P/2}` convention.** N&C Chapter 4 defines, for a Pauli `P ∈ {X, Y, Z}`, the rotation by angle t about that axis as `R_P(t) = exp(-i t P / 2)`. Because every Pauli squares to I, the exponential closes into

> `R_n̂(t) = exp(-i t (n̂·σ)/2) = cos(t/2) I − i sin(t/2)(n_x X + n_y Y + n_z Z)` (N&C eq. 4.8) [NC-ch4-sol].

The three coordinate rotations are (N&C eqs. 4.4–4.6) [NC-ch4-sol; Wiki-Gate; Qiskit-RX; Qiskit-RZ]:

```
RX(t) = exp(-i t X/2) = [ cos(t/2)   -i sin(t/2) ]
                        [-i sin(t/2)   cos(t/2)  ]

RY(t) = exp(-i t Y/2) = [ cos(t/2)   -sin(t/2) ]
                        [ sin(t/2)    cos(t/2) ]

RZ(t) = exp(-i t Z/2) = [ e^{-i t/2}     0     ]
                        [    0       e^{+i t/2} ]
```

Sign/convention points that must be carried correctly:

- The **minus sign** in `e^{-i t P/2}` is the physics convention (active rotation of the state by +t about the axis, right-hand rule). Qiskit's official docs use the identical sign: `RX(θ) = exp(-i θ/2 X)`, `RZ(φ) = exp(-i φ/2 Z) = diag(e^{-iφ/2}, e^{+iφ/2})` [Qiskit-RX; Qiskit-RZ].
- The **half-angle (t/2)** is intrinsic: a 2π rotation gives `R_P(2π) = −I` (the spin-½ double cover — a sign flip at `t = 2π`). To return the *state vector* to itself you need `t = 4π`.
- `R_Z(t)` and the **phase gate** `P(λ) = diag(1, e^{iλ})` differ by a global phase: `P(λ) = e^{iλ/2} R_Z(λ)` (Qiskit: "U1(θ=φ) = e^{iφ/2} RZ(φ)") [Qiskit-RZ]. They act identically on observables but are *not* the same matrix. Likewise `S = P(π/2)` and `T = P(π/4)` are phase-gate forms, not the symmetric `R_Z` forms. Relatedly `R_Z(π) = diag(e^{-iπ/2}, e^{iπ/2}) = −iZ`, i.e. equals Z only up to the global phase `−i`.

### 1.3 Measurement, the Born rule, and the "`R_Z` is invisible until you interfere" lesson

**Computational (Z) basis measurement and the Born rule.** N&C (eq. 1.1 discussion): for `|ψ⟩ = α|0⟩ + β|1⟩`, "when we measure a qubit we get either the result 0, with probability `|α|²`, or the result 1, with probability `|β|²`" [N&C-ch1]. More generally (Born rule), measuring an observable A returns one of its eigenvalues `a_j` with probability `|⟨φ_j|ψ⟩|²`, where `|φ_j⟩` is the corresponding eigenvector, and the post-measurement state collapses onto `|φ_j⟩` [Wiki-Expect; N&C-ch1]. The computational basis is the eigenbasis of Z: |0⟩ has Z-eigenvalue +1, |1⟩ has −1.

**Expectation values.** `⟨A⟩ = ⟨ψ|A|ψ⟩`, equivalently the eigenvalue-weighted average `⟨A⟩ = Σ_j a_j |⟨φ_j|ψ⟩|²` [Wiki-Expect]. For the Pauli observables on `|ψ⟩ = α|0⟩ + β|1⟩`:

- `⟨Z⟩ = |α|² − |β|² = cosθ` (eigenvalues ±1 weighted by the Z-basis Born probabilities) [Wiki-Expect; IBM-Bloch].
- `⟨X⟩ = sinθ cosφ`, `⟨Y⟩ = sinθ sinφ` — the other two Bloch-vector components [IBM-Bloch].

**The rigorous lesson (verified numerically).** Take `α = cos(θ/2)`, `β = e^{iφ} sin(θ/2)`. Then `|β|² = sin²(θ/2)` is **independent of φ**. Hence the Z-basis outcome distribution `(|α|², |β|²)` — and therefore `⟨Z⟩ = cosθ` — is **completely insensitive to the relative phase φ**. An `R_Z(λ)` rotation maps `φ → φ + λ`: it slides the Bloch vector around a line of latitude (constant θ), changing `⟨X⟩` and `⟨Y⟩` but leaving `⟨Z⟩` and the entire Z-basis statistics untouched. This is the precise sense in which **"`R_Z` is invisible in the Z-basis."**

The phase becomes observable only after a basis change that rotates the φ-information onto the z-axis. The canonical move is a Hadamard, which is exactly the change of basis between the Z eigenbasis `{|0⟩,|1⟩}` and the X eigenbasis `{|+⟩, |−⟩}`, where `|±⟩ = (|0⟩ ± |1⟩)/√2`; measuring in the X basis is implemented as "apply H, then measure in Z" [QSNP-X; postquantum-Had]. Because `H X H = Z`, a Z-measurement *after* H reads out `⟨X⟩` of the original state — which *does* depend on φ.

Concretely, starting from `|+⟩` (θ = π/2, φ = 0) and applying `R_Z(φ)` then H, the Z-basis probabilities after H are (NumPy-verified):

| φ | Z-basis P(0),P(1) *before* H | after H: P(0),P(1) | ⟨X⟩, ⟨Y⟩, ⟨Z⟩ before H |
|---|---|---|---|
| 0    | 0.5, 0.5 | 1.0, 0.0 | +1, 0, 0 |
| π/2  | 0.5, 0.5 | 0.5, 0.5 |  0, +1, 0 |
| π    | 0.5, 0.5 | 0.0, 1.0 | −1, 0, 0 |

The middle column never moves off 50/50 (φ is invisible to Z); the right column sweeps deterministically from |0⟩ to |1⟩ as φ runs 0 → π (φ is fully visible after H). That deterministic sweep **is** interference: the two computational-basis amplitudes are made to add in phase or in anti-phase at the H output.

### 1.4 Mapping to the three toys

- **Toy 1 (Bloch sphere):** state ↔ point `(sinθ cosφ, sinθ sinφ, cosθ) = (⟨X⟩,⟨Y⟩,⟨Z⟩)`; θ = colatitude, φ = longitude; poles = |0⟩, |1⟩; equator = relative-phase circle [N&C-ch1; Wiki-Bloch; IBM-Bloch].
- **Toy 2 (flatten to RY slice):** setting φ = 0 confines the state to the real `x–z` great circle (the |0⟩↔|+⟩↔|1⟩↔|−⟩ meridian); on this slice the only gate that moves you is `R_Y(θ)`, whose matrix is fully real [NC-ch4-sol; Wiki-Gate].
- **Toy 3 (rotation simulator):** RX/RY/RZ as Bloch rotations about x/y/z by angle t under `e^{-i t P/2}`; demonstrate that `R_Z` alone never changes the Z-readout, but `R_Z`-then-H does [NC-ch4-sol; Qiskit-RZ; verified in §1.3].

---

## Part II — Single-qubit data re-uploading as a truncated Fourier series (full derivation)

### 2.1 The two primary sources and their division of labour

- **Pérez-Salinas, Cervera-Lierta, Gil-Fuster & Latorre (2020)** introduced the *data re-uploading* single-qubit classifier and argued for universality by analogy with the Universal Approximation Theorem [PerezSalinas2020]. Their model alternates a data-encoding rotation with a trainable SU(2) rotation — **Eq. (1)**: `𝒰(φ,x) = U(φ_N)U(x)…U(φ_1)U(x)`, processed state **Eq. (2)** `|ψ⟩ = 𝒰(φ,x)|0⟩`, trainable block in Euler form **Eq. (12)** `U(φ) = e^{iφ₂σ_z} e^{iφ₁σ_y} e^{iφ₃σ_z}`. Their framing is a neural-network/universal-approximation analogy (their §3.2) — "layers act like nonlinear activations / hidden neurons" — **not** an explicit Fourier series.
- **Schuld, Sweke & Meyer (2021)** supply the rigorous Fourier-series analysis [SchuldSwekeMeyer2021]. The derivation below is theirs (equation numbers confirmed against the ar5iv rendering of arXiv:2008.08605).

The two are consistent: Pérez-Salinas' alternating circuit is exactly the "serial" model that Schuld–Sweke–Meyer expand as a Fourier series.

### 2.2 The circuit (one qubit, one real feature x, L encoding layers)

Following Schuld–Sweke–Meyer **Eq. (3)–(4)**:

```
f_θ(x) = ⟨0| U†(x,θ) M U(x,θ) |0⟩
U(x,θ) = W^{(L+1)} S(x) W^{(L)} S(x) … W^{(2)} S(x) W^{(1)}
```

- `S(x) = e^{-i x H}` is the **data-encoding** gate. We take the Pauli-Z generator with the conventional ½ factor, `H = Z/2`, so `S(x) = e^{-i x Z/2} = cos(x/2) I − i sin(x/2) Z`. Eigenvalues of `H` are `{−½, +½}`, **gap = 1**.
- `W^{(j)}(θ_j)` are arbitrary trainable single-qubit unitaries (e.g. Euler form `Rz Ry Rz`, three real parameters each), interleaved `L+1` times.
- Observable `M = Z`; `f(x) = ⟨Z⟩`.

There are **L data-encoding gates** — the model degree is set by the number of *encodings*, not by the number of trainable blocks.

### 2.3 Why the model is a Fourier series, and why H's eigenvalue **gap** sets the base frequency

Diagonalise the generator once, `H = V Σ V†` with `Σ = diag(λ₁,…,λ_d)` (here `d = 2`, `λ = ±½`). Each encoding gate factorises as `S(x) = V e^{-i x Σ} V†`. Pushing the diagonal data-dependent phase `e^{-i x Σ}` through the circuit, every matrix entry of `U(x,θ)` becomes a sum of terms carrying a phase `e^{-i x (λ_{j_1}+…+λ_{j_L})}` — one eigenvalue index per encoding layer. Because `f` is the sandwich `U†(…) M U(…)`, each contribution carries the **difference** of an eigenvalue-sum from the ket side and one from the bra side. Hence (Schuld–Sweke–Meyer **Eq. (10)–(11)**):

```
f(x) = Σ_{ω ∈ Ω} c_ω e^{i ω x},
Ω = { Λ_k − Λ_j : Λ_k = λ_{k_1}+…+λ_{k_L},  k,j ∈ [d]^L }.
```

So the **frequencies are differences of sums of the encoding generator's eigenvalues**; the paper states "the frequency spectrum Ω is solely determined by the eigenvalues of the data-encoding Hamiltonians while the design of the entire circuit controls the coefficients" [SchuldSwekeMeyer2021]. This is why the *gap* is the operative quantity: with two eigenvalues `λ±`, the smallest nonzero frequency producible by a *single* encoding layer is the gap `λ₊ − λ₋`. For `H = Z/2` the gap is `(+½) − (−½) = 1`, the base (fundamental) frequency. Rescaling the generator `H → αH` rescales the whole spectrum by α — the formal content of "the gap sets the base frequency".

**Convention caution (load-bearing).** The paper sometimes presents the single-layer spectrum as `Ω = {−2, 0, 2}` because it momentarily takes the *Pauli* eigenvalues `±1` (gap 2). With the physics-standard generator `H = σ/2` they explicitly write "`H = ½σ … γ = ½`", giving gap 1 and integer frequencies. The invariant, gauge-independent statement is: **base frequency = eigenvalue gap of the encoding generator**. This document fixes `S(x) = e^{-i x Z/2}` (gap 1) so the accessible frequencies are the clean integers `0, 1, …, L`.

### 2.4 The spectrum for L layers: integers `{−L,…,L}`, degree L

With `λ = ±½`, a sum of L eigenvalues `Λ_k = λ_{k_1}+…+λ_{k_L}` ranges over `{−L/2, −L/2+1, …, +L/2}` in integer steps. A difference `Λ_k − Λ_j` of two such sums therefore ranges over **consecutive integers**:

```
Ω = {−L, −(L−1), …, −1, 0, 1, …, L−1, L}.
```

This matches Schuld–Sweke–Meyer's single-qubit Pauli result (their §II.2) `Ω = {−r,…,r}` for r repetitions [SchuldSwekeMeyer2021]. The model is a **real Fourier series of degree L** with **accessible nonnegative integer frequencies `{0, 1, …, L}`** (the negative ones are fixed by reality; §2.6).

**Adding one layer adds exactly one top frequency.** Going `L → L+1` appends one more encoding `S(x)`, so the maximal eigenvalue-sum increases by `+½` on each side and the maximal frequency `Λ_max − Λ_min` increases by exactly `1`: the spectrum grows from `{−L,…,L}` to `{−(L+1),…,L+1}`, i.e. precisely one new top (positive) frequency `L+1` and its conjugate `−(L+1)`. The fill-in stays dense because the eigenvalue gap is 1.

### 2.5 How the coefficients depend on the trainable blocks

Schuld–Sweke–Meyer **Eq. (12)**:

```
c_ω = Σ_{(k,j): Λ_k − Λ_j = ω}  a_{k,j},
```

where each `a_{k,j}` is a **product of matrix elements of the trainable unitaries `W^{(1)},…,W^{(L+1)}`** (in the eigenbasis of H, via V) **and of the observable M**, summed over all index paths `(k,j) ∈ [d]^L × [d]^L` whose eigenvalue-sum difference equals ω. Concretely `a_{k,j}` is a length-`(L+1)` chain of `W`-entries on the bra side times a chain on the ket side, contracted with M. So: **the encoding gates fix `Ω` (which frequencies); the trainable blocks and observable fix the `c_ω` (the amplitudes/phases).** The `V, V†` of the encoding are absorbed into the `W` blocks in this accounting (Schuld–Sweke–Meyer Eq. (9)) [SchuldSwekeMeyer2021].

### 2.6 Reality and the constraints — what a single qubit *cannot* do

- **Reality.** Because `f(x) = ⟨ψ(x)| M |ψ(x)⟩` with `M = Z` Hermitian, `f(x)` is real, forcing `c_{−ω} = c_ω*` (stated after Eq. (12)). Hence `f(x) = c₀ + Σ_{n=1}^{L} 2|c_n| cos(n x + arg c_n)` — a degree-L real trig polynomial, with `c₀` real.
- **L = 1 collapses to one tone.** With a single encoding the model reduces to a single sinusoid: Schuld–Sweke–Meyer give `f(x) = c₀ + 2|c_2| cos(2x̃ − arg c_2)` in their `±1` gauge — one frequency only, equivalently `A sin(γx + B) + C`. This is the sanity floor.
- **Spectrum is saturable on one qubit, but the coefficients are NOT independently/freely controllable.** A single qubit with L layers *does* reach the full integer spectrum `{0,…,L}`, but it **cannot realise an arbitrary set of degree-L Fourier coefficients**. Reasons given in the paper (their §II.3 and Fig. 5): (i) a counting bound — "to arbitrarily control K+1 complex Fourier coefficients you need at least `M ≥ 2K+1` real degrees of freedom"; (ii) the number of index-paths contributing to a coefficient *shrinks* toward the top frequency (fewer ways to build large `|n|`), so high-frequency coefficients are structurally small/correlated; (iii) a fixed ansatz "may structurally set a certain Fourier coefficient to zero." On a single qubit the `W` blocks are only `2×2` (three real angles each), so the reachable coefficient vectors form a constrained manifold, not all of `ℂ^{L+1}`.
- **Universality is asymptotic and is a *spectrum* statement, not a single-qubit *coefficient* statement** (full theorem in §3.3). The construction grows the system (`m` qubits / parallel encodings) and does **not** claim a *single* qubit realises arbitrary coefficients. Pérez-Salinas' universality claim [PerezSalinas2020, §3.2] is the looser neural-network analogy (enough re-uploadings ≈ enough hidden neurons), not a proof that one qubit attains arbitrary degree-L coefficients.

**Recommended framing for the page:** "a single re-uploading qubit gives a degree-L Fourier series with integer frequencies `0…L`; depth controls the *bandwidth*, but the achievable *coefficients* are restricted — full coefficient control / universality needs more width (qubits/parallel encodings)."

### 2.7 Numerical sanity check — PASSED

The exact circuit was built in NumPy: `S(x) = e^{-i x Z/2}`, trainable `W = Rz(θ₂)Ry(θ₁)Rz(θ₃)` (random angles), `f(x) = ⟨0|U† Z U|0⟩`, swept `x` over `[0, 2π)` on a 256-point grid, then DFT'd. Script at `C:\Users\alfie\reupload_check.py`. Results for several depths:

```
L=1: nonzero integer freqs = [-1, 0, 1],                   max|n|=1, power outside |n|<=L = 1.0e-31, max|c_n - conj(c_-n)| = 0.0e+00
L=2: nonzero integer freqs = [-2,-1,0,1,2],                max|n|=2, power outside |n|<=L = 1.5e-31, max|c_n - conj(c_-n)| = 5.6e-17
L=3: nonzero integer freqs = [-3,-2,-1,0,1,2,3],           max|n|=3, power outside |n|<=L = 1.7e-31, max|c_n - conj(c_-n)| = 1.4e-17
L=5: nonzero integer freqs = [-5,-4,-3,-2,-1,0,1,2,3,4,5], max|n|=5, power outside |n|<=L = 2.2e-31, max|c_n - conj(c_-n)| = 5.6e-17
```

Confirms, to machine precision: (a) nonzero DFT weight sits **only at integer frequencies**; (b) the spectrum is exactly `{−L,…,L}` (degree L, base frequency 1 from the gap); (c) `L→L+1` adds exactly one new top frequency; (d) the reality condition `c_n = c_{−n}*` holds (`~1e-17`). Power at non-integer/beyond-L bins is at the `1e-31` floor.

### 2.8 One-paragraph statement the explainer can verify against

> *With `S(x) = e^{-ixZ/2}` (generator eigenvalues `±½`, gap 1) repeated L times and interleaved with arbitrary single-qubit trainable rotations, measuring `⟨Z⟩` gives `f(x) = Σ_{n=−L}^{L} c_n e^{inx}` with `c_{−n} = c_n*` — a real Fourier series of degree L with accessible integer frequencies `0,1,…,L`. The frequencies come from differences of sums of the encoding generator's eigenvalues, so the eigenvalue gap (1) is the base frequency and each extra layer adds exactly one new top frequency. The trainable blocks and observable set the coefficients `c_n`, but on a single qubit those coefficients cannot all be chosen independently; full coefficient control/universality requires additional width.*

---

## Part III — The Schuld–Sweke–Meyer spectrum result, and what each knob changes

### 3.1 The general result (any encoding, any width/depth)

**The model.** The model is the expectation value of an observable on a circuit alternating *trainable* blocks W and *data-encoding* blocks S(x):

- Eq. (3): `f_θ(x) = ⟨0| U†(x,θ) M U(x,θ) |0⟩`.
- Eq. (4): `U(x) = W^{(L+1)} S(x) W^{(L)} … W^{(2)} S(x) W^{(1)}`, with L "layers". Each encoding block is `S(x) = e^{−ixH}` (time evolution of a generator Hamiltonian H); the canonical case is Pauli rotations `H = ½σ` for `σ ∈ {σ_x, σ_y, σ_z}` (γ = ½). Trainable blocks W = W(θ) are treated as arbitrary unitaries.

**Headline representation.** The model is naturally a Fourier-type sum:

- Eq. (1): `f_θ(x) = Σ_{ω ∈ Ω} c_ω(θ) e^{iωx}`.
- For integer-valued frequencies, Ω ⊂ ℤ^N and this is a multivariate **partial Fourier series**, Eq. (2): `f_θ(x) = Σ_{n ∈ Ω} c_n(θ) e^{inx}` ("partial" because only a subset of coefficients are non-zero). Introduction, verbatim: *"the frequency spectrum Ω ⊂ ℝ^N is solely determined by the eigenvalues of the data-encoding Hamiltonians while the design of the entire circuit controls the coefficients c_ω."* [SchuldSwekeMeyer2021]

**What sets the accessible spectrum (the theorem).** Diagonalise the generator, `H = V†ΣV` (Σ holds eigenvalues `λ_1,…,λ_d`). With multi-index `j = (j_1,…,j_L) ∈ [d]^L` and the *sum of eigenvalues* `Λ_j = λ_{j_1} + … + λ_{j_L}` (one index per encoding layer), the model collapses to

- Eq. (8): `f(x) = Σ_{k,j ∈ [d]^L} e^{i(Λ_k − Λ_j) x} a_{k,j}`,

so accessible frequencies are *differences of sums of eigenvalues*:

- **Eq. (10): `Ω = { Λ_k − Λ_j : k,j ∈ [d]^L }`.**

Properties: `0 ∈ Ω`; `ω ∈ Ω ⇒ −ω ∈ Ω` (symmetric spectrum); degree `D = max(Ω)`; size `K = (|Ω|−1)/2`. [SchuldSwekeMeyer2021]

**What sets the coefficients (and the constraints).** Grouping terms of equal frequency:

- Eq. (11): `f(x) = Σ_{ω∈Ω} c_ω e^{iωx}`, with
- **Eq. (12): `c_ω = Σ_{k,j: Λ_k−Λ_j=ω} a_{k,j}`,** where the `a_{k,j}` (Eq. (9)) collect the contributions of the trainable unitaries `W^{(1)}…W^{(L+1)}` (which have *absorbed* the V, V† of the encoding) and the measurement observable M. So coefficients are controlled by the whole remaining circuit, not the encoding. Constraints: `c_ω = c*_{−ω}` (so f is real-valued); and crucially *the coefficients are not free* — "these Fourier coefficients are not arbitrary, but functions of the limited degrees of freedom of the quantum circuit, and a quantum circuit of a certain structure may only be able to realise a small subset of the entire set of all possible Fourier coefficients {c_n}." To control `K+1` complex coefficients arbitrarily one needs **at least `M ≥ 2K+1` real trainable parameters**. [SchuldSwekeMeyer2021]

### 3.2 The three knobs, made precise

- **(a) More re-uploading layers (L, encoding repeated in *series*).** For a single-qubit Pauli rotation repeated in `L = r` layers (same generator each time), diagonalising gives `Σ = ½σ_z` per layer and a spectrum that is a sum of `2r` terms of value `±½` — Eq. (26): `Ω_seq = {(λ_{k_1}+…+λ_{k_r}) − (λ_{j_1}+…+λ_{j_r})}`, evaluating to the **integers `{−r,…,0,…,r}`** (degree r). Repeating the *same* encoding gate L times grows the degree **linearly**: `K = L`. [SchuldSwekeMeyer2021]

- **(b) More qubits (encoding in *parallel*, single layer L = 1).** For r single-qubit Pauli rotations on r different qubits (commuting), Eq. (18)–(21) give `Σ = diag(λ_1,…,λ_{2^r})` with `r+1` unique eigenvalues `λ_p = p − r/2`, `p ∈ {0,…,r}`. The spectrum is **Eq. (22)–(25): `Ω_par = {−r,…,0,…,r}`**, again degree r. The paper states explicitly that the two strategies coincide: **`Ω_seq = Ω_par`** — parallel (qubits) and series (layers) "extend the Fourier spectrum in the same manner" for single-qubit Pauli encodings. [SchuldSwekeMeyer2021]

- **(c) Trainable vs fixed encoding generators (eigenvalue structure).** The general bound on spectrum size for L repetitions of an encoding gate of dimension d (Eq. (27)): **`K ≤ d^{2L}/2 − 1`.** This bound is tight only if the eigenvalue *sums* `Λ_j` are non-degenerate. For the *same* single-qubit gate repeated, degeneracy collapses it to `K = L` (linear); but encoding generators whose eigenvalues are e.g. *incommensurate / exponentially spaced* let a few repetitions realise an exponentially large, non-degenerate spectrum. So the *generator's eigenvalues* — not merely the count of gates — set how rich the spectrum is. This is the lever a *trainable / designed* encoding pulls: it changes Ω itself, whereas a fixed Pauli encoding fixes Ω to integers. (The paper notes ref. [17], Pérez-Salinas, proposed making input-rescaling hyperparameters trainable for "adaptive frequency matching".) [SchuldSwekeMeyer2021]

### 3.3 Universality (the asymptotic theorem)

Define a *universal Hamiltonian family* `{H_m}`: for all `K ∈ ℕ` there is some m with `ℤ_K = {−K,…,0,…,K} ⊆ Ω_{H_m}` (Eq. (37)); the tensor-product Pauli family `H_m = Σ_{i=1}^m σ^{(i)}` is universal with `m = K` (Eq. (34), (36)). Theorem (p. 9, verbatim):

> **Theorem.** Let `{H_m}` be a universal Hamiltonian family, and `{f_m}` the associated quantum model family, defined via Eq. (35). For all `g ∈ L₂([0,2π]^N)` and for all `ε > 0`, there exists some `m′ ∈ ℕ`, some state `|Γ⟩ ∈ ℂ^{d^{m′}}`, and some observable M such that `‖f_{m′} − g‖₂ ≤ ε` (Eq. (38)).

Read carefully: *if* the accessible spectrum is asymptotically rich enough *and* the trainable blocks are flexible enough to realise arbitrary global unitaries (so `|Γ⟩` and M are effectively free), the model can realise any set of Fourier coefficients and hence approximate any square-integrable function. The paper is explicit that this rests on the strong assumption of arbitrarily flexible W (possibly exponential circuit depth); whether universality holds with constant/log/poly-depth trainable blocks is **left open**. [SchuldSwekeMeyer2021]

### 3.4 Priority note

The paper itself states the Fourier–repeated-encoding connection was first established by Gil Vidal & Theis (its ref. [28]); Schuld–Sweke–Meyer add the systematic spectrum/coefficient split and the universality result. [SchuldSwekeMeyer2021]

### 3.5 Re-uploading vs trainable encoding — the one-line distinctions

- **Accessible spectrum Ω** = differences of sums of eigenvalues of the data-encoding Hamiltonians (Eq. (10)). Set entirely by the *encoding generators*.
- **Coefficients c_ω** = sums of terms from the *trainable blocks* and the *measurement* (Eq. (12)); real-conjugate-symmetric and **not** freely adjustable — a given circuit reaches only a subset, and you need `≥ 2K+1` parameters to control `K+1` coefficients arbitrarily.
- **(a) More layers L (series re-uploading):** grows the degree linearly for a fixed gate (`K = L`); generic bound `K ≤ d^{2L}/2 − 1`.
- **(b) More qubits (parallel):** for single-qubit Pauli encodings gives the *same* spectrum as the equivalent number of series layers (`Ω_par = Ω_seq`).
- **(c) Trainable vs fixed generators:** fixed Pauli encoding pins Ω to integers; changing the *generator eigenvalues* (incommensurate/exponentially-spaced) changes Ω itself and can make the spectrum exponentially rich. Trainable/interleaved encoding (Jerbi) reaches a target far more cheaply in qubits; random interleaving (Barthe–Pérez-Salinas) biases the reachable coefficients towards low frequencies.

---

## Part IV — How re-uploading relates to fixed/trainable encoding (complementary results)

### 4.1 Gil Vidal & Theis — input redundancy (the precursor)

First to argue, from the **no-cloning principle**, that redundantly re-encoding the input several times increases what a PQC can represent, and proves **lower bounds on the number of redundant input copies** needed for the expectation-value function to match a target. Schuld–Sweke–Meyer credit it with first connecting repeated data-encoding to a Fourier-series structure (their ref. [28]) and with the observation (their ref. [7]) that encoding a feature *once* into a single-qubit rotation restricts the model to a single sine/cosine — a degree-1 Fourier mode. It isolates **re-uploading depth** as the resource that enriches representable functions. [GilVidalTheis2019]

### 4.2 Pérez-Salinas et al. — data re-uploading universal classifier

Establishes that a **single qubit**, with data re-uploaded across many alternating encoding/processing units (plus a classical subroutine), is a **universal classifier** — a quantum analogue of the universal approximation theorem driven by re-uploading *depth* rather than qubit count. In the Schuld framework this is the constructive demonstration that *series* re-uploading alone buys arbitrary expressivity in the limit; it also motivated trainable input-rescaling for "frequency matching" (Schuld–Sweke–Meyer's ref. [17]). [PerezSalinas2020]

### 4.3 Jerbi et al. — trainable encodings; re-uploading vs fixed-encoding linear models

Defines a hierarchy of PQC models, all of the linear form `f(x) = Tr[ρ(x) O]`: *implicit (kernel)* models; *explicit* models (trainable observable `{O_θ}` on a fixed feature state `ρ(x)`); and **data re-uploading** models interleaving encoding and variational unitaries, `f_θ(x) = Tr[ρ_θ(x) O_θ]` with `U(x,θ) = U_L(x) Π_ℓ V_ℓ(θ) U_ℓ(x)`.

Main results: (i) **any** data re-uploading circuit can be *mapped to an equivalent explicit (fixed-encoding) linear model in a larger Hilbert space*, but the mapping costs `Ω(D)` additional qubits for D encoding gates. (ii) A **separation**: there are learning tasks (e.g. a parity-type construction) solvable by a *single-qubit re-uploading* model with few samples, for which any fixed-encoding linear/explicit model needs *exponentially more qubits* and any kernel/implicit model needs *exponentially more data*.

Complementary message to Schuld–Sweke–Meyer: re-uploading is not "more expressive in principle" (it can be re-expressed as a bigger fixed-encoding model) but is dramatically **more resource-efficient** — fewer qubits for the same function. *Trainable/interleaved encoding* changes the *cost* at which a given spectrum-and-coefficient combination is reached, whereas *fixed* encoding fixes the achievable frequencies up front. [Jerbi2023]

### 4.4 Barthe & Pérez-Salinas — reachable coefficients / frequency profile

Studies the *structure of the reachable Fourier coefficients* (not just the available spectrum) and trainability. Key findings: re-uploading models output functions with **vanishing high-frequency components and upper-bounded derivatives** with respect to the data; and when encoding gates are interleaved with **random trainable gates**, the *average* Fourier spectrum tends towards a **Gaussian profile** in deep circuits, so high-frequency coefficients are suppressed on average. This sharpens the Schuld–Sweke–Meyer point that coefficients are constrained: even when a frequency is *accessible*, its *typical magnitude* decays — both limiting expressivity at high frequency and acting as an implicit regulariser against overfitting. (Consistent with Schuld–Sweke–Meyer's own observation that coefficient variance decreases with frequency, since fewer `(k,j)` pairs contribute to large ω.) [BarthePerezSalinas2024]

### 4.5 Schuld & Petruccione — the textbook framing

The standard reference for the framework the papers above build on. A dedicated **data-encoding** chapter (taxonomy of *basis encoding*, *amplitude encoding*, and *angle/Pauli (rotation) encoding* / quantum feature maps) and a dedicated **variational/parametrised-quantum-circuit** chapter, where a quantum model is the *expectation value of an observable* on a trained PQC, `f(x) = ⟨ψ(x,θ)| M |ψ(x,θ)⟩`, optimised by hybrid quantum–classical training. This is exactly the object `f_θ(x) = ⟨0|U†MU|0⟩` that the Fourier analysis dissects; the book frames encoding as the choice of feature map that determines what functions the variational model can represent. [SchuldPetruccione2021]

---

## Part V — Annotated bibliography

**Primary theory.**

- **[SchuldSwekeMeyer2021]** Maria Schuld, Ryan Sweke, Johannes Jakob Meyer, "Effect of data encoding on the expressive power of variational quantum-machine-learning models", *Physical Review A* **103**, 032430 (2021); DOI 10.1103/PhysRevA.103.032430. Preprint arXiv:2008.08605 (v2, 9 March 2021), "The effect of data encoding on the expressive power of variational quantum machine learning models". *The spine of Parts II–III.* Proves a Pauli-encoded VQC is a (partial) Fourier series; spectrum Ω = differences of sums of encoding eigenvalues (Eq. 10), coefficients from trainable blocks + observable (Eq. 12), `≥2K+1` params for arbitrary coefficient control, asymptotic universality theorem (§III). Equation numbers verified against the ar5iv rendering. *Caveat:* uses both the `±1` (gap 2) and `±½` (gap 1) gauges in different places — see §6.

- **[PerezSalinas2020]** Adrián Pérez-Salinas, Alba Cervera-Lierta, Elies Gil-Fuster, José I. Latorre, "Data re-uploading for a universal quantum classifier", *Quantum* **4**, 226 (2020); DOI 10.22331/q-2020-02-06-226; arXiv:1907.02085. *Introduced single-qubit data re-uploading.* Universality argued by analogy with the Universal Approximation Theorem (neural-network/hidden-neuron picture, §3.2), **not** as an explicit Fourier series. Supplies the concrete alternating circuit (Eqs. 1, 2, 12) that Schuld–Sweke–Meyer expand.

- **[GilVidalTheis2019]** Francisco Javier Gil Vidal, Dirk Oliver Theis, "Input Redundancy for Parameterized Quantum Circuits", arXiv:1901.11434 (2019, rev. 2020); published *Frontiers in Physics* **8**:297 (2020). *The precursor.* First to connect repeated data-encoding to a Fourier structure (Schuld–Sweke–Meyer ref. [28]) and to prove lower bounds on the number of redundant input copies; argues from no-cloning that re-uploading depth is the enriching resource.

- **[Jerbi2023]** Sofiene Jerbi, Lukas J. Fiderer, Hendrik Poulsen Nautrup, Jonas M. Kübler, Hans J. Briegel, Vedran Dunjko, "Quantum machine learning beyond kernel methods", *Nature Communications* **14**, 517 (2023); DOI 10.1038/s41467-023-36159-y; arXiv:2110.13162. *The resource-efficiency complement.* Hierarchy of linear PQC models (implicit/kernel, explicit, re-uploading); any re-uploading circuit maps to an explicit fixed-encoding model at a cost of `Ω(D)` extra qubits; proven separation where single-qubit re-uploading beats fixed-encoding (exp. more qubits) and kernel models (exp. more data).

- **[BarthePerezSalinas2024]** Alice Barthe, Adrián Pérez-Salinas, "Gradients and frequency profiles of quantum re-uploading models", *Quantum* **8**, 1523 (2024); DOI 10.22331/q-2024-11-14-1523; arXiv:2311.10822. *The reachable-coefficient complement.* Re-uploading outputs have vanishing high-frequency components and bounded derivatives; random trainable interleaving drives the average spectrum to a Gaussian profile — sharpens the "coefficients are constrained" message and gives an implicit-regularisation reading.

- **[SchuldPetruccione2021]** Maria Schuld, Francesco Petruccione, *Machine Learning with Quantum Computers*, 2nd ed., Springer (Quantum Science and Technology), 2021; DOI 10.1007/978-3-030-83098-4; hardcover ISBN 978-3-030-83097-7. *Textbook framing* of data encoding (basis/amplitude/angle) and variational circuits as observable-expectation models.

**Foundations (Part I).**

- **[N&C-ch1]** Michael A. Nielsen, Isaac L. Chuang, *Quantum Computation and Quantum Information*, Chapter 1. Source of the qubit state (eq. 1.1), Bloch parametrisation (eqs. 1.3–1.4), the global-phase-is-unobservable statement, and the Born-rule probabilities `|α|²,|β|²`. Read from the authors' posted PDF.

- **[NC-ch4-sol]** Nielsen & Chuang, Chapter 4 conventions (rotation operators `R_P(t)=e^{-itP/2}`, eqs. 4.4–4.6, 4.8), confirmed against a worked-solutions transcription and corroborated by Qiskit/IBM definitions. *Caveat:* N&C's per-gate global phases (`R_z` vs `S`, `T`, phase gate) are not mutually consistent — see §6.

- **[Wiki-Bloch]** Wikipedia, "Bloch sphere". Angle ranges; the two-real-DOF reduction (relative phase physical, global phase fixable); Bloch components as Pauli expectations.

- **[Wiki-Gate]** Wikipedia, "Quantum logic gate". Pauli/H/S/T matrices and identities (`S²=Z`, `T²=S`, `T⁴=Z`, `HZH=X`, `HXH=Z`); rotation-gate matrices corroborating N&C.

- **[Wiki-Expect]** Wikipedia, "Expectation value (quantum mechanics)". Born rule and `⟨A⟩=⟨ψ|A|ψ⟩=Σ a_j|⟨φ_j|ψ⟩|²`; Pauli expectation values.

- **[IBM-Bloch]** IBM Quantum Learning, Bloch-sphere/density-matrix page. `ρ = ½(I + r·σ)` with `r=(sinθcosφ, sinθsinφ, cosθ)=(⟨X⟩,⟨Y⟩,⟨Z⟩)`.

- **[Qiskit-RX], [Qiskit-RZ]** Qiskit/IBM official gate docs. `RX(θ)=exp(-iθX/2)`, `RZ(φ)=exp(-iφZ/2)=diag(e^{-iφ/2},e^{+iφ/2})`, and `P(λ)=e^{iλ/2}RZ(λ)`. Fixes the sign and half-angle conventions used here.

- **[QSNP-X]** Quantum-science teaching notes on the X/Hadamard basis change ("apply H then measure in Z" = X-basis measurement; H flips x̂ and ẑ).

- **[postquantum-Had]** Explainer note: "By applying Hadamard gates before measurement, the relative phase influences measurement outcomes through interference effects of probability amplitudes."

- **[researchgate-Phases]** Note that states differing only in relative phase "have different phases that allow quantum algorithms to perform interference."

- **[qubit.guide]** *The Qubit Guide* (online). Global-phase indistinguishability vs physical relative phase φ.

- **[arXiv-CliffordT]** Clifford+T literature, cited for the "π/8 gate" naming of T and the `e^{iπ/8}·diag(e^{-iπ/8}, e^{iπ/8})` origin of the misnomer.

---

## Part VI — Open uncertainties

1. **Per-gate global-phase convention (Part I, §1.2).** N&C's `R_z`, `S`, `T` and "phase gate" act identically up to a global phase but carry *different* overall phases, and the literature is not internally consistent. This document fixes the symmetric `R_Z(t)=diag(e^{-it/2},e^{+it/2})` and the relation `P(λ)=e^{iλ/2}R_Z(λ)`. Any consumer that needs exact matrices (not just observables) must restate which gate set/phase it uses; `S=P(π/2)` and `T=P(π/4)` are phase-gate forms, not symmetric-`R_Z` forms.

2. **Encoding-gauge convention in Schuld–Sweke–Meyer (Parts II–III).** The paper uses both the Pauli gauge `H=σ` (eigenvalues `±1`, gap 2, single-layer `Ω={−2,0,2}`) and the physics gauge `H=σ/2` (eigenvalues `±½`, gap 1, integer `Ω`). The gauge-independent invariant is **base frequency = eigenvalue gap**. We fixed `H=Z/2` (gap 1) for clean integer frequencies; if any downstream figure is reproduced from the paper's `±1` panels, the frequency axis must be rescaled by 2 to match.

3. **Scope of universality (Part III, §3.3).** The Schuld–Sweke–Meyer universality theorem assumes arbitrarily flexible trainable blocks W (potentially exponential depth) and is a *spectrum + free-coefficient* statement realised by *growing the system* (m qubits / parallel encodings). It does **not** establish that a *single* qubit attains arbitrary degree-L coefficients. Whether universality survives under constant/log/poly-depth W is explicitly left open in the paper. Pérez-Salinas' single-qubit "universal classifier" claim is the looser UAT-style analogy, not a coefficient-control proof — these two universality claims should not be conflated.

4. **Coefficient reachability is not fully characterised (Parts II–IV).** It is established that a single qubit *saturates the spectrum* `{0,…,L}` but *cannot* freely set all `L+1` complex coefficients (counting bound `M≥2K+1`; path-count shrinkage at high frequency; possible structural zeros). The exact reachable coefficient manifold for a given single-qubit ansatz is not given in closed form by these sources; Barthe–Pérez-Salinas characterise only the *average/typical* profile (Gaussian, high-frequency-suppressed), not the precise boundary of the reachable set.

5. **Citation provenance for the lighter foundational sources.** `[postquantum-Had]`, `[researchgate-Phases]`, `[QSNP-X]` and `[qubit.guide]` are secondary/explainer-grade and were used only to corroborate claims already grounded in N&C / Wikipedia / IBM. Exact URLs/access dates were not captured in these notes and should be filled in before any external publication. The `[NC-ch4-sol]` worked-solutions transcription is third-party; the underlying conventions are independently confirmed by Qiskit, so the dependency is non-critical.

6. **Numerical check is single-instance per depth (Part II, §2.7).** The NumPy verification used random trainable angles at each L and confirmed spectrum support, reality, and the `L→L+1` increment to machine precision — but it verifies the *support and structure* of `Ω`, not the *full reachable coefficient set*. It is a sanity check on the theorem's spectral claims, not on coefficient universality. Script: `C:\Users\alfie\reupload_check.py`.
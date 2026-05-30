# PEDAGOGY.md — Recommended Teaching Sequence

*Synthesis deliverable. British English. The spine below is the agreed teaching order for the quantum-computing explainer. For each concept: a **load-bearing rank** (★ scale, ★★★★★ = the explainer fails without it), the **chosen mental model / metaphor**, and the **misconceptions to pre-empt**. The most load-bearing ideas are called out explicitly in the final section. Source keys resolve in SOURCES.md.*

---

## The single non-negotiable (read first)

Every step below serves one spine-level commitment, which the best written explainers converge on independently: **keep amplitudes — with sign and phase — on screen before squaring, and frame any speedup or expressivity gain as engineered interference, not parallel search.** Never write "0 and 1 at the same time", "tries all answers at once", or "parallel universes". This is the backbone; the geometry (Bloch), the algebra (kets/amplitudes) and the statistics (probability bars / shot histograms) must always be shown together and in lock-step. `[aaronson-quanta][quantum-country][ibm-superposition][kohnle2014]`

---

## Step 1 — The Bloch sphere shown whole (θ and φ; phase as the second axis)

**Load-bearing rank: ★★★★★ (foundational).** Everything downstream is a controlled simplification *of this* picture. If the whole sphere is not established first, the deliberate flattening in Step 2 has nothing to flatten, and the φ-axis that carries the entire Fourier payoff in Step 5 never gets a home.

**Mental model / metaphor.** A single qubit is *one point on the surface of a sphere*, fixed by two real angles: **θ** (colatitude from the |0⟩ pole) and **φ** (longitude, the relative phase). The Cartesian coordinates of that point are literally the measurable Pauli expectations: `(x, y, z) = (sinθ cosφ, sinθ sinφ, cosθ) = (⟨X⟩, ⟨Y⟩, ⟨Z⟩)`. The poles are |0⟩ and |1⟩; the equator is the relative-phase circle. Pair the geometry with Aaronson's one-line algebraic definition — "a complex amplitude attached to the possibility that it's 0, and another attached to the possibility that it's 1" — so the point and the two amplitudes are introduced as the *same object*. `[NielsenChuang][wiki-bloch][ibm-bloch][aaronson-quanta]`

**Why two axes, not one (the load-bearing framing).** A normalised ℂ² state has four real numbers; normalisation removes one and the **unobservable global phase** removes another, leaving exactly **two** — θ and φ. Crucially, **φ (relative phase) is physical and is the seat of interference**, whereas the global phase is a gauge freedom with no observable effect. Introduce "phase as the second axis" here so it is never mistaken for decoration. `[NielsenChuang][wiki-bloch][qubit-guide]`

**Misconceptions to pre-empt:**
- *"A qubit is 0 and 1 at the same time."* Nielsen calls "simultaneously in |0⟩ and |1⟩" word salad. Replace with: a *definite point* on the sphere that simply isn't a pole. `[quantum-country][strassler-superposition]`
- *"Superposition is intrinsic."* It is basis-relative — always ask "superposition *of what*?" A point on the equator is a superposition in the Z-basis but a basis state in the X-basis. `[ibm-superposition][strassler-superposition]`
- *"Global phase and relative phase are the same kind of thing."* Global phase is invisible (same Bloch point); relative phase is the longitude and drives everything later. A toy that lets the user "set the phase" must make clear *which* phase is physical. `[wiki-bloch][search-globalphase]`
- *"Two Bloch spheres can show two qubits."* Flag now that the Bloch sphere is **single-qubit only**; defer the reason to Step 4. `[wiki-bloch]`

---

## Step 2 — Deliberately flatten to the RY X–Z slice

**Load-bearing rank: ★★★ (scaffolding / cognitive-load management).** Not a physics result but a deliberate pedagogical move: collapse the hard 3-D picture to a tractable 2-D one so the learner builds fluency before phase re-enters. Naming the flattening as *deliberate* is what makes it honest.

**Mental model / metaphor.** Set **φ = 0** and live on the real **x–z great circle** — the |0⟩ ↔ |+⟩ ↔ |1⟩ ↔ |−⟩ meridian. On this slice the only gate that moves you is **RY(θ)**, whose matrix is entirely real. State = a real linear combination `cos(θ/2)|0⟩ + sin(θ/2)|1⟩`; everything is angles-on-a-circle with no imaginary parts to track. `[NielsenChuang][wiki-gate]`

**Misconceptions to pre-empt:**
- *"This flat picture is the whole story."* Say out loud that φ has been *temporarily switched off* and will return as the payoff axis. The flattening is a loan against Step 1, to be repaid in Step 3.
- *"Amplitudes are probabilities."* Even on the real slice, keep amplitudes (which can be negative) visible *before* squaring — a negative amplitude is what makes the Step 3/Step 5 cancellation possible. `[search-phase-misconception][aaronson-quanta]`

---

## Step 3 — Single-qubit rotation simulator (RX / RY / RZ; the RZ-invisibility lesson)

**Load-bearing rank: ★★★★ (the bridge).** This is where φ comes back and where the explainer's whole "phase → interference" thesis is made tangible *before* it has to carry the Fourier payoff. The RZ lesson is the conceptual hinge of the entire piece.

**Mental model / metaphor.** Each gate is a **rotation of the Bloch point about an axis** by angle *t*, under the convention `R_P(t) = exp(−i t P/2)`: RX spins about x, RY about y, RZ about z. Reuse IQM Academy's pattern — plot an **expectation value (⟨Z⟩, ⟨X⟩) against the rotation angle as a live swept curve** — so the cosine landscape is visible and pre-figures optimisation later. `[NielsenChuang][qiskit-rz][ibm-superposition][iqm-academy]`

**The load-bearing lesson — "RZ is invisible in the Z-basis until you change basis / interfere."** RZ(λ) maps φ → φ + λ: it slides the point around a line of latitude, changing ⟨X⟩ and ⟨Y⟩ but leaving ⟨Z⟩ = cosθ and the entire Z-basis outcome distribution *untouched* (the Z-probabilities depend on θ only). The phase becomes visible only after a **Hadamard** (the Z↔X basis change, since HZH = X): RZ-then-H sweeps the Z-readout deterministically from |0⟩ to |1⟩ as φ runs 0 → π. That deterministic sweep *is* interference — the two amplitudes made to add in phase or anti-phase. This is verified numerically in the foundations track. `[NielsenChuang][qiskit-rz][postquantum-had][quantum-country]`

**Misconceptions to pre-empt:**
- *"RZ does nothing."* It does plenty — it just does nothing *you can see in the Z-basis*. The whole point is that hidden phase is real. `[ibm-superposition]`
- *"Phase is cosmetic."* |+⟩ and |−⟩ have identical Z-statistics but opposite futures under the next gate; make the learner *watch* the H→H cancellation. `[quantum-country][ibm-superposition]`
- *"Gates are where randomness enters."* Gates are deterministic, reversible rotations; randomness enters *only at measurement*. Keep that separation clean. `[ibm-superposition]`
- *"A single measurement shows the state."* Expose a many-shots histogram, never a lone collapse — one shot is almost certainly misleading. `[search-shots]`
- *"RZ(π) = Z."* Only up to a global phase (RZ(π) = −iZ); flag the global-phase gauge so exact-matrix users aren't misled. `[qiskit-rz]`

---

## Step 4 — Topology & entanglement (add qubits, CNOT, conditional measurement)

**Load-bearing rank: ★★★ (important, but NOT on the critical path to the payoff).** Honestly ranked below Steps 1, 3 and 5. Entanglement is essential for the *general* quantum-computing story and for "and now it scales", but the single-qubit Fourier payoff in Step 5 is mathematically *independent* of it (see REORDER recommendation). Rank it as genuinely important, not as load-bearing *for the payoff*.

**Mental model / metaphor.** Add a second qubit and a **CNOT**; show that a Bell state's two qubits are **correlated in a way no pair of separate Bloch points can capture**. The canonical visualisation is the **conditional / measurement-correlation point cloud** (Gidney): measure qubit 2, project, and plot where qubit 1 lands — a single point for separable, a line for classically correlated, an extended cloud for entangled. Pair with a many-shots histogram so correlation reads as *statistical*, not a one-shot trick. `[gidney-entanglement][gidney-quirk]`

**Misconceptions to pre-empt:**
- *"Two Bloch spheres show a two-qubit state."* They cannot: each qubit of a Bell state has a maximally-mixed reduced state and sits at the *centre*, so all maximally entangled states render identically. This is the explicit payoff of the Step 1 "single-qubit only" flag. `[wiki-bloch][gidney-entanglement]`
- *"Entanglement is spooky action / parallel universes."* Stay at mechanism level: correlations in the joint amplitude table. `[csferrie][aaronson-quanta]`
- *"More entanglement always means more power."* Foreshadow honestly — careful benchmarks find removing entanglement often leaves performance as good or better at these scales. `[bowles2024]`
- *"State-vector toys scale."* Be explicit that these are exponential and pedagogical; keep qubit counts tiny. `[gidney-quirk]`

---

## Step 5 — THE PAYOFF: data encoding & re-uploading as a truncated Fourier series

**Load-bearing rank: ★★★★★ (the destination).** This is what the whole explainer exists to deliver, and it is the dissertation on-ramp. It pays back the φ-axis from Step 1, the RZ-phase lesson from Step 3, and the basis-change-reveals-phase idea — all on a *single qubit*.

**Mental model / metaphor.** *"A re-uploading qubit is a tunable Fourier synthesiser: encoding gates set the available frequencies; trainable gates set the coefficients."* Concretely, with the data-encoding gate `S(x) = e^{−i x Z/2}` (generator eigenvalues ±½, **gap 1**) repeated **L** times and interleaved with arbitrary trainable single-qubit rotations, measuring ⟨Z⟩ gives a **real Fourier series of degree L** with accessible integer frequencies **0, 1, …, L**:
`f(x) = Σ_{n=−L}^{L} c_n e^{inx}`, with `c_{−n} = c_n*`.
The frequencies are *differences of sums of the encoding generator's eigenvalues*, so the **eigenvalue gap is the base frequency** and **each extra layer adds exactly one new top frequency**. Verify it live against the simulator: sweep x, take the DFT, watch the spectrum be exactly {−L,…,L} and grow by one tone per layer. (The foundations track confirms this to machine precision; reuse Wakeham's code-free "vertical-mouse-sets-the-frequency" interaction and the Schuld–Meyer "increase repetitions → comb widens" control as near-exact templates.) `[schuld-sweke-meyer][perez-salinas][pennylane-fourier][pennylane-circuits-fourier]`

**Misconceptions to pre-empt:**
- *"Re-uploading just feeds the data in again — nothing changes."* A single encoding gives a trivial one-frequency model; re-uploading is precisely what widens the spectrum. `[schuld-sweke-meyer][perez-salinas]`
- *"The single qubit can realise any Fourier function of degree L."* No. It *saturates the spectrum* {0,…,L} but **cannot freely set all the coefficients** (counting bound: ≥ 2K+1 real parameters for K+1 complex coefficients; contributing paths shrink toward high frequencies). Universality is asymptotic and requires *width*, and rests on arbitrarily flexible trainable blocks. Say "depth buys *bandwidth*; full *coefficient* control needs more qubits." `[schuld-sweke-meyer][barthe-perez-salinas]`
- *"Frequency present in the spectrum ⇒ the model can use it."* No — spectrum *overstates* expressivity; coefficient variance scales with redundancy and some coefficients vanish exponentially with qubit count. If you present Fourier as *interpretability*, attach this caveat or the claim is overstated. `[mhiri2025][barthe-perez-salinas]`
- *"This is the encoding gauge everyone uses."* Pin the convention: with H = Z/2 the gap is 1 and frequencies are clean integers; the Pauli gauge (H = Z, gap 2) gives {−2,0,2} at one layer. Rescale any reproduced figure accordingly. `[schuld-sweke-meyer]`
- *"A swept single curve is the whole truth."* Keep the spectrum (bars), the fitted function, and the circuit linked and live-updating together. `[physport-quvis][gidney-quirk]`

---

## Step 6 — On-ramp to the series / research page

**Load-bearing rank: ★★ (funnel / framing).** Not a physics concept; the honest hand-off from explainer to the dissertation work. Its job is to set expectations truthfully and route the reader onward.

**Mental model / metaphor.** *"You've now built the exact object my research dissects — a Fourier model whose frequencies you buy with encoding and whose amplitudes you fit with training — and applied it to atmospheric data, reported honestly."* Frame the contribution precisely: VQC regression on atmospheric/reanalysis data + Fourier spectrum as an interpretability lens + honest negatives against classical baselines is a **defensible novel *combination* in a real gap, not a novel technique**. `[schuld-sweke-meyer][periyasamy2024]`

**Misconceptions to pre-empt:**
- *"Quantum beats classical here."* State plainly that no published QML-for-weather/climate result shows a clear quantum advantage; the strongest careful outcomes are *parity* or *classical superiority*, and entanglement often doesn't help. `[bowles2024][pastori2025][fellner2026]`
- *"Easy-to-train quantum models are doing something classically hard."* The opposite is increasingly shown — BP-free, easy-to-train models tend to be classically simulable / dequantisable. `[cerezo2024][sweke2025][schreiber2023]`
- *"Simulator ≈ hardware, and ICON ≈ ERA5."* Distinguish simulator from real-hardware results, and reanalysis (ERA5) from model output (ICON/ClimSim). `[sakhuja2025][pastori2025]`

---

## The most load-bearing ideas, called out explicitly

In priority order, these are the ideas the explainer *cannot survive losing*:

1. **Amplitudes (with sign/phase) before squaring; interference, not parallelism.** The spine-level commitment behind every step. `[aaronson-quanta][quantum-country]`
2. **Relative phase φ is physical and is the second Bloch axis** (global phase is not). This single distinction is what makes Steps 3 and 5 possible. `[wiki-bloch][qubit-guide]`
3. **"RZ is invisible in the Z-basis until you change basis / interfere."** The conceptual hinge that turns "phase" from a word into a mechanism. `[NielsenChuang][qiskit-rz]`
4. **Encoding sets the frequencies; training sets the coefficients; the eigenvalue gap is the base frequency; each layer adds one top tone.** The mechanism of the entire payoff. `[schuld-sweke-meyer]`
5. **Depth buys bandwidth, not free coefficients — and spectrum overstates expressivity.** The honesty guardrail that keeps the payoff (and the research framing) defensible. `[schuld-sweke-meyer][mhiri2025]`

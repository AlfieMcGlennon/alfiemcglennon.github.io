# How Quantum Computing Is Framed: A Pedagogy Map

*Internal deliverable — Track B (pedagogy). British English. Every non-trivial claim is grounded in a fetched source, keyed `[key]` to the citation list. The goal is a practical framing map for our own explainer: best mental models, metaphors to avoid, where to start, the recommended concept ordering, interactive patterns worth borrowing, and failure modes to design against.*

---

## 0. The headline finding

The best-regarded written explainers converge on one decision: **they refuse the "0 and 1 at the same time / tries all answers in parallel" framing and build everything on amplitudes and interference instead.** This consensus is strong enough to serve as the backbone of our explainer. The interactive pieces independently reinforce the same spine — they succeed when they keep geometry, algebra and statistics visible together, and they mislead when they collapse the story to probability alone.

Two complementary axes run through this document:

- **Framing (B1):** the words and mental models — what to say, what never to say.
- **Interaction (B2):** the toys and visual patterns — what to build, and the visual metaphors that silently encode falsehoods.

They share a single non-negotiable: **keep amplitudes (with sign/phase) on screen before squaring, and frame the speedup as engineered interference, not parallel search.**

---

## 1. Where each explainer starts, and its concept ordering

**Nielsen & Matuschak, *Quantum computing for the very curious* (Quantum Country)** `[quantum-country-qcvc][qcvc_fetch]`. Starts from linear algebra, deliberately and unapologetically. Order:

1. qubit state as a *vector* in a 2-D space;
2. computational basis states |0⟩, |1⟩;
3. superposition defined as a *linear combination* (e.g. 0.6|0⟩ + 0.8|1⟩);
4. amplitudes as the coefficients (complex numbers);
5. the normalisation constraint |α|² + |β|² = 1, derived from the requirement that measurement probabilities sum to 1;
6. gates (NOT/X, then Hadamard);
7. measurement, giving outcome 0 with probability |α|² and disturbing/collapsing the state.

Phase, interference, multi-qubit states and entanglement come later. Interference is taught concretely through the **double-Hadamard circuit (H then H)**, where the |1⟩ terms cancel exactly and |0⟩ reinforces. The medium itself is notable: prose is interrupted every few hundred words by embedded review questions, backed by an emailed spaced-repetition schedule (a "mnemonic medium"). They explicitly defer interpretive questions ("what the state *means*") in favour of building fluency first, and note that physicists themselves disagree on interpreting the state `[qcvc_fetch]`.

**IBM Quantum Learning — "Superposition with Qiskit" / "Basics of quantum information"** `[ibm-superposition]`. Starts from a *classical probabilistic* state (a coin flip), then pivots hard to show where the analogy breaks. Order: classical probabilistic state → equal superposition via Hadamard → measurement outcomes/probabilities → **phase coherence and interference (flagged as the key differentiator)** → Bloch-sphere visualisation → gates as rotations. Authored teaching material (video walkthrough credited to Dr Katie McCormick). This "intuitive analogy → empirical contradiction → refined model" structure is pedagogically the most transferable of the set.

**Scott Aaronson, "Why Is Quantum Computing So Hard to Explain?" (Quanta, 2021)** `[aaronson-quanta]`. Starts directly from the *definition of a qubit as amplitudes* and never passes through the parallelism story at all. It is essentially an argument that the right starting point is amplitudes + interference, full stop.

**PennyLane Fourier/encoding demos** (the ML-specific encoding spine).
- *"Quantum models as Fourier series"* (Schuld & Meyer, 2020) `[pennylane-fourier][pennylane_expressivity_demo]` and the code-free *"Circuits as Fourier series"* (David Wakeham, 2023) `[pennylane-circuits-fourier][pennylane_circuits_fourier]` start from the trained model as a function f(x), then decompose it: **encoding gates set the available frequencies; trainable gates set the coefficients.**
- *"Data-reuploading classifier"* `[pennylane-reuploading]` starts from a neural-network analogy (layers) and re-frames it for a single qubit.

**Design lineage worth naming.** Bartosz Ciechanowski's explainers (`ciechanow.ski`) are the gold standard for the *progressive, custom-coded, hands-on diagram* pattern — break a hard system into parts, let the reader drive each part, escalate complexity gradually `[search_ciechanowski]`.

---

## 2. Mental models and metaphors that WORK

### Superposition

- **Linear combination / vector** (Quantum Country, Aaronson). The single most robust model: a superposition is a definite vector that happens not to be a basis vector — *not* "two things at once". Aaronson's qubit definition: "a bit that has a complex number called an amplitude attached to the possibility that it's 0, and a different amplitude attached to the possibility that it's 1" `[aaronson-quanta]`.
- **A coin resting on its edge**, *not* a coin spinning in the air (IBM): "a coin sitting still, on its edge, is a better way to visualise a superposition state of a qubit than a coin wildly flipping through the air" `[ibm-superposition]`. This captures "definite but non-classical" and avoids importing randomness.
- **Superposition is basis-relative**: "Whether a quantum state is even in a superposition is really just in the eye of the beholder… we must also answer the question, 'superposition of *what*?'" `[ibm-superposition]`. A +x spin state is a superposition in the z-basis but a basis state in the x-basis `[strassler-superposition]`. Subtle but high-value.

### Relative phase

- **The sign/phase as a hidden lever that controls interference** (Quantum Country's H→H example; IBM's "the phase tells us how two terms in a quantum state will interfere") `[quantum-country-qcvc][ibm-superposition]`. Phase is taught not as decoration but as the thing that makes |+⟩ = (|0⟩+|1⟩)/√2 and |−⟩ = (|0⟩−|1⟩)/√2 behave differently even though they give identical measurement statistics in the computational basis.

### Measurement / collapse

- **Measurement reveals a random outcome AND disturbs the state**, in contrast to a classical coin where landing merely reveals a pre-existing fact (the contrast made explicitly across IBM and the superposition explainers) `[ibm-superposition]`. The amplitudes themselves are "hidden information", unmeasurable in principle `[quantum-country-qcvc]`.
- **Clean separation of determinism from randomness** (IBM): gates are deterministic and reversible rotations; "it is only when we **measure** the qubit that any randomness is introduced" `[ibm-superposition]`.

### Interference (the load-bearing idea)

- **Constructive/destructive interference of amplitudes** is the agreed core mechanism. Aaronson: "if some contributions to an amplitude are positive and others are negative, then the contributions can interfere destructively and cancel each other out" `[aaronson-quanta]`. The job of a quantum algorithm is to "choreograph a pattern of constructive and destructive interference so that for each wrong answer the contributions to its amplitude cancel… whereas for the right answer the contributions reinforce" `[aaronson-quanta]`. Quantum Country teaches this geometrically in Grover's algorithm as **rotation of a state vector** towards the solution, built from two reflections `[quantum-country-search]`.

### Data encoding (ML-specific)

- **Encoding sets the frequencies; training sets the coefficients.** The Schuld–Sweke–Meyer result: "one can naturally write a quantum model as a partial Fourier series in the data, where the accessible frequencies are determined by the nature of the data-encoding gates" `[schuld-sweke-meyer][schuld2021][pennylane-fourier]`. Repeated encoding ("data re-uploading") enriches the frequency spectrum toward universal approximation.
- **Re-uploading ≈ adding layers/neurons.** Pérez-Salinas et al.: a single qubit re-loaded with the data between trainable rotations behaves like a deeper network — "we can reapply this layer again and again with new sets of weights" `[pennylane-reuploading][perez-salinas]`. The nonlinearity that a single linear unitary lacks is supplied by re-uploading and by measurement.

---

## 3. Metaphors and phrasings known to MISLEAD, with replacements

| Misleading phrasing | Why it misleads | Better replacement (sourced) |
|---|---|---|
| "A qubit is 0 and 1 **at the same time**" | Treats superposition as classical co-existence. Nielsen calls "simultaneously in \|0⟩ and \|1⟩" **"word salad"** that "makes about as much sense… as Lewis Carroll's nonsense poem Jabberwocky" `[quantum-country-qcvc][qcvc_fetch]`. Strassler shows neither "AND" nor everyday "OR" survives experiment `[strassler-superposition]`. | "A definite state that is a *linear combination* (with amplitudes) of 0 and 1" — a vector, basis-relative `[quantum-country-qcvc][ibm-superposition]`. |
| "Tries every possible answer at once / explores 2ⁿ branches in parallel" | Aaronson's "**fundamental misstep of quantum computing popularisation**" `[aaronson-quanta]`. Even with an equal superposition of all answers, "you'll just see and read a random answer. And if that's all you wanted, you could've picked one yourself" `[aaronson-quanta]`. Quantum Country: the gates "are still acting linearly through the amplitudes" — no parallel checking `[quantum-country-search]`. | "Amplitudes are choreographed so wrong answers cancel and the right answer is reinforced" `[aaronson-quanta]`. Speedups come from *interference and problem structure*, not brute-force parallelism. |
| "Quantum computers compute in parallel universes" | Loaded interpretive (Many-Worlds) claim presented as fact; Aaronson lists "parallel universes / spooky action" as the off-putting opener that gets it wrong `[csferrie][aaronson-quanta]`. | Stay mechanism-level: amplitudes, interference. Treat interpretation as a separate, flagged topic. |
| "Superposition = randomness, like a coin flip" | A spinning coin merely hides a pre-determined result; a qubit in superposition has "**nothing 'random' about it**" until measured, and carries phase that a coin does not `[ibm-superposition]`. | "Coin on its edge": definite, manipulable, deterministic under gates; randomness enters only at measurement `[ibm-superposition]`. |
| "Superposition is an intrinsic property of the state" | It is basis-dependent — a state in superposition in one basis is a basis state in another `[ibm-superposition][strassler-superposition]`. | Always say "superposition *of what*?" — name the basis `[ibm-superposition]`. |
| (Encoding) "Re-uploading just feeds the data in again, nothing changes" | A single linear encoding gives a trivial (single-frequency) model; re-uploading is what *expands expressivity* `[schuld-sweke-meyer][perez-salinas]`. | "Re-uploading widens the Fourier frequency spectrum the model can represent" `[pennylane-fourier][schuld-sweke-meyer]`. |

**The opposite failure mode (over-detail).** Chris Ferrie argues many explainers go wrong by being *over-detailed*, leading with "qubits and parallel universes, spooky action at a distance" instead of what the machine is *for* `[csferrie]`. For a correctness-focused explainer the amplitude/interference spine remains the right backbone; Ferrie's point argues for *motivating* it with use-cases first, not for dropping it. (See §6 for how this lands for our recruiter-first audience.)

---

## 4. Failure modes when teaching PHASE and INTERFERENCE specifically

- **Treating phase as cosmetic.** Two states with identical measurement statistics in one basis (|+⟩ and |−⟩) behave completely differently under a subsequent gate. The fix used by both Quantum Country and IBM is to *make the student watch the cancellation happen* — the H→H circuit where the |1⟩ amplitudes carry opposite signs and annihilate `[quantum-country-qcvc][ibm-superposition]`.
- **Skipping straight to measurement probabilities.** If you only ever show |amplitude|², phase is invisible and interference looks like magic. Good explainers keep amplitudes (with signs/complex phase) on screen *before* squaring `[aaronson-quanta][ibm-superposition]`. The interactive corollary: a toy that collapses everything to a probability read-out *cannot* explain interference, the "secret engine" of the algorithms `[search_phase_misconception][qcvc_fetch]`.
- **Conflating "interference" with "parallelism".** The most common slip: describing interference as "all paths computed at once". The accurate statement is that *amplitudes* (not separate computations) add and cancel; the algorithm's whole difficulty is arranging that cancellation `[aaronson-quanta][quantum-country-search]`.
- **Not anchoring phase to a geometry.** Quantum Country's Grover treatment works because phase changes become *rotations and reflections of a real vector* — a picture students can carry `[quantum-country-search]`. IBM grounds the same intuition in the Bloch sphere `[ibm-superposition]`.
- **(Encoding-specific) leaving the link between phase/encoding and frequencies implicit.** The Fourier picture makes phase concrete for an ML audience: an encoding gate with eigenvalues ±γ injects terms e^(±iθγ), i.e. *frequencies* — so "phase" and "frequency content of the learned function" are the same lever `[pennylane-circuits-fourier][schuld-sweke-meyer]`.

---

## 5. Interactive explainers: landmark pieces and the patterns to borrow

### 5.1 The landmark interactive pieces

**Quirk — drag-and-drop in-browser circuit simulator (Craig Gidney).** A browser-based simulator that is *always* re-evaluating the circuit as you edit, so state displays update in real time as you drag gates on and off the wires. Supports up to 16 qubits (Gidney notes it "starts getting slow around the 14 qubit mark"); offers inline displays for Bloch sphere, amplitude, probability/"chance", and conditional displays. Explicitly a *toy for exploring and understanding small circuits*, not a path to real hardware; Gidney cites Bret Victor's "direct manipulation" ideas as the design inspiration. Stated limits: it cannot restore a measured qubit to superposition, share-URLs get very long, and mobile/touch support is weak `[gidney_quirk_post][gidney_quirk_repo]`.

**Bloch-sphere visualisers (many).** A large family of single-qubit 3-D visualisers (e.g. `bloch.kherb.io`, `bits-and-electrons.github.io/bloch-sphere-simulator`, IQM Academy's Bloch toy) let you rotate the qubit, apply gates, and watch the state vector move on the sphere, typically with live measurement-probability and Bloch-component read-outs `[search_bloch]`. IQM Academy goes further into *parametrised* gates: animating rotations about a Bloch axis and plotting an observable's **expectation value as a function of rotation angle** `[search_iqm]`.

**Quantum Flytrap — Virtual Lab / Quantum Game (Migdał et al.).** A no-code, real-time optical-table sandbox: drag beam splitters, polarisers, Faraday rotators and detectors onto a grid and watch interference, Bell tests, teleportation, etc. Supports up to three entangled photons and introduces *novel* representations — interactive ket-notation displays and a heat-map visualisation of quantum operators — with a "Quantum Game" front-door for absolute beginners (a low-floor design). Peer-reviewed in *Optical Engineering* `[flytrap_arxiv]`.

**PennyLane Fourier demos (data-encoding / variational).** Two complementary interactive treatments directly on point for a "data-encoding Fourier spectrum" toy:
- *"Circuits as Fourier series"* (Wakeham, 2023) is fully **code-free and mouse-driven**: vertical mouse position sets the encoding-gate frequency γ and the preparation/measurement terms; clicking toggles which frequency components contribute; it shows visually how `n` encoding gates produce accessible frequencies from `−2nγ` to `+2nγ`, tying gate eigenvalues `e^{±iθγ}` to the Fourier frequencies `[pennylane_circuits_fourier]`.
- *"Quantum models as Fourier series"* (Schuld & Meyer, 2020) lets you vary the number of encoding-gate repetitions `r`, watch the spectrum grow to `Ω = {−r,…,r}`, fit target functions, and plot the distribution of Fourier coefficients; it also contrasts serial vs parallel encoding `[pennylane_expressivity_demo]`. Both rest on the result that a quantum model is a partial Fourier series whose accessible frequencies are fixed by the encoding-gate Hamiltonians' eigenvalues, with repetition enriching the spectrum toward universal approximation `[schuld2021]`.

### 5.2 Patterns worth borrowing

1. **Live re-evaluation / direct manipulation.** Quirk's core lesson: never make the user press "run" — recompute on every edit so cause (gate) and effect (state display) are coupled tightly; explicitly modelled on Bret Victor's direct manipulation `[gidney_quirk_post]`. Concretely: drag a slider → the Bloch vector, the expectation bars and the Fourier spectrum all move *simultaneously*.
2. **Linked multiple representations.** The single best-evidenced principle in the quantum-education literature: effective sims help students "make connections between physical, mathematical, and graphical representations" and contrast classical vs quantum behaviour `[physport_quvis][search_quvis]`. Keep the geometric view (Bloch), the algebra (amplitudes/ket) and the statistics (probability bars/histogram) on screen together and animate them in lock-step.
3. **Expectation value vs angle, as a swept curve.** IQM Academy's pattern of plotting `⟨O⟩` against a rotation parameter is the right scaffold for a variational/rotation toy — it makes the cosine-shaped expectation landscape tangible and pre-figures optimisation `[search_iqm]`.
4. **Conditional/measurement-correlation display for entanglement.** Gidney's "Visualizing 2-Qubit Entanglement" is the canonical solution to a hard problem: iterate over measurement outcomes of qubit 2, project, and plot where qubit 1 lands as a **point cloud** on a Bloch sphere — separable states show as a single point, classically-correlated as a line, entangled as an extended cloud `[gidney_entanglement]`.
5. **Spectrum-grows-with-repetition.** The most instructive single interaction for data encoding is a control that adds encoding-gate **repetitions** and visibly widens the accessible frequency comb `[pennylane_circuits_fourier][pennylane_expressivity_demo]`.
6. **Low floor, optional depth.** Quantum Flytrap's "Quantum Game → sandbox" and Quantum Country's embedded-question cadence both stage difficulty. Implicit scaffolding *through the interaction design itself* (rather than walls of text) is a documented QuVis principle `[search_quvis][flytrap_arxiv]`.

### 5.3 Where interactive toys commonly fail or mislead

1. **The Bloch sphere is single-qubit only — and silently so.** Wikipedia (canonical): it represents the pure-state space of *one* two-level system; pure states on the surface, mixed inside; a generalisation to `n` levels exists but "the visualization is less useful" `[wiki_bloch]`. A Bloch-per-qubit view *cannot* show entanglement: each qubit of a Bell state has a maximally-mixed reduced state and sits at the centre, so all maximally entangled states render identically and uninformatively `[search_bloch_limits][gidney_entanglement]`. **Do not** imply two Bloch spheres capture a two-qubit state.
2. **Global phase is invisible; relative phase is everything.** States differing by a global phase map to the *same* Bloch point and are physically indistinguishable; only relative phase is observable `[wiki_bloch][search_globalphase]`. A toy that lets users "set the phase" must make clear which phase is physical, or it teaches a fiction.
3. **Confusing phase/amplitude with probability.** Amplitudes are complex, probabilities are `|amplitude|²`, and *different amplitudes give the same probability* — so a viz that only shows probability bars hides the phase that drives interference `[search_phase_misconception]`. Quantum Country's discipline here is the model to imitate `[qcvc_fetch]`.
4. **Hiding measurement statistics behind a single "run".** A single measurement is "almost certainly" misleading; honest behaviour needs many shots and a histogram before the distribution is legible `[search_shots]`. A toy that shows one collapse without a sampling/histogram mode mis-teaches the probabilistic nature of measurement.
5. **Poorly chosen visuals actively *create* misconceptions.** Empirically demonstrated: a beam-splitter visual that looked like the photon "splitting" produced the misconception that the photon divides into two half-energy parts; the *revised* visual measurably reduced that error `[kohnle2014_superposition]`. A visual metaphor is not neutral — test it, or it will encode a falsehood.
6. **Performance / scale cliffs.** Quirk slows near ~14 qubits and WebGL is fragile `[gidney_quirk_post]`; Gidney's entanglement display becomes computationally expensive when several are added to a circuit `[gidney_entanglement]`. State-vector toys are exponential — keep qubit counts tiny and be honest that this is pedagogy, not a scalable simulator.
7. **Over-claiming / "hardware-grade" implication.** Quirk is careful to say it is a *toy* and does not run on real hardware `[gidney_quirk_post]`. A browser toy should never imply it demonstrates quantum advantage or production behaviour.
8. **Unguided interactivity can hinder, not help.** The QuVis programme's central finding is that simulations must be *research-based and iteratively refined with student feedback*, with implicit scaffolding and content broken into parts — i.e. raw "here's a sandbox" is not automatically educational `[search_quvis][physport_quvis]`. (See Open uncertainties on the strength of the specific "free exploration is worse" claim.)

---

## 6. Recommended spine for our explainer

A defensible, source-aligned order (the convergent structure of Quantum Country + IBM, with the encoding extension the dissertation needs). Each step names the framing *and* the toy that carries it.

1. **Hook with what it's for**, briefly (Ferrie's caution), then commit to mechanism `[csferrie]`.
2. **State = vector; amplitudes attach to 0 and 1** (Aaronson's one-liner is the cleanest opening definition) `[aaronson-quanta][quantum-country-qcvc]`.
3. **Superposition = linear combination, basis-relative** — introduce "superposition of *what*?" early to immunise against the "0 and 1 at once" trap `[quantum-country-qcvc][ibm-superposition]`.
4. **Measurement** — probabilities are |amplitude|²; it is random *and* disturbing; contrast with the coin-on-its-edge. *Toy:* expose a many-shots histogram, never a single collapse `[ibm-superposition][search_shots]`.
5. **Gates as deterministic, reversible rotations** (Hadamard as the superposition-maker). *Toy:* Bloch sphere with live, linked algebra/probability read-outs; flag single-qubit-only and global-phase invisibility `[ibm-superposition][quantum-country-qcvc][wiki_bloch][gidney_quirk_post]`.
6. **Relative phase**, shown via |+⟩ vs |−⟩ — identical stats, different futures. *Toy:* keep amplitude *and* probability visible so phase is not lost `[search_phase_misconception]`.
7. **Interference**, taught with the H→H cancellation, then stated as the source of speedup: choreograph amplitudes so wrong answers cancel — *not* parallelism `[aaronson-quanta][quantum-country-qcvc]`.
8. **Entanglement** (multi-qubit, after single-qubit fluency) — Quantum Country's deliberate deferral is the right call. *Toy:* Gidney's measure-qubit-2-then-plot-qubit-1 point cloud, plus a many-shots histogram so correlations read as statistical, not a single collapse `[gidney_entanglement][search_shots]`.
9. **Data encoding for ML** (our extension): encoding gates set frequencies, trainable gates set coefficients; re-uploading widens the spectrum. *Toy:* the two PennyLane Fourier demos are near-exact templates; ground the encoding-eigenvalue → frequency link in Schuld–Sweke–Meyer `[schuld-sweke-meyer][perez-salinas][pennylane-fourier][pennylane-reuploading][pennylane_circuits_fourier][pennylane_expressivity_demo][schuld2021]`.

### Non-negotiables (framing + interaction, combined)

- Never write "0 and 1 at the same time", "tries all answers at once", or "parallel universes".
- Always keep amplitudes (with sign/phase) visible before squaring — in prose *and* in every toy.
- Frame the speedup as *engineered interference*, not parallel search.
- Couple cause and effect in real time; show geometry, algebra and statistics together; never reduce the story to probability alone; expose sampling.
- Test each visual metaphor — a bad picture teaches a wrong idea `[kohnle2014_superposition]`.

### Note for our recruiter-first audience

The memory note flags our audience as recruiter-first and the design as clean/technical/scannable rather than editorial. Ferrie's "lead with what it's for" `[csferrie]` aligns with that: open with motivation and use-cases, then earn the amplitude/interference spine. The spine above is *correctness-first*; for the public funnel, step 1 (the hook) likely carries more weight, and the deeper toys (steps 6–9) can sit behind progressive disclosure rather than on the landing path.

---

## Open uncertainties

1. **Strength of the "free exploration is worse" claim.** The QuVis evidence robustly supports *research-based, scaffolded, iteratively-refined* sims `[search_quvis][physport_quvis]`, but I have not verified a direct head-to-head study showing unguided sandbox use *measurably harms* learning versus a guided version. The "unguided interactivity can hinder" point (§5.3.8) should be read as "guidance is well-evidenced to help", not as a proven harm from free exploration.
2. **Generality of the Kohnle beam-splitter result.** The finding that a revised visual reduced a specific misconception is empirically demonstrated `[kohnle2014_superposition]`, but it is one study on one visual; treat "test your metaphors" as the durable lesson rather than assuming every redesign transfers.
3. **Some B2 claims rest on search-snippet keys** (`[search_bloch]`, `[search_iqm]`, `[search_bloch_limits]`, `[search_globalphase]`, `[search_phase_misconception]`, `[search_shots]`, `[search_ciechanowski]`, `[search_quvis]`) rather than fully fetched primary pages. The underlying facts are individually well-established, but exact wording/attribution for these specific points has not been verified against a primary source.
4. **IBM authorship/credit detail.** The video walkthrough is credited to Dr Katie McCormick `[ibm-superposition]`; the broader "Basics of quantum information" authorship (John Watrous) was not separately re-verified here.
5. **Ferrie vs the amplitude spine — unresolved tension, deliberately.** Ferrie argues against over-detail `[csferrie]`; the rest of the corpus argues the amplitude/interference detail is exactly what makes an explainer *correct*. I have resolved this as "motivate first, then commit to mechanism", but the right balance for the public site specifically is a design decision, not a settled finding from the sources.
6. **Citation-key duplication.** Several sources appear under two keys from the two source batches (e.g. `[quantum-country-qcvc]`/`[qcvc_fetch]`, `[schuld-sweke-meyer]`/`[schuld2021]`, `[pennylane-fourier]`/`[pennylane_expressivity_demo]`, `[pennylane-circuits-fourier]`/`[pennylane_circuits_fourier]`). I have kept both keys where the original notes used them so no citation is lost; they should be de-duplicated into a single reference list before publication.
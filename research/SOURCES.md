# SOURCES.md — Outbound Reference List

*Deduplicated and themed from the citations across the foundations, pedagogy and frontier tracks. Each entry carries a one-line note on what it is good for as an outbound link from the public page. Where the source batches used multiple keys for one work (e.g. `schuld-sweke-meyer` / `schuld2021`), they are merged into a single canonical entry.*

---

## Core theory — data encoding, re-uploading & the Fourier picture (the spine of the payoff)

- **Schuld, Sweke & Meyer (2021)**, *"The effect of data encoding on the expressive power of variational quantum machine learning models"*, Phys. Rev. A **103**, 032430; arXiv:2008.08605. — The anchor result: a VQC is a partial Fourier series; **encoding eigenvalues fix the frequencies, trainable blocks fix the coefficients**. Link this for the payoff and for anyone wanting the proof.
- **Pérez-Salinas, Cervera-Lierta, Gil-Fuster & Latorre (2020)**, *"Data re-uploading for a universal quantum classifier"*, Quantum **4**, 226; arXiv:1907.02085. — Introduced single-qubit data re-uploading and the **"re-uploading ≈ adding neurons/layers"** analogy. Good for motivating *why* you encode the data more than once.
- **Gil Vidal & Theis (2020)**, *"Input Redundancy for Parameterized Quantum Circuits"*, Front. Phys. **8**:297; arXiv:1901.11434. — The precursor: argues from no-cloning that **re-uploading depth** is the resource that enriches representable functions. Good for historical grounding.
- **Jerbi et al. (2023)**, *"Quantum machine learning beyond kernel methods"*, Nat. Commun. **14**, 517; arXiv:2110.13162. — Re-uploading is not more expressive *in principle* but dramatically **more resource-efficient** (fewer qubits); proves a separation. Good for "why a single qubit, not many".
- **Barthe & Pérez-Salinas (2024)**, *"Gradients and frequency profiles of quantum re-uploading models"*, Quantum **8**, 1523; arXiv:2311.10822. — **Reachable coefficients are constrained**: high frequencies are suppressed on average (Gaussian profile under random training). Good for the "depth buys bandwidth, not free coefficients" caveat.
- **Schuld & Petruccione (2021)**, *Machine Learning with Quantum Computers*, 2nd ed., Springer; DOI 10.1007/978-3-030-83098-4. — The textbook framing of data encoding (basis/amplitude/angle) and variational circuits as observable-expectation models. Good as the "go deeper" reference.

## Single-qubit foundations — states, gates, measurement

- **Nielsen & Chuang**, *Quantum Computation and Quantum Information* (Chs. 1 & 4). — Canonical source for the qubit state, **Bloch parametrisation (θ, φ)**, global-phase-is-unobservable, the Born rule, and the rotation operators `R_P(t)=e^{−itP/2}`. Link for any rigorous foundational claim.
- **Qiskit / IBM gate documentation (RX, RZ)**. — Fixes the **sign and half-angle conventions** and the phase-gate vs RZ relation `P(λ)=e^{iλ/2}RZ(λ)`. Good for anyone reproducing exact matrices in the simulator.
- **IBM Quantum Learning — "Basics of quantum information" / "Superposition with Qiskit"**. — Density-matrix Bloch form `ρ = ½(I + r·σ)`; the **"coin on its edge"** metaphor; "superposition of *what*?"; phase as the lever that controls interference. The single most transferable *teaching* source.
- **Wikipedia — "Bloch sphere"**. — Angle ranges, the two-real-DOF reduction, Bloch components as Pauli expectations, and the **single-qubit-only / global-phase-invisible** limits. Good as a quick canonical link.
- **Wikipedia — "Quantum logic gate"**. — Pauli/H/S/T matrices and identities (`HZH=X`, `S²=Z`, etc.). Good for a gate cheat-sheet.
- **Wikipedia — "Expectation value (quantum mechanics)"**. — The Born rule and `⟨A⟩=Σ a_j|⟨φ_j|ψ⟩|²`. Good for grounding the expectation-value plots.
- **The Qubit Guide (qubit.guide)**. — Clean statement that **global phase is indistinguishable but relative phase φ is physical**. Good supporting link for Step 1.

## Framing & pedagogy — what to say, what never to say

- **Nielsen & Matuschak, *Quantum Country* — "Quantum computing for the very curious"** (and the Grover/search essay). — The **amplitudes-first, linear-combination** spine; the H→H interference cancellation; the deliberate deferral of entanglement; "simultaneously in |0⟩ and |1⟩ is word salad". The model written explainer to imitate.
- **Aaronson (2021), *Quanta* — "Why Is Quantum Computing So Hard to Explain?"**. — The cleanest opening qubit definition and the naming of **"tries every answer in parallel" as the fundamental misstep**. Link this to justify the no-parallelism stance.
- **Strassler — "superposition" explainer**. — Superposition is **basis-relative** and neither classical AND nor OR survives experiment. Good supporting link for "superposition of what?".
- **Ferrie (csferrie) — on over-detailed explainers**. — The counter-caution: **lead with what the machine is *for*** before the mechanism. Good for the recruiter-first hook.
- **Kohnle et al. (2014) — beam-splitter superposition study**. — Empirical proof that **a bad visual metaphor creates a measurable misconception** (and a revised one fixes it). Cite to justify "test every metaphor".

## Interactive explainers — toys & patterns worth borrowing

- **Quirk (Craig Gidney) — in-browser drag-and-drop circuit simulator**. — The **live re-evaluation / direct-manipulation** pattern (no "run" button); honest about being a *toy*, not hardware. The reference design for the simulator.
- **Gidney — "Visualizing 2-Qubit Entanglement"**. — The **conditional measurement point-cloud** technique for entanglement (point / line / cloud). The template for Step 4.
- **IQM Academy — Bloch & parametrised-gate toys**. — Animating rotations and plotting an **expectation value vs rotation angle** as a swept curve. The template for the Step 3 simulator.
- **PennyLane — "Quantum models as Fourier series" (Schuld & Meyer)**. — Vary encoding repetitions, watch the spectrum grow to {−r,…,r}, fit targets, plot coefficient distributions. A near-exact template for the payoff toy.
- **PennyLane — "Circuits as Fourier series" (Wakeham, 2023)**. — **Code-free, mouse-driven**: vertical mouse position sets the encoding frequency; shows n gates → frequencies −2nγ…+2nγ. The other near-exact payoff template.
- **PennyLane — "Data-reuploading classifier" demo**. — The neural-network-analogy framing of re-uploading on a single qubit. Good as an applied companion.
- **Quantum Flytrap — Virtual Lab / Quantum Game (Migdał et al.)**, *Optical Engineering*. — A **low-floor, optional-depth** no-code optics sandbox; novel ket and operator visualisations. Good for the "low floor, progressive disclosure" design pattern.
- **QuVis (St Andrews) / PhysPort**. — The evidence base for **linked multiple representations** and research-based, scaffolded sims. Cite for the design principles, not a specific toy.
- **Ciechanowski (ciechanow.ski)**. — The gold-standard **progressive, custom-coded, hands-on diagram** lineage. Good as a design north-star.

## Frontier honesty — trainability, dequantisation, benchmarks, climate

- **Mitarai, Negoro, Kitagawa & Fujii (2018)**, *"Quantum circuit learning"*. — The original encode→parametrise→measure→optimise **regression** recipe. The practical ancestor.
- **Periyasamy et al. (2024)**, *"Fourier Analysis of Variational Quantum Circuits for Supervised Learning"*; arXiv:2411.03450. — Algorithm to compute the **exact spectrum/coefficients** and match a dataset's Fourier transform to a circuit. The concrete "Fourier-as-interpretability" tool — deploy with the caveat below.
- **Mhiri et al. (2025)**, *"Constrained and Vanishing Expressivity of Quantum Fourier Models"*, Quantum **9**, 1847; arXiv:2403.09417. — **The essential caveat**: spectrum *overstates* expressivity; some coefficients vanish exponentially with qubit count. Pair this with any Fourier-interpretability claim.
- **McClean et al. (2018)** (barren plateaus origin); **Cerezo et al. (2021)** (cost-locality); **Holmes et al. (2022)** (expressivity↔trainability trade-off); **Larocca et al. (2025)**, Nat. Rev. Phys. (BP review). — The **trainability** chain: expressive models are hard to train. Cite the review for a single entry point.
- **Cerezo et al. (2024)**, *"…why we need to rethink variational quantum computing"*; and **Sweke et al. (2025)** (random Fourier features dequantise regression); and **Schreiber, Eisert & Meyer (2023)** (classical surrogates). — The **dequantisation crux**: BP-free, easy-to-train models tend to be classically reproducible. Cite for the honest "no inference advantage" line.
- **Bowles, Ahmed & Schuld (2024)**, *"Better than classical? The subtle art of benchmarking QML models"*. — 12 models, 160 datasets: classical baselines win, and **removing entanglement often does not hurt**. The headline honesty citation.
- **Fellner, Kreplin, Tovey & Holm (2026)**, *"Quantum vs. classical… time series"*, Mach. Learn.: Sci. Technol. **7**, 010501; arXiv:2504.12416. — The **template for honest negative results vs classical baselines** (on synthetic chaos). Cite for the reporting posture.
- **Pastori, Grundner, Eyring & Schwabe (2025)**, *"Quantum Neural Networks for Cloud Cover Parameterizations"*; arXiv:2502.10131. — The flagship QML-for-climate result: **QNN ≈ classical NN, no quantum advantage** (on ICON model output). The most credible climate-strand neighbour.
- **Sakhuja et al. (2025)**, *"Quantum-Assisted ML Models for Enhanced Weather Prediction"*; arXiv:2503.23408. — The closest published neighbour: **VQC on ERA5 reanalysis**, mixed/no consistent advantage, **no Fourier interpretability**. Cite to locate the gap the research fills.

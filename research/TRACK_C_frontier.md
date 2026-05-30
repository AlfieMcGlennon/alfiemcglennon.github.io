# Quantum machine learning for regression with variational circuits: a source-grounded landscape (2018–2026)

This briefing consolidates a source-grounded survey of variational quantum circuit (VQC) regression and weather/climate-adjacent quantum machine learning (QML). It covers the public frontier only and contains no unpublished specifics. The aim is to locate honestly where a framing of **"VQC regression on atmospheric data, using Fourier decomposition as an interpretability tool, reported honestly including negative results against classical baselines"** sits relative to that frontier.

Throughout, "established" means there is a peer-reviewed theoretical result or a careful empirical study; "contested/hyped" flags where claims outrun the evidence.

---

## Part I — VQC regression: the general frontier

This part covers the use of variational quantum circuits (VQCs), also called quantum neural networks (QNNs), as **regressors** — models that fit a real-valued function f(x) of classical input x. The dominant theoretical lens in current practice is the **Fourier-series view**, and the dominant tensions are **expressivity vs trainability** (barren plateaus) and **quantum vs classical advantage** (dequantisation / classical surrogates). The honest current verdict is that, for regression at the scales reachable today, VQCs have **not** been shown to beat well-tuned classical baselines, and a growing body of theory explains *why* the most easily-trainable models are also the most easily classically reproduced.

### 1. What a VQC regressor is, and the original proposal

The canonical near-term recipe is **quantum circuit learning**: encode the input x into a quantum state via a data-encoding (feature map) circuit, apply a parametrised unitary U(θ), measure the expectation value of an observable, and tune θ with a classical optimiser to fit the target. This was introduced explicitly as a regression/function-fitting method by Mitarai, Negoro, Kitagawa & Fujii [Mitarai2018]; they show a quantum circuit can approximate nonlinear functions and demonstrate it numerically. This paper is the practical ancestor of essentially all VQC regression work.

**Established.** The architecture (encode → parametrise → measure → classically optimise) and its use for regression are well-defined and uncontroversial.

### 2. The Fourier-series view (the central organising idea in practice)

The most important conceptual result for understanding VQC regressors is that **a VQC is, exactly, a truncated (partial) Fourier series in the input data**. Schuld, Sweke & Meyer prove that "one can naturally write a quantum model as a partial Fourier series in the data, where the accessible frequencies are determined by the nature of the data-encoding gates in the circuit" [SchuldSweke2021]. The canonical reference is *"The effect of data encoding on the expressive power of variational quantum machine learning models"*, **Phys. Rev. A 103, 032430 (2021)**, arXiv:2008.08605. Key consequences, all from that paper:

- The **set of accessible frequencies** is fixed by the *encoding* gates (their generators' eigenvalues), not by the trainable layers.
- **Repeating the encoding** (data re-uploading) enriches the frequency spectrum, so the model can represent more complex functions.
- The trainable layers control the **Fourier coefficients**, and there exist models that can realise *all* coefficient sets; if the accessible spectrum is asymptotically rich enough, such models are **universal function approximators**.

This is now the standard practitioner's mental model (e.g. PennyLane's "Quantum models as Fourier series" demo is built directly on it). It is the correct frame for an explainer: **a VQC regressor is a Fourier model whose frequencies you buy with encoding and whose amplitudes you fit with training.**

**Established and central.** Treat the Fourier-series description as the reliable backbone of any explainer.

### 3. Data re-uploading: why you encode the data more than once

A single qubit with a single data encoding is severely limited (only the two-dimensional Bloch-sphere geometry). Pérez-Salinas, Cervera-Lierta, Gil-Fuster & Latorre showed that **re-uploading the data multiple times**, interleaved with trainable single-qubit gates, makes even a single qubit a **universal classifier/approximator** (with a classical subroutine), and they draw the explicit analogy that "Neural Networks re-upload classical data several times, once per hidden neuron" [PerezSalinas2020]. Re-uploading is the practical mechanism that delivers the rich Fourier spectra of §2.

**Established.** Re-uploading is the standard way to get expressivity into VQC regressors; the neural-network analogy is sound and originates with these authors.

### 4. The trainability problem: barren plateaus

The major obstacle to VQC regression (and to variational quantum computing generally) is the **barren plateau (BP)**: the cost landscape becomes exponentially flat as the number of qubits grows, so gradients vanish exponentially and training requires exponentially many measurement shots to make progress. The chain of results:

- **Origin** — McClean, Boixo, Smelyanskiy, Babbush & Neven: for a wide class of random parametrised circuits, "the probability that the gradient along any reasonable direction is non-zero to some fixed precision is exponentially small as a function of the number of qubits" [McClean2018].
- **Cost-function/locality dependence** — Cerezo, Sone, Volkoff, Cincio & Coles: **global** observables give BPs even at shallow depth, whereas **local** observables give at-worst polynomially-vanishing gradients for circuits of depth O(log n). This ties trainability to observable locality [Cerezo2021]. *Relevance to regression:* using global readouts in a regressor is a recipe for untrainability.
- **Expressivity–trainability trade-off** — Holmes, Sharma, Cerezo & Coles: the more expressive the ansatz (the closer to a unitary 2-design), the flatter the landscape; "highly expressive ansätze exhibit flatter cost landscapes and therefore will be harder to train" [Holmes2022]. This is the formal statement of the central tension: **you cannot freely buy expressivity without paying in trainability.**
- **Unified review** — Larocca, Thanasilp, Wang, Sharma, Biamonte, Coles, Cincio, McClean, Holmes & Cerezo (Nature Reviews Physics): a six-year synthesis. BPs can be triggered by *any* of ansatz, initial state, observable, loss function, and hardware **noise**; "when a model exhibits a BP, its parameter optimization landscape becomes exponentially flat and featureless" with associated exponential precision/measurement cost [Larocca2025review].

**Established.** Barren plateaus are real, multiply-caused, and the expressivity↔trainability trade-off is a proven relationship, not a heuristic.

### 5. The deeper tension: avoiding barren plateaus may imply classical simulability

This is the most important recent development for an honest verdict, and it is **specifically damaging to claims of quantum advantage in regression**.

- **Simulability of BP-free models** — Cerezo, Larocca, García-Martín, Díaz, Braccia, Fontana, Rudolph, Bermejo, Ijaz, Thanasilp, Anschuetz & Holmes argue that BPs reflect a "curse of dimensionality," and that "current approaches for solving them end up encoding the problem into some small, classically simulable, subspaces." Concretely, "many commonly used models whose loss landscapes avoid barren plateaus can also admit classical simulation, provided that one can collect some classical data from quantum devices during an initial data acquisition phase." They conclude this "sheds doubt on the information processing capabilities of many parametrized quantum circuits with provably barren plateau-free landscapes" [Cerezo2024simulability]. The provocative subtitle ("…why we need to rethink variational quantum computing") signals the field's own caution.

- **Dequantising regression with random Fourier features** — Sweke, Recio-Armengol, Jerbi, Gil-Fuster, Fuller, Eisert & Meyer establish *necessary and sufficient conditions* under which **random Fourier features (a classical method) efficiently dequantise variational QML for regression** [Sweke2025rff]. Because a VQC regressor is a Fourier model (§2), if its accessible spectrum is "small" (e.g. polynomially many frequencies, as with Pauli/single-qubit encodings) a classical sampler over those frequencies reproduces it. They identify which structural properties a problem must have for a *potential* quantum advantage to survive.

- **Classical surrogates** — Schreiber, Eisert & Meyer define a **classical surrogate**: "a classical model which can be efficiently obtained from a trained quantum learning model [that] reproduces its input-output relations." For large classes of re-uploading models (Pauli / single-qubit encodings, polynomially many Fourier frequencies), once trained you can extract a classical model that replicates inference, so **there is no quantum advantage at inference time**; in their tests they found "no advantage in performance or trainability," leaving generalisation as the only open avenue [Schreiber2023surrogate].

**Established (and the crux).** For the *easy-to-train, commonly used* VQC regressors — exactly the ones a practitioner would reach for — there is now strong evidence that a classical method matches them. The space for genuine advantage lives in models with *exponentially rich, controllable* frequency spectra that are simultaneously *trainable* — and it is precisely that combination the BP/simulability results call into question.

### 6. The empirical verdict: does VQC regression beat classical baselines?

The most careful benchmarking to date is sobering:

- **Bowles, Ahmed & Schuld** ("Better than classical? The subtle art of benchmarking quantum machine learning models"): tested 12 QML models on tasks spanning 160 datasets. "Out-of-the-box classical machine learning models outperform the quantum classifiers," and — strikingly — "removing entanglement from a quantum model often results in as good or better performance," i.e. *quantumness* was not the decisive ingredient at these scales. They stress that experimental-design choices and small accessible scales make robust conclusions hard, and warn against commercialisation-driven narratives [Bowles2024benchmark]. *Caveat for this brief: their tasks are binary classification, not regression — but the methodological warnings and the entanglement finding transfer.*

- **Time-series regression/forecasting benchmark** — Fellner, Kreplin, Tovey & Holm, *"Quantum vs. classical: a comprehensive benchmark study for predicting time series with variational quantum machine learning"*, **Mach. Learn.: Sci. Technol. 7, 010501 (2026)**, arXiv:2504.12416. Across 27 tasks on **chaotic synthetic systems**, "quantum models struggle to match the accuracy of simple classical counterparts of comparable complexity"; re-uploading with exponential encoding gives a rich Fourier spectrum but no practical win. A related QCHALLenge time-series benchmark (arXiv:2412.13878) found the best classical configurations achieved higher average accuracy than the best quantum models; quantum-enhanced LSTM variants generally underperformed classical counterparts, "suggesting there may be no discernible advantage to replacing classical neural layers… with quantum neural networks," and crucially that an advantage on one dataset "does not imply a general advantage" [QvC2025timeseries]. (Note: arXiv:2504.12416 is now journal-published; the QCHALLenge benchmark remains a preprint — see Open uncertainties.)

**Verdict.** For regression at today's scales: **classical baselines match or beat VQC regressors**, entanglement often does not help, and dataset-specific wins do not generalise. There is, as of this writing, **no widely accepted demonstration of a practical quantum advantage in VQC regression on real-world data.**

### 7. The Fourier spectrum is not free expressivity — an essential caveat

If the Fourier decomposition is to be used as an *interpretability* lens, one further result must be carried alongside §2. Mhiri, Monbroussou, Herrero-Gonzalez, Thabet, Kashefi & Landman, *"Constrained and Vanishing Expressivity of Quantum Fourier Models"*, **Quantum 9, 1847 (2025)**, arXiv:2403.09417, show that the frequency *spectrum overstates* true expressivity: coefficient variance is proportional to a frequency's **redundancy**, and some coefficients **vanish exponentially with qubit count** (a phenomenon distinct from barren plateaus). Consequently you **cannot** assume "frequency present in spectrum ⇒ model can use it." This is a direct, citable warning against naive Fourier-interpretability claims [2403.09417].

A complementary, constructive tool exists: Periyasamy et al., *"Fourier Analysis of Variational Quantum Circuits for Supervised Learning"*, arXiv:2411.03450 (2024), gives an algorithm to compute the exact spectrum and coefficients, and to *predict which VQC will best fit a dataset by matching the data's Fourier transform to the circuit's accessible spectrum* [2411.03450]. This is the most concrete "Fourier-as-design/interpretability" method and is directly reusable — but it should be deployed with the §7 caveat attached.

---

## Part II — Weather, climate and Earth-system-adjacent QML, and where the proposed framing sits

### Scope and headline judgement

The public frontier here is **real but thin, young, and fragmented**. Three distinct strands exist, each with only a handful of papers, mostly 2023–2026, and almost all simulator-based with parity-or-worse results against classical baselines:

1. **QML for weather/climate modelling** (forecasting, parameterisation).
2. **QML for Earth observation / remote sensing** (mostly classification).
3. **The methodological strand on the Fourier-series structure of VQCs** (Part I, §2 and §7) — foundational theory, largely *not* applied to atmospheric data.

The specific proposed framing — **VQC regression on *atmospheric* data, using Fourier decomposition as an *interpretability* tool, reported honestly including negative results against classical baselines** — sits in a **genuine gap**. Each ingredient is individually established, but no published paper was found that combines all three (atmospheric/reanalysis regression + Fourier-spectrum interpretability + honest negative-result framing). It is best characterised as **a niche-but-defensible novel *combination*, not a novel *technique***. Caution: the honesty/negative-results posture is itself becoming a recognised (and well-received) stance in QML, so the novelty is in the *application-domain pairing*, not in "being honest".

### Strand 1 — QML for weather / climate modelling

This is the most directly relevant strand and it is small.

- **Cloud-cover parameterisation is the flagship result.** Pastori, Grundner, Eyring & Schwabe, *"Quantum Neural Networks for Cloud Cover Parameterizations in Climate Models"*, arXiv:2502.10131 (2025), train QNNs on high-resolution **ICON** weather/climate-model data. Their honest finding: QNN performance is **comparable to classical NNs of similar size** (i.e. **no quantum advantage**), though both beat the traditional scheme; they note prediction stability under finite-sampling noise and analyse the optimisation landscape and generalisation [2502.10131]. A companion conference paper — Schwabe, Pastori, Sarandrea & Eyring, *"Quantum Machine Learning for Climate Modelling"*, **IEEE QAI 2025** (Naples), arXiv:2512.14208 — restates this and claims QNNs "learn more consistent relationships", but reports no clear speed-up or exponential advantage [2512.14208]. This group (DLR / Eyring) is the most credible serious actor in QML-for-climate.

- **Weather forecasting on real meteorological data.** da Silva et al., *"Exploring Quantum Machine Learning for Weather Forecasting"*, arXiv:2509.01422 (2025), train a QNN on NASA POWER data vs a classical RNN, reporting mixed results — some robustness/convergence advantages, but "nonlinearities and architectural sensitivities" as limitations. **No Fourier analysis, no interpretability** [2509.01422].

- **ERA5 + VQC specifically already exists.** Sakhuja et al., *"Quantum-Assisted Machine Learning Models for Enhanced Weather Prediction"*, arXiv:2503.23408 (2025), apply five QML architectures (QNN-Ising, QNN-Strong-Entangling, QGRU, QLSTM, VQC, QSVM) to **ERA5 reanalysis** (single station, New Delhi) for **regression and classification**. Results are **mixed with no consistent quantum advantage** — small wins on some binary tasks, clear classical superiority on multiclass (e.g. VQC 0.795 vs classical SVC 0.923). Crucially: **no Fourier analysis, no interpretability** [2503.23408]. This is the closest published neighbour to the proposed framing and should be cited as such; it occupies the "VQC on ERA5" square but leaves the "Fourier interpretability" square empty.

- **Emulation framework.** Bazgir & Zhang, *"QESM: A Leap Towards Quantum-Enhanced ML Emulation Framework for Earth and Climate Modeling"*, arXiv:2410.01551 (2024), swap CNN/MLP/encoder-decoder for quantum variants on the **ClimSim** dataset and claim accuracy gains. Treat its advantage claims with caution — the abstract gives limited methodological detail on baseline control, and ClimSim is simulation output, not reanalysis [2410.01551].

**Net:** roughly a dozen papers, clustered in 2024–2026, dominated by "QNN ≈ classical NN, no clear advantage, simulator-only". The most-cited honest result is *no advantage* (2502.10131).

### Strand 2 — QML for Earth observation / remote sensing

Adjacent but mostly **classification** (land cover, scene classification), not atmospheric regression.

- Miroszewski, Nalepa, Le Saux & Mielczarek, *"Quantum Machine Learning for Remote Sensing: Exploring Potential and Challenges"*, **Big Data from Space 2023**, arXiv:2311.07626 — investigates and partly deflates "common beliefs" about quantum advantage; flags kernel-value concentration as a problem but argues it does not fully negate potential advantage. The field is "exploratory with unresolved obstacles" [2311.07626].
- A 2026 review, *"A review of quantum machine learning methods for remote sensing tasks"*, *Quantum Machine Intelligence* (Springer), DOI 10.1007/s42484-026-00394-5 — surveys QCNNs, annealer-trained SVMs etc. Only metadata was accessible (paywalled), so its detailed conclusions are flagged as **unverified** beyond the abstract-level claim that the field is dominated by simulator-on-par-with-classical results.

**Net:** more papers than the climate strand, but the centre of gravity is image classification, not atmospheric/geospatial *regression*, and not Fourier interpretability.

### Strand 3 — Fourier structure of VQCs (the interpretability machinery)

This is the **mature, well-cited** strand — but it lives in quant-ph, **divorced from Earth science**. Its core references and the essential caveat are given in full in Part I, §2 and §7:

- **Foundational:** Schuld, Sweke & Meyer, **Phys. Rev. A 103, 032430 (2021)**, arXiv:2008.08605 — the partial-Fourier-series result that anchors any "Fourier decomposition as interpretability" claim [2008.08605].
- **Applied tooling:** Periyasamy et al., arXiv:2411.03450 (2024) — exact spectrum/coefficient computation and dataset-to-circuit spectrum matching [2411.03450].
- **Essential caveat:** Mhiri et al., **Quantum 9, 1847 (2025)**, arXiv:2403.09417 — spectrum overstates expressivity; some coefficients vanish exponentially with qubit count [2403.09417].
- **Closest methodological negative-result neighbour:** Fellner, Kreplin, Tovey & Holm, **Mach. Learn.: Sci. Technol. 7, 010501 (2026)**, arXiv:2504.12416 — the template for "honest negative results vs classical baselines", but on synthetic chaos, **not** atmospheric data [2504.12416].

### Where the proposed framing sits — precise verdict

- **VQC regression on atmospheric/reanalysis data:** *occupied but sparsely* (2503.23408 on ERA5; 2502.10131 / 2512.14208 on ICON cloud cover; 2410.01551 on ClimSim). Not crowded; a handful of papers.
- **Fourier decomposition as interpretability for VQCs:** *well-developed methodology* (2008.08605, 2411.03450) **with a strong caveat** (2403.09417) — but **applied to physics/synthetic data, essentially never to atmospheric data**.
- **Honest reporting incl. negative results vs classical baselines:** *an established and respected posture* in this literature (2504.12416 on time series; 2502.10131 explicitly reports no advantage). It is normal, not novel — the integrity is expected, not a differentiator.

**The intersection of all three is, as far as the public record shows, unoccupied.** No paper was found that does VQC *regression on atmospheric/reanalysis data* **and** uses the *Fourier spectrum as an interpretability lens* **and** frames results honestly against classical baselines. That makes the framing **a legitimate niche contribution at the level of *novel combination/application***, not a new method. For a public explainer this is the honest line to take: "each ingredient is published; their combination on atmospheric data is, to the best of a careful literature search, not." Avoid implying the technique itself is new — Schuld–Sweke–Meyer (2021) and the benchmark/negative-result culture predate it.

### Drafting cautions for the public explainer

- State plainly that **no published QML-for-weather/climate result demonstrates a clear quantum advantage**; the strongest careful results report *parity* (2502.10131) or *classical superiority* (parts of 2503.23408, 2504.12416).
- If invoking "Fourier decomposition tells us what the circuit learned", **pair it with the constrained/vanishing-expressivity caveat** (2403.09417) — otherwise the claim is overstated.
- Distinguish **simulator** results (almost all of these) from **real-hardware** results; nearly everything cited is simulation.
- Distinguish **reanalysis (ERA5)** from **model output (ICON, ClimSim)** — they are not interchangeable as "atmospheric data".

---

## Consolidated one-line verdict

The Fourier-series picture of VQC regression is solid and useful; barren plateaus make expressive models hard to train; the models that are easy to train are increasingly shown to be classically reproducible — so a practical quantum advantage in regression remains unproven as of 2026, including in every published weather/climate-adjacent QML result, where the strongest careful outcomes are parity or classical superiority. Against that backdrop, **"VQC regression on atmospheric data + Fourier interpretability + honest negatives" is a defensible novel *combination* sitting in a real gap — not a novel technique.**

---

## Open uncertainties

- **Preprint vs peer-reviewed status.** Several load-bearing citations are arXiv preprints not (yet) known to be peer-reviewed: Cerezo2024simulability, Sweke2025rff, the QCHALLenge time-series benchmark (arXiv:2412.13878), and the climate-strand papers 2502.10131, 2512.14208 (IEEE QAI 2025 conference paper — venue accepted, formal proceedings status to confirm), 2509.01422, 2503.23408, 2410.01551, and 2411.03450. By contrast, SchuldSweke2021 (Phys. Rev. A), Holmes2022, Cerezo2021, McClean2018, Larocca2025review (Nat. Rev. Phys.), Bowles2024benchmark, Mhiri (Quantum 9, 1847, 2025), and Fellner/2504.12416 (Mach. Learn.: Sci. Technol. 7, 010501, 2026) are journal-published. Verification status should be re-checked before publication.
- **Exact quotations and figures** (e.g. the VQC 0.795 vs classical SVC 0.923 multiclass figure in 2503.23408) are reproduced from the source notes and were not independently re-verified against the papers' final text.
- **Paywalled review.** The 2026 *Quantum Machine Intelligence* remote-sensing review (DOI 10.1007/s42484-026-00394-5) was accessible at metadata level only; its detailed conclusions are unverified beyond the abstract.
- **Completeness of the "gap" claim.** The assertion that *no* paper combines atmospheric-data VQC regression + Fourier interpretability + honest negatives rests on a careful but non-exhaustive literature search; it is a strong-but-falsifiable negative, and absence of evidence is not proof of absence. New 2026 preprints could close the gap at any time.
- **Bibliographic keys** (e.g. Mitarai2018, PerezSalinas2020, QvC2025timeseries) are internal shorthands; full DOIs/arXiv IDs should be reconciled into a single reference list before any external use.
- **Generalisation as the surviving open avenue.** Whether VQCs offer advantages in *generalisation* (sample efficiency) rather than raw accuracy, and whether *quantum-native* regression problems (data generated by quantum processes) escape dequantisation, remain genuinely open research directions, not demonstrated wins [Schreiber2023surrogate, Sweke2025rff].
# Spine re-order recommendation and load-bearing concepts

## Re-order recommendation

RECOMMENDATION: Do NOT re-order the spine. Keep entanglement (Step 4) BEFORE the single-qubit Fourier payoff (Step 5) — but re-frame Step 4 so it is explicitly NOT presented as a prerequisite for the payoff.

The question is real and well-posed: the verified single-qubit Fourier payoff is mathematically independent of entanglement (it lives entirely on one qubit — confirmed to machine precision in the foundations track, and confirmed in the frontier literature where "removing entanglement often results in as good or better performance"). So in principle the payoff could come first ("here is the whole result on one qubit") with entanglement deferred as the "and now it scales" coda.

I recommend against that inversion, for three grounded reasons:

1. Topological build-up, not logical dependency, is what the pedagogy evidence rewards. Quantum Country deliberately defers entanglement until AFTER single-qubit fluency, and the convergent spine (Quantum Country + IBM) teaches multi-qubit structure as the natural next rung once the learner can read a single Bloch point and a single rotation. The payoff in Step 5 is the climax of the SINGLE-qubit story; interrupting the single-qubit arc to introduce a second qubit, CNOT and conditional measurement, and then returning to a single qubit for the Fourier finale, breaks the narrative far more than it helps. The current order keeps "add qubits / topology" as one clean conceptual escalation (Step 4) immediately before the conceptual climax (Step 5).

2. The "and now it scales" move is actually the WEAKEST honest card, so it should not be the finale. The frontier track is unambiguous: across careful benchmarks, scaling up and adding entanglement does NOT buy a demonstrated advantage in regression, and easy-to-train expressive models tend to be classically simulable. If entanglement were placed AFTER the payoff as the triumphant "now it scales" closer, the explainer would be ending on its least defensible claim and inviting exactly the over-claiming the whole piece is designed to avoid. Far better to teach entanglement as honest machinery in Step 4 (with the up-front caution that more entanglement is not automatically more power), and then end on the single-qubit payoff PLUS the honesty guardrail and the research on-ramp (Steps 5-6), which is the explainer's genuinely strong, defensible territory.

3. Putting entanglement first also pays off a promissory note made in Step 1. Step 1 flags "the Bloch sphere is single-qubit only" without saying why; Step 4 is where that debt is settled (two Bloch spheres cannot capture a Bell state; the conditional point-cloud can). Teaching entanglement before the payoff therefore closes a loop the learner is already holding open, whereas deferring it to after the payoff leaves that flag dangling across the entire climax.

Net: keep the order 1->2->3->4->5->6. The one change required is framing, not sequence — explicitly tell the reader that Step 5's payoff rides on a SINGLE qubit and does not need the entanglement they just met. This converts the strongest objection (independence) into a teaching asset: "you have already seen what entanglement adds to the topology; notice that the Fourier payoff needs none of it — it is all here on one qubit." That is sophistication build-up done honestly, and it reserves the closing position for the explainer's most defensible content rather than its most over-claimable.

## Most load-bearing concepts

- Amplitudes with sign/phase kept visible before squaring; speedup/expressivity is engineered interference, not parallel search
- Relative phase φ is physical and is the second Bloch axis (θ, φ), whereas global phase is an unobservable gauge freedom
- RZ is invisible in the Z-basis until you change basis (Hadamard) or interfere — the phase-to-mechanism hinge
- Data encoding sets the accessible frequencies and the encoding generator's eigenvalue gap is the base frequency; trainable gates set the coefficients; each re-uploading layer adds exactly one new top frequency
- A single re-uploading qubit gives a degree-L truncated Fourier series with integer frequencies 0..L (verified against the simulator) — depth buys bandwidth, but coefficients are constrained and spectrum overstates true expressivity

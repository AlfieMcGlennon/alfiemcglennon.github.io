# Plan — Simplified quantum intro post (the wide front door)

## Context

The companion to the deep piece ("Quantum Computing from First Principles…"). This is the ~4/10 front door for a smart non-specialist arriving from a "quantum" headline: an honest, jargon-light, maths-light intro that defers all depth to the deep piece and links to it. No weather/climate. Same repo, same `/writing/` styling, so the two read as two chapters of one body of work, published the same day, linking to each other.

This document is the **plan for sign-off**. Per the PRD: no page code until the spine is approved. The branch and the beginner-pedagogy research are done; the post `.mdx` and the stripped toys wait for your go-ahead. The deep piece is finished and is **not** being touched.

Grounded in `research/INTRO_PEDAGOGY.md` (beginner framing map + link shelf), produced from a beginner-oriented research pass (video explainers, beginner sites, an honest-analogy audit).

## What is already done (pre-build, no page code)
- **Branch `feat/quantum-intro`** created — see the branch-base note below.
- **`research/INTRO_PEDAGOGY.md`** — per-section beginner analogy, the traps to avoid, no-maths phrasing, and the curated outbound links.

---

## The load-bearing idea (protect it the whole way)
A quantum computer wins by **arranging interference so wrong answers cancel and the right one reinforces — not by trying everything at once.** Three honest analogies carry the post and chain together: an **arrow you tilt** (§3), **looking forces a decision** (§4), **cancel the wrong answers** (§5). "0 and 1 at once", "tries every answer at once", and "parallel universes" appear only to be corrected.

## Section spine — CONFIRMED (research endorses all six as ordered)

| # | Section | Toy | Voice |
|---|---|---|---|
| 1 | What is a quantum computer actually for? | none | `[PROSE: Alfie]` hook — use before mystique; kill "tries everything at once" in one line |
| 2 | Why is everyone suddenly talking about it? | none | `[PROSE: Alfie]` — sober "why now" (Willow below-threshold QEC, fidelity trend, ~$12.6bn 2025 investment), each with its caveat, no timelines |
| 3 | What is a qubit? | **stripped arrow** | neutral expository (AI-draftable); the "direction you set" model |
| 4 | How do you get an answer out? | **stripped arrow + measure** | neutral expository; measurement is probabilistic and destructive |
| 5 | So how could it ever help? | **tiny two-waves toy** | `[PROSE: Alfie]` light — arranged interference, honest+narrow scope |
| 6 | Want the actual machinery? | none | `[PROSE: Alfie]` close — one unmissable handoff to the deep piece |

Two **copy** refinements the research flagged (no reordering): (1) at the §4/§5 seam, make explicit that measurement being destructive is *why* parallelism is worthless, so §5 lands as a payoff; (2) keep §2 where it is (use-first hook is the stronger opening).

---

## Toy strategy — answers open question #2 (clean reuse, not a fork)

**The shared single-source-of-truth core stays `src/scripts/qsim.js` + `src/scripts/bloch.js`** (already built and verified by `npm test`). Any physics/projection fix made there propagates to both posts. That is the guarantee that matters; the per-post UI is thin.

- **§3 + §4 — one stripped arrow, seen twice.** Add an optional **`simple`** flag (and a **`measure`** flag) to the shared `QubitBloch.astro`:
  - `<QubitBloch simple />` (§3): locks φ (no phase axis/slider), hides the ⟨X⟩/⟨Y⟩/⟨Z⟩ bars, swaps the readout for a beginner "where you point sets the odds" line. Same sphere, so the visual language matches the deep piece.
  - `<QubitBloch simple measure />` (§4): the same stripped arrow plus P(0)/P(1) bars and **measure** / **measure ×100** buttons (a histogram converging on the odds), reusing `qsim.js` `sampleCounts`. No phase or basis controls.
  - The deep piece passes neither flag, so its rendered output is **unchanged**. This is a clean additive flag on the shared component, not a fork.
- **§5 — new tiny `TwoWaves.astro`.** A pure-canvas two-contributions visual (no quantum sim needed): one slider from "lined up" (reinforce, big combined wave) to "opposed" (cancel, flat), with a label that flips reinforce/cancel. Authored so its **default rendered state is the static figure**, progressively enhanced with the slider — the one artefact also serves the OG card and the no-JS/print path. New, but tiny and not a fork of anything.

**Branch base (flag for your call):** `feat/quantum-intro` is branched off `feat/quantum-explainer`, **not** bare `main`, because the toys to reuse only exist on the deep-piece branch (nothing is on `main` yet). Trade-off: until the deep piece merges to `main`, this branch contains the deep piece's commits (so its diff-vs-`main` shows both). Recommendation: keep it here for now; once the deep piece lands on `main`, rebase `feat/quantum-intro` onto `main` for a clean sibling. If you would rather they be true siblings immediately, the alternative is to land the shared `qsim.js`/`bloch.js`/components on `main` first.

---

## Section 5 — interference toy vs static figure — answers open question #3
**Recommendation: build the tiny toy, with the static figure as its default state.** §5 carries the whole post's load-bearing idea, and interference is the one place where *doing* (sliding from big-wave to flat-nothing) beats *reading*. Cost is contained because the static default IS the fallback (no separate asset). If time is tight, cut to the static two-panel figure ("lined up → reinforce", "opposed → cancel") — still lands the metaphor. Do **not** build a wave playground (no frequency/phase/number controls — that would smuggle in the depth this post defers).

## Outbound links — answers open question #4 (for your approval before they go in)
Deliberately short; the deep piece is the primary onward link and carries the full bibliography. Proposed shelf (full notes in `INTRO_PEDAGOGY.md`):
- **Videos:** WIRED/Talia Gershon "5 Levels"; Veritasium "What makes quantum computers SO powerful?"; 3Blue1Brown "But what is quantum computing? (Grover)"; Sabine Hossenfelder "Don't fall for quantum hype".
- **Reads:** Aaronson, *Why Is Quantum Computing So Hard to Explain?* (Quanta); Ferrie, "Myth: try all solutions at once"; QuEra "What is Superposition?"; Quantum Country.
- **Flagged as "un-learn this":** Kurzgesagt "Quantum Computers Explained" — beautiful but leans on the "calculate all states at once" line we are correcting; cite only as the framing to un-learn (your call whether to include it at all).

---

## Voice split (per PRD §0.4)
- **`[PROSE: Alfie]` (yours):** the §1 hook, the §2 "why now" framing, the §5 light framing, and the §6 close. A generic opener sinks this post, so these stay yours.
- **AI-draftable neutral expository middle (for you to edit):** §3 "what a qubit is" and §4 "how measurement works". I will draft these in the dry register and mark them so you can rewrite freely.

## Build phasing (after sign-off only) — shippable at each step
- **B1** — scaffold the `.mdx` (six sections, neutral expository middle drafted, `[PROSE: Alfie]` slots, the short link shelf, the deep-piece handoff). Postable as prose even with no toys.
- **B2** — add the `simple`/`measure` flags to `QubitBloch.astro`; embed §3 and §4. Re-run `npm test` (unchanged core) and confirm the deep piece still renders identically.
- **B3** — build `TwoWaves.astro`; embed §5 (static default + slider).
- **B4** — OG card (reuse the §5 figure or a sibling of the deep-piece card), a11y/reduced-motion pass, cross-links between the two posts, `draft` stays `true` until you publish (same day as the deep piece).

## Verification
`npm test` stays green (the shared core is untouched logic). `npm run build` clean; the deep piece's output unchanged by the new flags; the intro post builds with all three toys; cross-links resolve.

## Out of scope / will not do
No weather/climate; no phase/φ depth, RZ lesson, entanglement maths, or Fourier; no long bibliography; no change to the finished deep piece; no page code until this spine is signed off; no merge to `main` without your say-so.

## Open items for your sign-off
1. The 6-section spine (research confirms it) — approve or tweak.
2. Branch base: keep off the deep-piece branch (rebase later) vs land shared core on `main` first.
3. §5: tiny toy (recommended) vs static figure only.
4. The outbound link shelf above — approve, trim, or swap (incl. whether to mention Kurzgesagt at all).

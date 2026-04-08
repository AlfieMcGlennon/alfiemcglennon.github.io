# GB Grid Tool — Personal Deep Dive & Reflection Notes

Private notes covering the full journey, decisions made, things learned, and honest assessment.
For personal use, interviews, and future reference. Not for publication.

---

## Timeline & Scope

Built over ~2 weeks in April 2026. Started as "can I build an RL environment for GB grid dispatch?" and evolved into a full interactive scenario planning tool.

**What I actually built:**
- Interactive browser-based DC power flow tool for the GB transmission grid
- 27-zone and 82-zone models with three dispatch modes
- Validated against NESO's published boundary transfer data
- SCADA control room visual theme
- No backend — everything runs client-side
- ~14,000 lines of JavaScript + ~2,000 lines of Python validation scripts
- 21 data files processed from 7+ public sources

---

## Key Technical Decisions & Why

### Why 27 TNUoS zones (not 28 NESO zones or 674 substations)?

TNUoS zones were the only publicly documented zone scheme with GeoJSON boundaries, generation data, and demand data all aligned. NESO's 28-zone reduced model wasn't discoverable until deep into the project — I found it by reading the GB Reduced Model Release Note, which required knowing it existed first.

The 674-node substation model was too fine-grained — it routed power differently from any zonal model and didn't validate better. The 84 FLOP zones were the sweet spot for boundary analysis but required reverse-engineering the zone mapping from GSP boundary data and FES regional breakdown CSVs.

### Why DC power flow (not AC, not LP-only)?

DC power flow is the standard approximation for transmission planning studies. It captures the dominant physics (MW flow distribution based on impedance) while being fast enough for real-time interaction (<1ms). AC power flow would add reactive power and voltage but requires generator reactive capability data we don't have. Pure LP (NESO's approach) requires boundary limits but no impedances — we added this as the LOPF mode.

### Why merit order dispatch (not full unit commitment)?

Unit commitment requires temporal coupling (which generators were on last hour) and binary decision variables (MILP). Our tool runs single-timestep snapshots. Merit order with MSL constraints is the best approximation for a static dispatch model — the Chiodi et al. paper confirmed MSL is the single most impactful generator constraint.

### Why SCADA theme (not standard dashboard)?

Differentiation. Every student project uses Tailwind blue-on-white. The amber-on-black SCADA aesthetic communicates "this person understands how grids are operated" to anyone in energy. It's also more functional — high contrast, monospace fonts for data, flat panels matching real control room displays.

---

## Validation Journey — The Full Story

### What I tried and what happened

| Attempt | Configuration | B6F p75 | Overall | What I learned |
|---------|--------------|---------|---------|----------------|
| 1 | 27-zone, independent percentile grid, ACS demand | -32% | 0G 5F 5P | Demand was 34% too high (ACS peak vs typical) |
| 2 | 27-zone, correlated ERA5 hours, fixed 65% IC | -35% | 0G 5F 5P | Correlation didn't help — IC is the issue |
| 3 | 27-zone, dynamic IC lookup | -35% | 0G 4F 6P | IC change was marginal |
| 4 | 84-zone FLOP, DCPF | +103% | 0G 5F 5P | Finer resolution overconcentrates flow |
| 5 | 303-zone Gnode, DCPF | +87% | 0G 4F 6P | Same overconcentration |
| 6 | 674-node substation, DCPF | -8% (B6F best) | 0G 4F 6P | Best B6F but worst on intermediates |
| 7 | SQSS Economy scaling (wind=70%, nuclear=85%) | 5/10 in NESO p25-p75 range | N/A | Deterministic SQSS point works for range check |
| 8 | GZ8-GZ9 reactance fix | No change | Same | Reactances aren't the bottleneck |
| 9 | FES embedded generation | Worse | 0G 3F 7P | Double-counting made it worse |
| 10 | LOPF (HiGHS) | B2F +12% | 0G 5F 5P | LOPF helps Scottish intermediates |
| 11 | MSL constraints | B6F p25 -1% | 0G 5F 5P | MSL doesn't bite at zone-level aggregation |
| 12 | **Real NESO TSD demand (the breakthrough)** | **-2%** | 0G 3F 7P | ACS demand was the root cause all along |
| 13 | FLOP NetInj, 2013, dynamic IC | +13% B6F | **0G 6F 4P** | Best overall configuration |
| 14 | NESO 28-zone, net injection, 2013 | **-15% B6F (GOOD)** | 1G 3F 6P | First ever GOOD — but only 1 |
| 15 | Hybrid 137-zone (FLOP × TNUoS split) | -3% B6F | 0G 4F 6P | Clean boundaries but unstable at fine resolution |
| 16 | Round robin (all combinations) | Various | Best: 68% mean err | Definitive comparison across all approaches |

### The root causes I identified

1. **Demand baseline** (biggest impact): Using ACS peak demand (47,940 MW) instead of typical winter demand (~36,000 MW) inflated all flows by 34%. Fixed by using NESO TSD seasonal percentiles directly.

2. **Dispatch methodology** (irreducible gap): NESO uses LP-based economic dispatch with boundary flow limits and no impedances. We use DC power flow with impedance-based distribution. These produce fundamentally different flow allocation patterns. Neither is "wrong" — they answer different questions.

3. **Zone-boundary alignment**: ETYS boundaries are defined at Minor FLOP zone resolution (~84 zones). Any coarser model — including NESO's own 28-zone reduced model — has zones that straddle boundaries. This causes overestimation on shared boundaries (B1aF, B2F, B3).

4. **Interconnector assumptions**: Real IC imports average 16.4% of capacity, not 65%. But fixing this only marginally improved validation because the flow impact is concentrated in southern zones away from the Scottish boundaries we were trying to validate.

5. **NOT the cause**: Network reactances (verified to 1%), temporal correlation (tested with 70k correlated hours), MSL constraints (don't bite at zone level), FES generation data (embedded gen made it worse), network resolution (tested 4 levels).

### What NESO actually does (from their documents)

- **PLEXOS** (Energy Exemplar) for economic dispatch — pan-European market model
- **Boundary capabilities** from full AC power flow studies (not the reduced model)
- **Constraint costs** from Plexos LP re-dispatch with boundary limits (no impedances on lines — flows controlled purely by boundary flow constraints)
- **Weather year**: 2013 as base for E-CEM, 3-6 stress years for peak analysis
- **28-zone reduced model**: Published for third-party use (stability studies), NOT used internally for boundary analysis
- **84 Minor FLOP zones**: The actual resolution for boundary transfer analysis
- **Unconstrained percentiles** (25pc/75pc): From hourly PLEXOS dispatch without network constraints — "the minimum cost generation output profile"

---

## What I'd Do Differently

1. **Start with real TSD demand, not ACS peak.** This single mistake cost days of debugging. The `demand_mw_by_year` field in zones_tnuos.json is the ACS design value, not typical demand. Should have cross-checked against NESO historic TSD from day one.

2. **Build the FLOP zone model earlier.** The 27-zone TNUoS model was the obvious starting point but the wrong resolution for boundary validation. If I'd found the FES regional breakdown CSV earlier, I could have had FLOP zones from the start.

3. **Read the constraint modelling methodology first.** The document that says "lines have no physical characteristics — flows controlled by boundary limits" would have told me DC power flow was the wrong comparison target for NESO's percentiles. I spent days optimising the DC power flow when the real model uses no impedances at all.

4. **Not try to fix B1aF/B2F/B3.** These shared Scottish intermediate boundaries are unfixable at any resolution we tested. The zone-boundary misalignment is fundamental. Time spent on hybrid zones, correction factors, and substation-level models was educational but didn't improve results.

---

## Honest Assessment

### What's genuinely good
- B6F within 2% is a real result — the primary GB constraint boundary validated well
- Three dispatch modes (Simple → Merit Order → LOPF) tell a clear story about constraint management
- The SCADA theme is distinctive and professional
- Full transparency on methodology and limitations
- All data from public sources, all computation client-side
- The systematic validation journey IS the contribution — ruling out hypotheses one by one

### What's not great
- 0 GOOD boundaries in the best overall configuration (6 FAIR)
- Scottish intermediate boundaries (B1aF, B2F, B3) never get below 60% error
- LOPF falls back to merit order if HiGHS doesn't load (browser-dependent)
- The tool is a scenario exploration tool, not an engineering tool — numbers are directional, not precise
- Energy storage dispatch uses duration-bounded CF approximation (no temporal arbitrage)

### What would make it actually good
- Temporal dispatch (multi-hour episodes with start-up/ramp constraints)
- Real generator-level data from Elexon BMRS (actual half-hourly output per BM unit)
- FLOP zone boundaries from NESO (not reverse-engineered from GSP data)
- Dynamic interconnector model (market-responsive, not lookup table)
- Validation against actual constraint costs (not just boundary flows)

---

## Interview Talking Points

### For energy sector roles
"I built an open-source scenario planning tool for the GB transmission grid. It runs DC power flow at two resolutions — 27 TNUoS zones and 82 FLOP zones — with three dispatch modes including LOPF using an LP solver in the browser. I validated against NESO's published boundary transfer data and achieved B6F within 2%. The remaining gap is dispatch methodology — NESO uses PLEXOS which I can't replicate in open source."

### For data science / ML roles
"I processed 140,000 hours of ERA5 weather data across 27 zones, aligned it with 17 years of NESO demand data, and used it to validate a physics-based simulation. I tested 16+ model configurations systematically — like hyperparameter tuning but for a physical system. The tool serves as an RL training environment where the agent learns grid dispatch."

### For software engineering roles
"It's a React app with a custom physics engine — DC power flow solver, merit order dispatch, LP-based optimal dispatch — all running client-side with no backend. Built with Vite, deployed to GitHub Pages. The LP solver is HiGHS compiled to WASM. About 8,000 lines of JavaScript."

### If asked "what was the hardest part?"
"Finding the right demand baseline. I spent days optimising the power flow engine, trying different network resolutions, adding weather correlations — and the whole time the demand was 34% too high because I was using the ACS design peak instead of typical demand. One line of code fix, days of investigation to find it."

### If asked "what would you do next?"
"Train an RL agent on the environment. The tool already has three dispatch baselines — simple, merit order, and LP-optimal. An RL agent that learns to approximate the LP-optimal dispatch from experience would demonstrate that you can achieve near-optimal grid dispatch without explicit cost models. The environment is ready, the training data is processed, the validation framework is built."

---

## Key Numbers to Remember

- 27 TNUoS zones, 82 FLOP zones, 43/134 links
- B6F validated within 2% (p75, 27-zone, real NESO TSD)
- 70,000 winter hours of aligned ERA5+NESO data
- 1,896 generators in TEC Register, 313 Built
- 47,940 MW ACS peak demand, ~36,000 MW typical winter
- 7,200 MW B6F capability (2024), growing to 16,800 MW (2035)
- Real IC import: 16.4% of capacity (1,611 MW), not 65%
- 16+ validation configurations tested
- Tool: ~14,000 LOC JavaScript, 21 data files, <1ms solve time
- LOPF: HiGHS WASM, ~10ms solve, network-constrained economic dispatch

---

## Files That Matter Most

For anyone picking this up (including future me):

| File | Why it matters |
|------|---------------|
| `src/engine/scenarioRunner.js` | The orchestrator — builds generation, demand, dispatch, power flow, boundary utils. ~1000 lines. |
| `src/engine/dcPowerFlow.js` | The physics — 27×27 Gaussian elimination. Small but critical. |
| `src/engine/meritOrder.js` | Dispatch logic — national vs local blend, MSL, curtailment. |
| `src/engine/lopf.js` | LP formulation for HiGHS — cost minimisation with boundary constraints. |
| `public/data/zones_tnuos.json` | 27 zones with generation and demand — the foundation. |
| `public/data/etys_capabilities.json` | Boundary capabilities — the validation target. |
| `docs/METHODOLOGY.md` | Full methodology — 467 lines, publication quality. |
| `scripts/validation/validate_round_robin.py` | The definitive validation — 16 configs, all results. |
| `scripts/winter_validation_data.json` | 70k training episodes (generated locally, not in git). |
| `docs/RL_ENVIRONMENT_NOTES.md` | RL implementation plan (this file's companion). |

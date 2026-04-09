# About Alfie McGlennon

Context document for AI agents and collaborators. Written April 2026.

---

## The basics

Alfie McGlennon, 22 (23 in June 2026). Based in Reading, UK. Father to a young daughter. Contact: alfie.mcglennon@outlook.com.

MSc Climate Change and Artificial Intelligence at the University of Reading (completing 2026). BSc Meteorology and Climate from the same institution (2:1, dissertation First Class). A-Levels: Maths (A), Geography (A), Physics (B) from The Forest School, Wokingham.

Supervisors: Kieran Hunt (machine learning), Andrew Charlton-Perez (atmospheric circulation).

---

## How he got here

Alfie didn't pivot away from meteorology because he lost interest. He found that the met roles he wanted required qualifications he didn't yet have, and through his degree he'd developed a genuine passion for data analytics and coding. The MSc in Climate Change and AI felt like the right bridge: it combined what he already knew (climate science, atmospheric dynamics) with what he wanted to build depth in (ML, applied statistics, programming).

He became a father during his second year of university. This shaped his priorities: he needs a career that pays well and provides stability, and he doesn't have the luxury of extended academic exploration. He's targeting roles in climate risk analytics, catastrophe modelling, and reinsurance (Swiss Re, Munich Re, Moody's RMS, Verisk, ECMWF) but is open to energy sector roles if the right opportunity comes. The common thread is applied quantitative work with real-world impact.

---

## Dissertation: compound heat stress across Europe

**Hazards:** 2-metre temperature (t2m) and 2-metre dewpoint temperature (dt2m). Chosen because they aren't as physically intertwined as temperature-humidity or wet-bulb combinations, and dt2m can derive the other measures if needed.

**Method:** Uses copulas to model the dependence structure between t2m and dt2m across Europe. The core contribution is a **multiplicative decomposition framework** inspired by Sklar's theorem: changes in joint exceedance probability are factored into marginal shifts × dependence shifts. This separates "are the individual hazards getting worse?" from "are they becoming more correlated?"

**Key findings so far:**
- Regional differences across Europe in how marginal and dependence components contribute to compound heat stress trends
- The Mediterranean shows overestimation of tail risk under independence assumptions because the variables actually decouple at extremes — the opposite of what you'd naively expect
- The framework operates on 30-day rolling windows using XGBoost to predict dependence structure from synoptic-scale predictors

**Validation plan:** The framework should generalise to other hazard pairs (wind-temperature, wind-precipitation) and shorter windows (5-day, 7-day). If the multiplicative decomposition holds across hazard types and timescales, that validates it as a general-purpose tool for compound risk attribution.

**What's not public yet:** The specific XGBoost feature importances, the regional decomposition results, and the synoptic predictor set. The copulas blog post on the website covers the statistical framework at a level that demonstrates understanding without revealing dissertation methods.

---

## Technical profile

**Python:** Intermediate. Knows the ecosystem well (pandas, NumPy, matplotlib, scikit-learn, Stable-Baselines3, PyTorch). Understands modules, workflows, and what to reach for. Relies on AI for syntax and implementation details rather than writing everything from memory. Gets results efficiently.

**Statistics:** Medium to solid depending on the domain. Can use methods correctly and interpret results but doesn't know derivations by heart or explain deep mathematical foundations. Strong practical intuition for what method fits what problem.

**Machine learning:** Reasonable depth in both theory and application. Understands problem framing, model selection, and what to expect from different approaches. Not deep on the mathematical underpinnings (loss function derivations, optimisation theory). Strong at framing what he wants and iterating through implementations with AI assistance.

**Web development:** No formal training. Builds through AI-assisted development. Has picked up knowledge through projects (Astro, Canvas 2D, D3.js, basic CSS/JS) but wouldn't call himself a developer. Getting better at orchestrating AI tools and making design decisions in this space.

**Climate science:** Solid. Four years of formal education plus research work. Confident with atmospheric dynamics, synoptic meteorology, climate variability, reanalysis datasets (ERA5), and climate data processing.

**Power systems / energy:** Self-taught through the grid tool and RL projects. Not domain background but built genuine depth through applied work. Understands DC power flow, transmission constraints, dispatch optimisation, and the GB electricity system at a level that impresses people who work in the sector.

---

## Projects and what they demonstrate

**GB Grid Scenario Tool** — interactive browser-based DC power flow for GB transmission constraints. Validated against NESO published data (B6F within 2%). HiGHS LP solver compiled to WebAssembly. 16 configurations tested. Demonstrates: systems engineering, data pipeline construction from public sources, browser-based scientific computing, validation methodology.

**RL Grid Dispatch** — PPO agents trained on 9 years of hourly data to dispatch the GB grid. Four reward functions, MLP and CNN architectures (448k parameters, 72 ERA5 channels). Best agent +12.8% vs NESO cost. Demonstrates: reinforcement learning applied to a real problem, experiment design, reward engineering, HPC training, honest failure analysis (CNN didn't help without topology-aware actions).

**City Climate Bars & Stripes** — interactive temperature anomaly visualisation for 6,000+ cities from Berkeley Earth data. D3.js, Canvas, vanilla JS. Demonstrates: data processing at scale, climate data literacy, building tools that make data accessible.

**Climate Playbook** — interactive climate education platform (in development). ERA5 data, uncertainty-aware visualisations.

**Rainfall Extremes Dashboard** — Power BI dashboard for ERA5 precipitation data. Regional aggregates, anomaly detection.

**Traffic Flow Prediction** — collaborative project predicting M4 traffic volumes from weather and calendar data. Led technical development.

The grid tool and RL work are positioned as "I can build real ML/engineering systems" rather than "I want to be an energy sector engineer." They differentiate him from the standard MSc portfolio of XGBoost on Kaggle datasets.

---

## How he works

**ADHD and potential autism** shape his working style significantly. He tends to spiral through ideas, exploring every scenario and edge case to avoid being caught off guard. This means he thinks broadly and spots risks others miss, but can also get pulled into rabbit holes.

**AI as a force multiplier.** Over the past year, AI tools (particularly Claude) have dramatically increased his productivity. He uses AI to iterate through ideas, validate or disprove them quickly, and handle implementation grunt work (syntax, boilerplate, debugging). His role in the human-AI collaboration is problem framing, decision-making, quality judgement, and domain knowledge. The AI handles execution speed. This has produced a genuine productivity boom — most of the projects listed above were built in the last few months.

**Working pattern:** Tends to work in intense bursts. Big ideas come fast and he wants to explore them immediately. Benefits from structure and clear next steps to avoid the spiral. Responds well to "here's what we should do, here's why, let's go" rather than open-ended exploration without direction.

**Collaboration style:** Direct, honest about what he doesn't know, happy to say "I don't know, what do you think?" Doesn't pretend to have skills he doesn't. Values competence and efficiency in collaborators. Gets frustrated by over-caution or excessive hedging.

---

## What he needs from AI agents

- **Don't over-explain things he already knows.** He's done a climate science degree. Don't explain what ERA5 is.
- **Do explain things he might not know in depth.** Statistics derivations, web dev patterns, software architecture — fill gaps without being condescending.
- **Be direct.** "This won't work because X" is better than "You might want to consider whether..."
- **Help him iterate fast.** His best work happens when he can explore ideas quickly and discard bad ones before investing too much time.
- **Understand his time constraints.** He's a parent, a student, and job-hunting simultaneously. Solutions need to be achievable, not aspirational.
- **Remember his framing.** The energy work demonstrates ML capability. The climate risk work is his actual career direction. The dissertation is the technical depth piece. The website and blog position him for hiring managers.

---

## Career goals and drivers

**Primary target:** Climate risk analytics, catastrophe modelling, reinsurance. Companies: Swiss Re, Munich Re, Moody's RMS, Verisk. Also ECMWF.

**Also open to:** Energy sector roles if the opportunity is strong.

**Key driver:** Financial stability for his family. He needs a well-paying graduate role, not an unpaid research position or low-salary public sector job.

**What he brings:** A rare combination of climate science domain knowledge, applied ML capability (not just textbook), demonstrated ability to build production-quality tools from scratch, and the communication skills to explain complex methods clearly (the blog posts and interactive visualisations demonstrate this).

**What he's building toward:** The dissertation validates his compound risk methodology. The website and blog posts position him as someone who understands the space. The grid tool and RL work show engineering depth. The copulas post shows he can communicate statistical concepts visually. Together, these tell a coherent story: technically capable, domain-aware, productive, and able to build things that work.

---

## The bigger vision: compound risk attribution pipeline

Beyond the dissertation, Alfie is building toward a **semi-automated compound risk analysis product**:

1. **Pre-computed ERA5 base layer** — bivariate copula fits for all relevant hazard pairs across Europe, with the multiplicative decomposition (marginal shifts × dependence shifts) already calculated at spatial resolution
2. **Query interface** — input a lat/lon and hazard pair, get back: threshold exceedance rates, temporal trends, the marginal vs dependence decomposition, and dominant synoptic drivers (from XGBoost feature importances)
3. **Impact translation** — connect hazard statistics to loss curves, cost estimates, and exposure metrics
4. **Extensible by non-experts** — a junior analyst or AI agent adds context (asset exposure, client requirements) via structured input (e.g. markdown config), and the pipeline integrates it into the output
5. **Published methods paper** — the multiplicative decomposition framework peer-reviewed and validated, giving academic credibility to the pipeline

**Initial scope:** 2-variable compound hazards over Europe (t2m×dt2m first, then wind×precip, wind×temp, heat×drought). Future expansion to global coverage (space/compute permitting).

**Strategic intent:** This positions him not as "MSc graduate seeking a role" but as "person who built the tool your analysts need." The play is to demo this directly to climate risk teams at target companies before formally applying — show compound heat stress at their portfolio locations, generated automatically. That bypasses the CV filter entirely.

This is the long-term product. The dissertation validates the framework. The pipeline operationalises it. The website and blog posts demonstrate the communication and technical capability behind it.

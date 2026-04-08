# LinkedIn Carousel Spec — GB Grid Scenario Tool

Build in PowerPoint. Export as PDF for LinkedIn carousel upload.

---

## Positioning

This is a **tool-first post**. The tool is the product — it stands alone as a contribution to accessible grid analysis. RL is mentioned as context (what motivated building it) and as a teaser (what comes next), but the tool is the star.

Do NOT frame this as "I built this for myself." Frame it as "This didn't exist. Now it does. Anyone can use it."

---

## Visual Style

- **Background**: #0a0a0f (near-black, matches SCADA theme)
- **Primary text**: #d4d4d8 (warm light grey)
- **Accent**: #ffb000 (SCADA amber — headings, key numbers, highlights)
- **Secondary accent**: #00b4d8 (cyan — sparingly, for links/callouts)
- **Font**: JetBrains Mono (or Consolas/Courier as fallback)
- **Slide dimensions**: 1080x1350px (LinkedIn portrait) or 1920x1080 (landscape)
- **Border**: 1px #2a2a35 around screenshots

---

## Slide 1: THE SCREENSHOT (full-bleed, no text)

No title, no text, no logo. Just the image filling the slide.

**Use**: `Screenshot 2026-04-06 132429.png` — merit order mode, stressed boundaries, amber/red across Scotland-England. Crop to focus on map + overview panel. The "Most Stressed Boundaries" panel with SW1 at 124% and the warning banners should be visible.

Someone scrolling sees a dark SCADA control room display of the GB grid lit up in red and amber. They don't know what it is. They swipe.

---

## Slide 2: THE REVEAL

**Large amber text (centred):**
"There's no public tool for exploring GB grid constraints."

**Below (smaller, grey):**
"So I built one."

**Bottom (tiny, muted):**
"Open source. All public data. Runs in your browser."

---

## Slide 3: THE CONTRAST

This is the slide people screenshot and share. Two states of the same grid, side by side or before/after.

**Amber heading:**
"Same grid. Smarter dispatch."

**Left panel label**: "Merit Order"
- 9 boundaries overloaded
- Wind curtailed 392 MW
- Scotland can't export south

**Right panel label**: "LP-Optimal (LOPF)"
- 0 boundaries overloaded
- Cost-minimised with network constraints
- Same generation, different allocation

**Below:**
"The difference between these two is what NESO spends billions managing every year."

**Visuals**: Crop from slide 1 screenshot (stressed) on the left. Crop from `Screenshot 2026-04-06 132226.png` (LOPF balanced) on the right.

---

## Slide 4: WHAT I BUILT

**Amber heading:**
"What's under the hood"

**Body text (short bullets, grey):**

"DC power flow solver at two resolutions — 27 TNUoS zones and 82 FLOP zones.

Real ETYS network topology. Year-dependent reinforcements from 2024 to 2035.

Three dispatch modes: all-generation, merit order, and LP-optimal (HiGHS solver compiled to WebAssembly).

34 years of ERA5 weather data across every zone. NESO historic demand from 2009-2025.

N-1 contingency analysis. Plant-level editing. Scenario export.

Validated against NESO published boundary transfers — B6F within 2%."

**Visual**: Small inset of `Screenshot 2026-04-06 132538.png` (FLOP 82 zones) showing the higher resolution.

---

## Slide 5: THE CLOSE

**Amber heading:**
"Try it yourself"

**Body text:**
"Everything runs in the browser. No installation. No backend. No account.

All data from NESO (Open Government Licence) and ECMWF ERA5 (Copernicus C3S).

Full methodology and validation documented in the tool.

Next in this series: training RL agents to learn network-constrained dispatch from this environment — 109 continuous actions across all 27 zones."

**Below (cyan accent, larger):**
"Live demo: link in first comment"

**Bottom:**
"github.com/AlfieMcGlennon/gb-grid-tool"

---

## LinkedIn Caption

```
Scotland generates more wind than its grid can carry south.

There's no public tool that lets you explore this — adjust the weather, change the year, toggle fuel types, and see what happens to the transmission boundaries in real time.

So I built one. DC power flow at two resolutions, three dispatch modes including LP-optimal, 34 years of ERA5 weather, all running client-side in the browser. No backend, no installation, no proprietary data.

Under merit order dispatch, 9 boundaries exceed their secure capability. Switch to LP-optimal and zero do — same generation, different allocation. That gap is what the grid operator manages every day.

Validated against NESO's published ETYS boundary transfer data. B6F — the Scotland-England boundary — within 2%.

Full methodology and source code are public. Live demo link in the first comment.
```

---

## First Comment (post immediately after)

```
Live demo: https://alfiemcglennon.github.io/gb-grid-tool/
Best viewed on desktop — the interactive map and power flow engine need screen space.

Source code: https://github.com/AlfieMcGlennon/gb-grid-tool
Full methodology: click "Data & Sources" in the tool's top nav.

Data sources: NESO ETYS (Appendix B, F, G), ECMWF ERA5 reanalysis via Copernicus C3S, NESO historic TSD demand data.

This is part of a series on RL for grid dispatch. Next post: training agents with 109 continuous actions across the full network topology.

#EnergyTransition #PowerSystems #GridConstraints #RenewableEnergy #OffshoreWind #ElectricityMarkets #NetZero #NESO #ETYS #ERA5 #ECMWF #Copernicus #OpenData #OpenSource #DataScience #DataVisualisation #React #WebDev #ReinforcementLearning #MachineLearning #DCPowerFlow #TransmissionPlanning #BoundaryConstraints #UKEnergy #CleanPower2030
```

---

## Screenshots to Use

All in `docs/screenshots/Final/`:

| File | Best for |
|------|----------|
| `Screenshot 2026-04-06 132429.png` | **Slide 1** — Full-bleed hook. Merit order, stressed, dramatic. |
| `Screenshot 2026-04-06 132226.png` | **Slide 3 right** — LOPF mode, balanced. The contrast. |
| `Screenshot 2026-04-06 132538.png` | **Slide 4** — FLOP 82 zones, shows higher resolution. |
| `Screenshot 2026-04-06 132610.png` | Alternative — FLOP LOPF mode |
| `Screenshot 2026-04-06 132656.png` | Alternative — Year 2030 with reinforcements |
| `Screenshot 2026-04-06 132712.png` | Alternative — Reinforcements off, constraints building |

---

## PowerPoint Build Notes

- Single master slide: #0a0a0f background, JetBrains Mono font
- Slide 1 is JUST the screenshot — full-bleed, no text boxes
- Keep text sparse everywhere. LinkedIn compresses images. If you can't read it at 50% zoom on a phone, cut it.
- Export as PDF, upload to LinkedIn as a document (carousel format)
- Test the PDF on your phone before posting — that's how most people will see it

---

## Pre-Post Checklist

### 1-2 weeks before posting:
- [ ] Add ~50 targeted LinkedIn connections (NESO, TOs, consultancies, academics, energy journalists)
- [ ] Connection note: "Hi [name] — I work on power systems analysis and grid constraint modelling. Would be great to connect."
- [ ] Do NOT mention the post in connection requests
- [ ] Set up personal website with blog (even a simple GitHub Pages site)
- [ ] Publish first blog post: full grid tool build story (validation journey, what worked, what didn't, methodology)

### Day of posting:
- [ ] Post carousel as PDF document upload
- [ ] Caption in the post body (no hashtags in caption)
- [ ] First comment immediately after: demo link, source link, hashtags
- [ ] Post between 7-9am UK time (Tuesday, Wednesday, or Thursday — highest engagement)
- [ ] Engage with every comment within the first 2 hours (algorithm boost)

### After posting:
- [ ] If the demo link gets traffic, check it works on various browsers
- [ ] Share the post to any relevant LinkedIn groups (UK energy, power systems, data science)
- [ ] Cross-post a shorter version to Twitter/X with the same screenshot if you're active there

---

## Personal Website Blog Post Outline

First blog post: "Building an Interactive GB Grid Scenario Tool from Public Data"

Structure:
1. **The problem** (2 paragraphs) — No public interactive tool for GB transmission constraints. Commercial tools (PSS/E, PLEXOS) cost thousands and require training. NESO publishes the data but not the analysis tool.
2. **What I built** (3 paragraphs) — Overview, screenshots, link to live demo.
3. **The validation journey** (the core — 5-8 paragraphs) — 16 configurations tested. The demand baseline mistake. Why NESO's model and DC power flow give different answers. B6F within 2%. Honest about what doesn't validate (intermediate boundaries).
4. **Technical decisions** (3-4 paragraphs) — Why DC not AC. Why merit order not unit commitment. Why HiGHS WASM in the browser. Why SCADA theme.
5. **What's next** (2 paragraphs) — RL series. The environment enables per-zone topology-aware dispatch learning.
6. **Links** — Demo, source, NESO data portal, ERA5.

Target: ~2,000 words. Include 3-4 screenshots. Link to it from every future LinkedIn post.

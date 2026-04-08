# LinkedIn Post Build Prompt — GB Grid Scenario Tool

Use this document as a prompt in Claude Desktop to help build the PowerPoint carousel, draft the post text, and manage the posting workflow.

---

## Context for Claude Desktop

I'm posting a LinkedIn carousel about an interactive browser-based tool I built for exploring GB electricity transmission constraints. The tool runs DC power flow at 27-zone and 82-zone resolution, has three dispatch modes (simple, merit order, LP-optimal), uses ERA5 weather data and NESO public grid data, and runs entirely client-side with no backend. The LP solver (HiGHS) is compiled to WebAssembly.

Key facts:
- Live demo: https://alfiemcglennon.github.io/gb-grid-tool/
- Source: https://github.com/AlfieMcGlennon/gb-grid-tool
- B6F (Scotland-England boundary) validated within 2% of NESO published data
- Under merit order dispatch, 9 boundaries exceed secure capability. Under LOPF, zero do.
- 1,896 generation projects, 34 years of ERA5 weather, 70,000 training episodes
- This is post 3 of a 4-part series on RL for grid dispatch (but this post focuses on the tool)
- All data from NESO (OGL v3) and ECMWF ERA5 (C3S licence)

---

## Step 1: Build the PowerPoint

### Master slide setup
- Background: #0a0a0f (near-black)
- Font: JetBrains Mono (download from fonts.google.com if not installed). Fallback: Consolas or Courier New.
- Accent colour: #ffb000 (SCADA amber)
- Text colour: #d4d4d8 (warm light grey)
- Secondary accent: #00b4d8 (cyan, use sparingly)
- Slide size: 1080x1350px portrait (File > Slide Size > Custom) OR 1920x1080 landscape

### Slide 1: THE SCREENSHOT (no text)
- Insert `docs/screenshots/Final/Screenshot 2026-04-06 132429.png`
- Stretch to fill entire slide. No text boxes, no logo, no overlay.
- If portrait format: crop to show the map + left overview panel (Most Stressed Boundaries list visible)
- This slide's job: stop the scroll. Dark SCADA display with red/amber stress indicators.

### Slide 2: THE REVEAL
- Centre of slide, large amber text (#ffb000, ~40pt):
  "There's no public tool for exploring GB grid constraints."
- Below, smaller grey text (#d4d4d8, ~24pt):
  "So I built one."
- Bottom of slide, tiny muted text (#666, ~14pt):
  "Open source. All public data. Runs in your browser."

### Slide 3: THE CONTRAST
- Heading in amber (#ffb000, ~32pt): "Same grid. Smarter dispatch."
- Split the slide into two panels (left and right):
  
  LEFT PANEL:
  - Label: "Merit Order" (amber, ~20pt)
  - Cropped screenshot from slide 1 image (stressed, red boundaries)
  - Below image, grey text bullets (~16pt):
    - "9 boundaries overloaded"
    - "Wind curtailed 392 MW"
    - "Scotland can't export south"
  
  RIGHT PANEL:
  - Label: "LP-Optimal" (amber, ~20pt)  
  - Cropped screenshot from `Screenshot 2026-04-06 132226.png` (LOPF, green)
  - Below image, grey text bullets (~16pt):
    - "0 boundaries overloaded"
    - "Cost-minimised with constraints"
    - "Same generation, different allocation"

- Below both panels, full-width grey text (~18pt):
  "The difference is what NESO spends billions managing every year."

### Slide 4: WHAT I BUILT
- Heading in amber: "What's under the hood"
- Grey text bullets (~18pt, generous line spacing):
  - "DC power flow at two resolutions - 27 TNUoS zones and 82 FLOP zones"
  - "Real ETYS network topology with reinforcements from 2024 to 2035"
  - "Three dispatch modes: simple, merit order, and LP-optimal via HiGHS WebAssembly"
  - "34 years of ERA5 weather data. NESO historic demand from 2009-2025"
  - "N-1 contingency analysis. Plant-level editing. Scenario export"
  - "Validated against NESO boundary transfers - B6F within 2%"
- Optional: small inset screenshot of FLOP 82-zone view in bottom-right corner

### Slide 5: THE CLOSE
- Heading in amber: "Try it yourself"
- Grey text (~20pt):
  "Everything runs in the browser. No installation. No backend. No account."
  ""
  "All data from NESO (Open Government Licence) and ECMWF ERA5 (Copernicus C3S)."
  ""
  "Full methodology and validation documented in the tool."
  ""
  "Next in this series: RL agents learning network-constrained dispatch"
  "109 continuous actions across all 27 zones."
- Cyan text (#00b4d8, ~22pt, centred near bottom):
  "Live demo and source code: link in first comment"

### Export
- File > Export > Create PDF
- Test the PDF on your phone before posting (that's how 80% of people will see it)
- Upload to LinkedIn as a "Document" post (this creates the carousel swipe format)

---

## Step 2: Post Text

### Caption (paste into LinkedIn post body)

```
Scotland generates more wind than its grid can carry south.

There's no public tool that lets you explore this - adjust the weather, change the year, toggle fuel types, and see what happens to the transmission boundaries in real time.

So I built one. DC power flow at two resolutions, three dispatch modes including LP-optimal, 34 years of ERA5 weather, all running client-side in the browser. No backend, no installation, no proprietary data.

Under merit order dispatch, 9 boundaries exceed their secure capability. Switch to LP-optimal and zero do - same generation, different allocation. That gap is what the grid operator manages every day.

Validated against NESO's published ETYS boundary transfer data. B6F - the Scotland-England boundary - within 2%.

Full methodology and source code are public. Live demo link in the first comment.
```

### First Comment (post within 30 seconds of the main post)

```
Live demo: https://alfiemcglennon.github.io/gb-grid-tool/
Best viewed on desktop - the interactive map and power flow engine need screen space.

Source code: https://github.com/AlfieMcGlennon/gb-grid-tool
Full methodology: click "Data & Sources" in the tool's top nav.

Data sources: NESO ETYS (Appendix B, F, G), ECMWF ERA5 reanalysis via Copernicus C3S, NESO historic TSD demand data.

This is part of a series on RL for grid dispatch. Next: training agents with 109 continuous actions across the full network topology.

#EnergyTransition #PowerSystems #GridConstraints #RenewableEnergy #OffshoreWind #ElectricityMarkets #NetZero #NESO #ETYS #ERA5 #ECMWF #Copernicus #OpenData #OpenSource #DataScience #DataVisualisation #React #WebDev #ReinforcementLearning #MachineLearning #DCPowerFlow #TransmissionPlanning #BoundaryConstraints #UKEnergy #CleanPower2030
```

---

## Step 3: Pre-Post Checklist

### 1-2 weeks before:
- [ ] Add ~50 targeted LinkedIn connections:
  - NESO analysts and planners
  - National Grid ET, SSEN Transmission, SPT engineers
  - Baringa, Aurora, LCP, Cornwall Insight, AFRY analysts
  - University power systems researchers
  - Energy journalists (Carbon Brief, Utility Week, Energy Voice)
  - Ofgem analysts
  - Renewable developers (SSE Renewables, Orsted, ScottishPower Renewables)
- [ ] Connection note: "Hi [name] - I work on power systems analysis and grid constraint modelling. Would be great to connect."
- [ ] Do NOT mention the upcoming post in connection requests
- [ ] Set up personal website with blog (GitHub Pages or similar)
- [ ] Publish blog post: "Building an Interactive GB Grid Scenario Tool from Public Data"
- [ ] Test the live demo works on Chrome, Firefox, Safari, Edge
- [ ] Test on a slow connection (the 15s fetch timeout should show an error, not hang)

### Day of posting:
- [ ] Post between 7-9am UK time, Tuesday/Wednesday/Thursday
- [ ] Upload carousel PDF as a Document post
- [ ] Paste caption (no hashtags in caption body)
- [ ] Post first comment immediately (links + hashtags)
- [ ] Engage with every comment within the first 2 hours
- [ ] Do not edit the post in the first hour (algorithm penalty)

### After posting:
- [ ] Monitor demo link for traffic/issues
- [ ] Share to relevant LinkedIn groups (UK energy, power systems, data science)
- [ ] Cross-post shorter version to Twitter/X if active there
- [ ] Note which hashtags/connections drove the most engagement for post 4

---

## Step 4: Blog Post Outline

Title: "Building an Interactive GB Grid Scenario Tool from Public Data"

### 1. The Problem (~200 words)
No public interactive tool for GB transmission constraint analysis. Commercial tools (PSS/E, PLEXOS, PowerWorld) cost thousands and require training. NESO publishes the data in spreadsheets but not an analysis tool. Energy analysts, students, journalists, and community groups have no way to explore "what if" scenarios on the grid without hiring a consultancy or learning MATLAB.

### 2. What I Built (~300 words)
Overview of the tool. Screenshots. Link to live demo. Key capabilities: year slider, dispatch modes, weather percentiles, fuel toggles, plant editing, N-1 contingency. The SCADA visual theme and why. Client-side architecture and why no backend matters (accessibility, transparency, speed).

### 3. The Validation Journey (~600 words — the core)
This is the content that doesn't fit in a LinkedIn post but distinguishes this from a toy project.

- Started with 27 TNUoS zones, ACS peak demand. Everything was 34% too high.
- Tried 16+ configurations: 4 resolutions x 2 dispatch methods x 2 IC modes x 2 time periods.
- The demand baseline discovery: ACS design peak (47,940 MW) vs typical winter demand (~36,000 MW). One variable, days to find.
- Found NESO uses 82 internal FLOP zones, not 27. Reverse-engineered the mapping from GSP boundary data.
- Found NESO uses LP-based dispatch with boundary limits and no impedances — fundamentally different from DC power flow.
- B6F within 2%. Scottish intermediate boundaries (B1aF, B2F, B3) never below 60% error — and why that's expected.
- Root cause: dispatch methodology, not network topology or power flow formulation.

### 4. Technical Decisions (~400 words)
- Why DC not AC (correct at zonal aggregation, same as NESO uses for boundary transfer analysis)
- Why merit order not unit commitment (single-snapshot tool, no temporal coupling)
- Why HiGHS WASM in the browser (no backend dependency, instant feedback, runs anywhere)
- Why SCADA theme (differentiation, communicates domain knowledge, more functional than dashboard aesthetic)

### 5. What's Next (~200 words)
RL series. The tool is the environment for post 4. Per-zone topology-aware dispatch. 109 continuous actions vs 3 discrete. The comparison that justifies the environment build.

### 6. Links
- Live demo
- Source code
- NESO data portal
- ERA5 / Copernicus CDS
- Full methodology (in-tool Data & Sources page)

Target: ~1,700 words. 4-5 screenshots. Publish before the LinkedIn post so slide 5 can reference "full build story on my blog."

---

## Responding to Comments

Common questions and how to answer them:

**"How accurate is this?"**
"B6F (the main Scotland-England boundary) validates within 2% of NESO's published 75th percentile transfers. Intermediate Scottish boundaries have larger errors (50-100%) because NESO uses LP-based dispatch with boundary flow limits, which distributes power differently from DC power flow. The tool is most accurate for relative comparisons between scenarios — 'what happens if Scottish wind doubles' — rather than absolute MW predictions."

**"Why not use PyPSA?"**
"PyPSA is excellent but requires a Python environment. This runs in the browser with zero installation — open a URL and start exploring. The DC power flow engine was independently validated against PyPSA (all 43 link flows match to 0.000 MW). Different goals: PyPSA is a research library, this is an interactive exploration tool."

**"What's the data source?"**
"All from NESO (ETYS Appendix B for network, Appendix F for generation, Appendix G for demand, Boundary Chart Data for capabilities) and ECMWF ERA5 reanalysis via Copernicus C3S for weather. Everything is published under open licences (OGL v3 and C3S). Full attribution in the tool's Data & Sources page."

**"Can I use this for [commercial/academic/policy] work?"**
"Yes — the tool and source code are on GitHub, data is all openly licensed. For academic use, the methodology page has full citations. For policy or commercial work, note the limitations documented in the tool — it's a planning-level scenario tool, not an engineering-grade study."

**"How long did this take?"**
"About two weeks of focused work. The data processing pipeline (ERA5 alignment, substation mapping, FLOP zone extraction) was the most time-consuming part. The DC power flow solver itself is ~200 lines of JavaScript."

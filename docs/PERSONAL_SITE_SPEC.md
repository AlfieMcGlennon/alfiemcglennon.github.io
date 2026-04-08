# Personal Site Spec — alfiemcglennon.github.io

Full build instructions for an Astro-based personal site with blog and per-project theming.

---

## 1. Repo Setup

### Create the repo on GitHub
- Name: `alfiemcglennon.github.io`
- Visibility: Public (required for GitHub Pages on free plan)
- Licence: **MIT** — standard for personal sites/portfolios. It's permissive, signals open-source mindset, and nobody will clone your personal blog anyway. Avoid GPL (overkill), avoid no licence (looks closed).
- .gitignore template: **Node** — covers node_modules, dist, .env, OS files
- README: Yes, keep it minimal ("Personal site and blog. Built with Astro.")
- Do NOT initialise with a branch protection rule — you want to push directly to main

### After creating, clone locally:
```bash
git clone https://github.com/AlfieMcGlennon/alfiemcglennon.github.io.git
cd alfiemcglennon.github.io
```

---

## 2. Astro Project Setup

### Initialise
```bash
npm create astro@latest . -- --template minimal --no-install
npm install
```

When prompted:
- Template: minimal (we're building custom, not using a starter theme)
- TypeScript: No
- Install dependencies: Yes

### Install extras
```bash
npm install @astrojs/mdx
npm install sharp
```

That's it. No React dependency needed unless you want interactive components later.

### File structure after setup
```
alfiemcglennon.github.io/
├── public/
│   ├── images/              # Screenshots, headshot, project images
│   │   ├── headshot.jpg     # Your photo (crop to square, ~400x400)
│   │   ├── grid-tool/       # Grid tool screenshots
│   │   │   ├── hero.png     # Main stressed-boundaries screenshot
│   │   │   └── lopf.png     # LOPF balanced screenshot
│   │   └── rl/              # RL series images (later)
│   └── favicon.svg          # Simple favicon
├── src/
│   ├── layouts/
│   │   ├── Base.astro       # HTML shell: head, nav, footer
│   │   ├── Page.astro       # Standard page layout (about, projects)
│   │   └── Post.astro       # Blog post layout with project accent theming
│   ├── pages/
│   │   ├── index.astro      # Home/about page
│   │   ├── projects.astro   # Project gallery
│   │   └── blog/
│   │       ├── index.astro  # Blog listing
│   │       └── [...slug].astro  # Dynamic blog post pages (from content)
│   ├── content/
│   │   └── blog/
│   │       └── building-gb-grid-tool.md  # First blog post
│   ├── components/
│   │   ├── Nav.astro        # Top navigation
│   │   ├── Footer.astro     # Footer with social links
│   │   ├── ProjectCard.astro # Card for projects page
│   │   └── PostCard.astro   # Card for blog listing
│   └── styles/
│       └── global.css       # All styles in one file
├── astro.config.mjs
├── package.json
└── .gitignore
```

---

## 3. Configuration

### astro.config.mjs
```javascript
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://alfiemcglennon.github.io',
  integrations: [mdx()],
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
    },
  },
});
```

### Content collections config
Create `src/content/config.js`:
```javascript
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.date(),
    project: z.string().optional(),
    accent: z.string().optional(),
    tags: z.array(z.string()).optional(),
    image: z.string().optional(),
  }),
});

export const collections = { blog };
```

---

## 4. Design System

### Base palette (site-wide)
```css
:root {
  --bg-primary: #0a0a0f;
  --bg-secondary: #12121a;
  --bg-card: #1a1a25;
  --text-primary: #e4e4e8;
  --text-secondary: #9ca3af;
  --text-muted: #6b7280;
  --border: #2a2a35;
  --accent: #e4e4e8;           /* Default accent — overridden per project */
  --font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', 'Consolas', monospace;
}
```

### Per-project accent colours
Set via CSS variable on the page/post level. The accent colour tints: headings, link hover, code block left-border, tag pills, horizontal rules.

```css
/* Grid tool posts */
[data-project="grid-tool"] {
  --accent: #ffb000;           /* SCADA amber */
}

/* RL series posts */
[data-project="rl-dispatch"] {
  --accent: #7c3aed;           /* Violet — ML/computation */
}

/* Future projects just add a new block */
[data-project="weather-analysis"] {
  --accent: #06b6d4;           /* Cyan */
}
```

### Typography
- Body: Inter (Google Fonts, load via `<link>` in Base.astro `<head>`)
- Code/monospace: JetBrains Mono
- Headings: Inter at heavier weight, coloured with `var(--accent)`
- Body text: 18px, line-height 1.7 (readable on all screens)

### Layout
- Max content width: 720px (readable prose width)
- Nav: fixed top, semi-transparent dark background, your name left, links right
- Footer: social icon links (GitHub, LinkedIn, email), muted text
- Mobile: single column, hamburger nav if needed (Astro handles this with vanilla JS)

---

## 5. Page Content

### Home/About (index.astro)

Layout like Laurent's but with your details and the dark theme:

```
[Nav: Alfie McGlennon | about  blog  projects  cv]

HI, I'M ALFIE                          [headshot photo]

I work on power systems analysis,
grid constraint modelling, and
reinforcement learning for energy
dispatch.

I built an open-source interactive
tool for exploring GB transmission
constraints — DC power flow, LP
dispatch, and ERA5 weather data,
all running in the browser.

Currently exploring how RL agents
can learn network-constrained
dispatch from experience.

[CV icon] [Email icon] [GitHub icon] [LinkedIn icon]

[Footer]
```

Keep it to 3 short paragraphs. No life story. The blog posts carry the detail.

### Projects (projects.astro)

Grid of project cards. Each card has:
- Project title
- One-line description
- Accent-coloured left border (matches the project's colour)
- Link to live demo + blog post
- Small screenshot

Start with two cards:
1. **GB Grid Scenario Tool** — "Interactive browser-based DC power flow for GB transmission constraints" — amber accent — link to demo + blog post
2. **RL Grid Dispatch** — "Reinforcement learning agents for network-constrained power dispatch" — violet accent — "Series in progress" — link to blog tag

### Blog listing (blog/index.astro)

Simple reverse-chronological list. Each entry:
- Title (accent-coloured based on project tag)
- Date
- One-line description
- Tags

### Blog post layout (Post.astro)

```
[Nav]

[Title — large, accent-coloured]
[Date] · [Reading time] · [Tags as pills]

[Hero image if provided]

[Markdown content — rendered with syntax highlighting]

[Footer]
```

The `data-project` attribute on the post wrapper div sets the accent colour. The Post layout reads the `project` field from the frontmatter and applies it.

---

## 6. First Blog Post

File: `src/content/blog/building-gb-grid-tool.md`

### Frontmatter
```yaml
---
title: "Building an Interactive GB Grid Scenario Tool from Public Data"
description: "How I built a browser-based DC power flow tool for the GB transmission network, validated it against NESO published data, and what I learned from 16 failed configurations."
date: 2026-04-10
project: "grid-tool"
accent: "#ffb000"
tags: ["power-systems", "dc-power-flow", "open-data", "neso", "era5"]
image: "/images/grid-tool/hero.png"
---
```

### Full draft

```markdown
Scotland generates more wind power than its transmission grid can carry south. The Scotland-England boundary — known as B6F in industry — is the single most constrained corridor in the GB network, and it gets worse every year as offshore wind capacity grows faster than reinforcement can keep up.

There is no public tool that lets you explore this. NESO publishes the data — network topology, boundary capabilities, generation projects, demand forecasts — but it lives in spreadsheets and PDFs. Commercial tools like PSS/E and PLEXOS cost tens of thousands of pounds and require weeks of training. If you're a policy analyst, a student, a journalist, or a community energy group, you have no way to ask "what happens to the grid if Scottish wind doubles?" and get an answer in real time.

So I built one.

## What the tool does

The GB Grid Scenario Tool is an interactive browser-based application for stress-testing the GB electricity transmission network. You select a year (2024–2035), choose a scenario, adjust weather sliders for wind, solar, and demand, toggle fuel types on or off, and see the results of a DC power flow calculation displayed on a map with boundary utilisation heatmapping.

Three dispatch modes show the progression from naive to optimal:

- **Simple**: all generation runs at full capacity. Useful for seeing raw generation potential but not realistic.
- **Merit order**: generation dispatched cheapest-first until demand is met. Wind and solar run first, then gas fills the gap. Produces realistic cost ordering but ignores network constraints.
- **LP-optimal (LOPF)**: cost-minimised dispatch subject to boundary flow limits and per-link thermal constraints, solved using HiGHS compiled to WebAssembly. This is closest to what NESO actually does operationally.

Under merit order dispatch at p73 wind, 9 of 18 mapped boundaries exceed their secure capability. Switch to LOPF and zero do. Same generation fleet, different allocation. That gap — the difference between unconstrained and constrained dispatch — is what NESO spends billions managing every year through the Balancing Mechanism.

Everything runs client-side. No backend, no API calls, no account. Open a URL and start exploring.

**[Live demo](https://alfiemcglennon.github.io/gb-grid-tool/)** (desktop recommended)

![GB Grid Tool — merit order dispatch with stressed boundaries](/images/grid-tool/hero.png)

## The validation journey

This is the part that doesn't fit in a LinkedIn post but is where most of the engineering happened.

I validated the tool against NESO's published ETYS boundary transfer data — the 75th and 95th percentile expected power flows across each boundary, by year and scenario. The target was B6F, the Scotland-England boundary, because it carries the dominant north-south transfer and has the most published comparison data.

### The demand baseline mistake

My first 10 configurations all had the same problem: every flow was 30-35% too high. I tried four network resolutions (27-zone, 82-zone, 137-zone hybrid, 674-node substation), two dispatch methods, two interconnector assumptions, reactance sensitivity analysis, circuit-level debugging. Nothing helped.

The root cause was embarrassingly simple. I was using ACS peak demand (47,940 MW) — the design maximum that the grid is built to handle — instead of typical winter demand (~36,000 MW). One field in one JSON file. It inflated every injection by 34%, which inflated every flow proportionally.

The fix was one line. The investigation to find it took days. This is the single most important lesson of the project: **check your demand baseline before you optimise anything else.**

### 16 configurations tested

After fixing demand, I tested systematically:

| Resolution | Dispatch | IC mode | B6F error | Overall |
|-----------|----------|---------|-----------|---------|
| 27-zone TNUoS | Merit order | Dynamic IC | **-2%** | 3 FAIR, 7 POOR |
| 82-zone FLOP | Net injection | Dynamic IC | +13% | 6 FAIR, 4 POOR |
| NESO 28-zone | Net injection | Dynamic IC | -15% | 1 GOOD, 3 FAIR |
| 137-zone hybrid | Various | Various | -3% | 4 FAIR, 6 POOR |

B6F within 2% is a real result. The remaining error on intermediate Scottish boundaries (B1aF, B2F, B3 — typically 50-100% error) turned out to be fundamental, not fixable.

### Why the remaining error exists

NESO uses PLEXOS — a commercial LP-based dispatch tool that distributes power using transfer sensitivities (how much a generator's output change affects a specific boundary flow), not impedances. Their constraint model has no line reactances at all. Power is allocated by boundary flow limits, not by physics.

DC power flow does the opposite: it distributes power inversely proportional to impedance. This is physically correct but produces different flow patterns from NESO's LP.

Neither approach is wrong — they answer different questions. DC power flow shows where power would flow if the network operated unconstrained. NESO's model shows where power flows after active constraint management. The tool is most accurate for relative comparisons between scenarios ("what happens to B6 if Scottish wind doubles?") where systematic biases cancel.

### What I discovered along the way

- NESO uses 82 internal "FLOP zones" for boundary analysis, not the 27 TNUoS zones they publish. I reverse-engineered the mapping from GSP boundary GeoJSON data and FES regional breakdown CSVs.
- Real interconnector imports average 16.4% of capacity (1,611 MW), not the 65% commonly assumed. High GB demand correlates with high continental demand (cold weather across the North Sea region), reducing available imports.
- Four ETYS boundaries (B0, NW1, NW2, SC3) are at network edges — peninsulas and islands with no cross-zone link. They can't be modelled at any zonal resolution.
- The DC power flow engine was independently validated against PyPSA 1.1.2 — all 43 link flows match to 0.000 MW.

## Technical decisions

**Why DC power flow, not AC?** At 27-node zonal resolution, each node represents dozens of substations. Voltage magnitude and reactive power within a zone are meaningless at this aggregation. DC approximation captures the dominant physics (MW distribution by impedance) and is the same approximation NESO uses for boundary transfer analysis. AC would add complexity with no accuracy benefit.

**Why merit order, not unit commitment?** The tool runs single-timestep snapshots. Unit commitment requires temporal coupling — which generators were on last hour, start-up costs, ramp rates, minimum up/down times. That needs a backend or a fundamentally different architecture. Merit order with minimum stable level constraints is the best static approximation.

**Why HiGHS in the browser?** LOPF dispatch requires an LP solver. The alternatives were: (a) send the problem to a backend server, (b) use a JavaScript LP library, or (c) compile a production LP solver to WebAssembly. Option (a) adds infrastructure and latency. Option (b) — the pure-JS solvers I tested couldn't handle the problem size reliably. Option (c) — HiGHS is a world-class open-source LP solver and compiles cleanly to WASM. Solve time is ~10ms for the 27-node problem. The user gets instant feedback with no server dependency.

**Why the SCADA theme?** Every portfolio project uses Tailwind blue-on-white. The amber-on-black SCADA aesthetic communicates "this person understands how grids are operated" to anyone in the energy sector. It's also more functional — high contrast, monospace fonts for data readability, flat panels matching real control room displays.

## What's next

This tool is the environment for a reinforcement learning research series. The first two posts trained RL agents with 3 discrete actions on a flat state space — they learned demand matching but couldn't learn network constraints. The action space was the bottleneck.

With the full 27-zone topology, the agent gets 109 continuous actions — per-zone per-type dispatch fractions with physical constraints. The same four reward-focused agents from post 1, but now they can see the network. Post 4 will show whether topology-aware actions enable the agent to learn what the LP solver computes analytically.

The environment, the data, and the baselines are ready. The training infrastructure is the easy part — the hard part was building a validated environment from public data. That's done.

## Links

- **Live demo**: [alfiemcglennon.github.io/gb-grid-tool](https://alfiemcglennon.github.io/gb-grid-tool/)
- **Source code**: [github.com/AlfieMcGlennon/gb-grid-tool](https://github.com/AlfieMcGlennon/gb-grid-tool)
- **NESO data portal**: [neso.energy/data-portal](https://www.neso.energy/data-portal)
- **ERA5 / Copernicus CDS**: [cds.climate.copernicus.eu](https://cds.climate.copernicus.eu)

Contains NESO data © Crown copyright, used under the Open Government Licence v3.0.
Contains modified Copernicus Climate Change Service information, 2024.
```

---

## 7. Deployment

### GitHub Pages with Astro

Add to `astro.config.mjs` if not already there:
```javascript
export default defineConfig({
  site: 'https://alfiemcglennon.github.io',
  // No 'base' needed for username.github.io repos
});
```

### GitHub Actions workflow

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

Then in GitHub repo settings: Pages > Source > GitHub Actions.

### .gitignore additions for the site repo
The Node template covers most of it. Add:
```
# Astro
dist/
.astro/

# OS
.DS_Store
Thumbs.db

# Editor
.vscode/
.idea/

# Drafts (if you want to keep unpublished drafts locally)
src/content/blog/_drafts/
```

---

## 8. Google Fonts

Add to `Base.astro` `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

---

## 9. Social Meta Tags

Add to `Base.astro` `<head>` (makes LinkedIn/Twitter previews look good):
```html
<meta property="og:title" content="{title}" />
<meta property="og:description" content="{description}" />
<meta property="og:image" content="{image or default}" />
<meta property="og:url" content="{canonical URL}" />
<meta property="og:type" content="article" />
<meta name="twitter:card" content="summary_large_image" />
```

---

## 10. Future Content Plan

| Post | Project | Accent | Topic |
|------|---------|--------|-------|
| 1 | grid-tool | #ffb000 | Building the GB Grid Scenario Tool (this post) |
| 2 | rl-dispatch | #7c3aed | RL Post 1 recap: MLP baseline, 4 reward agents |
| 3 | rl-dispatch | #7c3aed | RL Post 2 recap: CNN failure, why spatial obs needs spatial actions |
| 4 | rl-dispatch | #7c3aed | RL Post 4: full topology agent, 109 actions, results |

Each blog post links to the LinkedIn post and vice versa. The blog has the depth, LinkedIn has the reach.

---

## 11. Prompting Guide for Claude Desktop

When building the site with Claude Desktop, use prompts like:

**Initial setup:**
"I have an empty Astro project at alfiemcglennon.github.io/. Build me a Base.astro layout with a dark theme (#0a0a0f background), Inter font for body, JetBrains Mono for code, fixed top nav with my name and links to about/blog/projects, and a footer with GitHub/LinkedIn/email icons. Support a --accent CSS variable that defaults to #e4e4e8 but can be overridden per page via a data-project attribute."

**Blog post layout:**
"Create a Post.astro layout that reads the project and accent fields from the post frontmatter, sets data-project on the wrapper div, and renders the markdown content with syntax highlighting. Include the post title, date, estimated reading time, and tags as accent-coloured pills."

**Styling:**
"Write global.css for my personal site. Dark theme, base colours from the spec in PERSONAL_SITE_SPEC.md. Per-project accent colours via CSS custom properties. Blog post content styling: readable prose width (720px max), generous line spacing, accent-coloured headings, left-bordered code blocks, responsive images. Mobile-first."

**Content pages:**
"Build the about page (index.astro) with my headshot on the right, 3 paragraphs about me on the left, and social links below. Build the projects page with cards for 'GB Grid Scenario Tool' (amber accent) and 'RL Grid Dispatch' (violet accent)."

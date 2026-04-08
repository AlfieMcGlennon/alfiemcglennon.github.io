# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal website and blog for Alfie McGlennon, built with Astro. Deployed to GitHub Pages at alfiemcglennon.github.io. The site showcases two main projects:

1. **GB Grid Scenario Tool** — interactive browser-based DC power flow tool for GB transmission constraints (separate repo: gb-grid-tool)
2. **RL Grid Dispatch** — reinforcement learning series for network-constrained power dispatch (4-post arc)

## Build Commands

```bash
npm install                  # Install dependencies
npm run dev                  # Local dev server
npm run build                # Production build (output: dist/)
npm run preview              # Preview production build
```

## Tech Stack

- **Framework**: Astro with MDX integration (`@astrojs/mdx`)
- **Deployment**: GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`)
- **Fonts**: Inter (body), JetBrains Mono (code) via Google Fonts
- **Image processing**: sharp
- **No React** unless interactive components are added later

## Architecture

### Site Structure (from PERSONAL_SITE_SPEC.md)

```
src/
├── layouts/
│   ├── Base.astro       # HTML shell: head, nav, footer, meta tags
│   ├── Page.astro       # Standard page layout
│   └── Post.astro       # Blog post layout with per-project accent theming
├── pages/
│   ├── index.astro      # Home/about page
│   ├── projects.astro   # Project gallery
│   └── blog/
│       ├── index.astro  # Blog listing (reverse chronological)
│       └── [...slug].astro  # Dynamic blog post pages
├── content/
│   └── blog/            # Markdown/MDX blog posts with frontmatter
├── components/
│   ├── Nav.astro        # Fixed top nav
│   ├── Footer.astro     # Social links (GitHub, LinkedIn, email)
│   ├── ProjectCard.astro
│   └── PostCard.astro
└── styles/
    └── global.css       # Single CSS file, all styles
```

### Design System

- **Theme**: Dark (#0a0a0f background), SCADA-inspired aesthetic
- **Per-project accent colours** via CSS custom property `--accent`, set by `data-project` attribute on page wrapper:
  - `grid-tool`: `#ffb000` (SCADA amber)
  - `rl-dispatch`: `#7c3aed` (violet)
- **Content width**: 720px max for readable prose
- **Typography**: 18px body, line-height 1.7

### Content Collections

Blog posts use Astro content collections with this frontmatter schema:
- `title`, `description`, `date` (required)
- `project`, `accent`, `tags`, `image` (optional)

The `project` field drives accent theming — Post.astro reads it and sets `data-project` on the wrapper div.

## Astro Config

```javascript
// astro.config.mjs
site: 'https://alfiemcglennon.github.io'
integrations: [mdx()]
markdown.shikiConfig.theme: 'github-dark'
```

No `base` path needed — this is a username.github.io repo.

## docs/ Directory

Contains planning/spec documents (not published to the site):
- `PERSONAL_SITE_SPEC.md` — full build spec with all page content, design tokens, and deployment config
- `PROJECT_DEEP_DIVE.md` — private notes on the grid tool project (not for publication)
- `METHODOLOGY.md` — full technical methodology for the grid tool
- `RL_ENVIRONMENT_NOTES.md` — RL environment design and experiment plan
- `LINKEDIN_CAROUSEL_SPEC.md` / `LINKEDIN_POST_PROMPT.md` — social media content specs

Refer to `PERSONAL_SITE_SPEC.md` as the source of truth for site design decisions.

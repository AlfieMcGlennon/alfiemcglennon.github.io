# City Climate Bars & Stripes: Bringing Climate Visualisation to 6,000+ Cities

## The Idea

You've probably seen Ed Hawkins' famous [Climate Stripes](https://showyourstripes.info) — those striking bands of blue-to-red that show how global temperatures have shifted over time. They're one of the most iconic pieces of data visualisation in climate communication. Hawkins created them here at the University of Reading, where I studied Meteorology and Climate for my undergrad and where I'm currently doing my MSc in Climate Change and AI. So the concept has been in my periphery for a while.

At some point I just thought: wouldn't it be cool if you could see climate stripes for *your* city? Not just national or global averages, but the actual temperature history of individual cities — with seasonal breakdowns, different baselines, the lot. So I built it.

**City Climate Bars & Stripes** is an interactive, browser-based tool that lets you explore temperature anomalies for over 6,000 cities worldwide, spanning from 1850 to the present day.

## Why I Built It

Honestly, this was a "that would be cool, let's just make it" kind of project. I'm not a frontend engineer — at the time I'd never touched React or built anything like this. My background is in climate science, not web development. But I had a clear idea of what I wanted: take Berkeley Earth's city-level temperature data, which is incredible but not exactly approachable in raw CSV form, and turn it into something interactive and visual that anyone could explore.

I used Claude Code to help with the implementation, but the more interesting part for me was the process of coming up with the concept, figuring out what features would actually be useful, and planning how it should all fit together. The idea, the design decisions, the data understanding — that was the work. The coding was the execution. The whole thing came together in a few days.

It's worth saying upfront: this is an exploratory visualisation, not a scientific tool. The Berkeley Earth city data involves interpolation, and the geographic matching isn't perfect. For rigorous analysis, the official Climate Stripes project is the place to go. But as a way to *see* and *feel* how temperatures have changed in cities you know — it does the job.

## What It Does

At its core, you pick a city and get a visualisation of its temperature history. But there's a surprising amount of flexibility under the hood:

- **Annual and seasonal views** — see the full year, or drill into winter (DJF), spring (MAM), summer (JJA), or autumn (SON) individually. Seasonal patterns can be dramatically different from annual averages.
- **Bars and stripes modes** — bars give you a proper axis with a zero line so you can read exact anomaly values; stripes give you that clean, iconic Hawkins-style view.
- **Two baseline periods** — 1850-1900 (pre-industrial) or 1961-2010 (modern climatological normal). Switching between these changes the story the data tells.
- **Three colour scaling modes** — fixed scale (consistent across all cities), auto-symmetric (scaled to each city's data), or auto min-max. Each reveals different things.
- **Quick browsing** — arrow keys let you flip through cities rapidly, which is genuinely the most fun way to use it.
- **PNG download** — grab and share any view with one click.

## The Tech

The entire application is a single `index.html` file — no build tools, no frameworks, no backend. Partly that's a feature (it loads anywhere, no infrastructure needed), and partly it reflects where I was at the time: I hadn't used React or any frontend framework before. Everything runs client-side in the browser.

- **HTML5 Canvas** for rendering (not SVG — canvas handles the volume of data better and makes PNG export trivial)
- **D3.js** for CSV parsing and the red-blue diverging colour scale (`d3.interpolateRdBu`)
- **Vanilla JavaScript** for everything else — state management, DOM updates, keyboard navigation
- **CSS Grid** for responsive layout

The data comes from **Berkeley Earth** (temperature anomalies, CC BY-NC 4.0) and **GeoNames** (city metadata, CC BY 4.0). In total it's about 230MB of CSV data covering ~6,100 cities — split across multiple files so the browser can load them in parallel without choking.

### Data Pipeline

The raw data flows through a fairly straightforward pipeline:

1. CSV files are fetched in parallel with timeout handling
2. D3 parses them with a flexible row parser that handles column name variations
3. Data is aggregated by city and country code into a lookup map
4. On city selection, the relevant slice is pulled, sorted by year, and fed into the canvas rendering pipeline

The renderer computes colour domains based on the active scaling mode, maps each year's anomaly to a position on the blue-red spectrum, and draws either bars or stripes accordingly. High-DPI displays get proper device pixel ratio scaling so everything stays crisp.

## Interesting Challenges

**Handling column name inconsistencies** — the seasonal and annual CSVs don't use identical column headers. Rather than preprocessing everything into a uniform format, I wrote a flexible parser that maps multiple naming conventions to the same internal fields. Pragmatic, if not elegant.

**Colour domain logic** — getting the colour scaling right was fiddly. Fixed domains need to be wide enough to not clip most cities, auto-symmetric needs to always include zero and be symmetric around it, and auto min-max needs to span the actual data range while still including zero. Each mode also has a floor so it never collapses to a useless narrow band.

**Performance at scale** — 6,000+ cities with 170 years of data across 5 seasonal views adds up. Splitting the CSVs, using canvas instead of SVG, and debouncing renders with `requestAnimationFrame` keeps it responsive.

## What I Learned

- **You don't need to be a frontend developer to build something useful.** I came at this from a climate science background with no prior web development experience. Having a clear vision of what the end product should look and feel like mattered more than knowing the framework ecosystem.
- **The ideas matter more than the code.** Knowing *what* to build — which features are useful, what baselines to offer, why seasonal views tell a different story — that came from my domain knowledge. The implementation followed from there.
- **Climate data is fascinating at the city level.** Global averages smooth out so much. When you look at individual cities, you see wildly different seasonal patterns, some cities warming far faster than others, and winter trends that look nothing like summer ones.

## Try It

The project is live on GitHub Pages and the source is open on [GitHub](https://github.com). Pick your city, flip through the seasons, switch between bars and stripes — and see what 170 years of temperature change looks like where you live.

---

*Built by Alfie McGlennon — MSc Climate Change and AI, University of Reading. Data from Berkeley Earth and GeoNames, inspired by Ed Hawkins' Climate Stripes. Licensed CC BY-NC 4.0.*

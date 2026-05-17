# CV data

Single source of truth for the CV. `cv.json` feeds both `src/pages/cv.astro`
(the HTML page at `/cv/`) and `scripts/build-cv.mjs` (which generates the
LaTeX file that CI compiles into `public/cv.pdf`).

Edit `cv.json` only. Both the HTML page and the PDF rebuild on the next
push.

## Field reference

### Top-level

| Field      | Type     | Notes                                                 |
|------------|----------|-------------------------------------------------------|
| `name`     | string   | Full name as shown on the CV.                         |
| `email`    | string   | Public contact email.                                 |
| `location` | string   | City + country.                                       |
| `website`  | string   | Bare URL, no `https://`. Rendered as a link.          |
| `linkedin` | string   | Bare URL, no `https://`. Rendered with label "LinkedIn". |
| `github`   | string   | Bare URL, no `https://`. Rendered with label "GitHub".   |
| `summary`  | string   | One or two sentence positioning statement. Optional. Leave empty to skip the section. |

### `education[]`

| Field         | Type     | Notes                                                       |
|---------------|----------|-------------------------------------------------------------|
| `degree`      | string   | e.g. "MSc Climate Change & AI". Use `&` literally; the LaTeX template escapes it. |
| `institution` | string   | e.g. "University of Reading".                               |
| `location`    | string   | City + country, or campus name.                             |
| `start`       | string   | Year or month-year, e.g. "2024" or "Sep 2024". May be blank for finished degrees with no listed start. |
| `end`         | string   | Same format as `start`. Use `"Present"` for ongoing work.   |
| `notes[]`     | string[] | Bullet points. Each item becomes a bullet under the entry.  |

### `experience[]`

| Field          | Type     | Notes                                  |
|----------------|----------|----------------------------------------|
| `role`         | string   | Job title or position.                 |
| `organisation` | string   | Company, lab, or group name.           |
| `location`     | string   | City + country, or "Remote".           |
| `start`        | string   | Year or month-year.                    |
| `end`          | string   | Year or month-year, or `"Present"`.    |
| `notes[]`      | string[] | Bullets describing what you did and what came out of it. |

### `projects[]`

| Field     | Type     | Notes                                                       |
|-----------|----------|-------------------------------------------------------------|
| `name`    | string   | Project name as you'd want it on the CV.                    |
| `link`    | string   | Bare URL, no `https://`. Optional. Rendered as a link.      |
| `summary` | string   | One short sentence. Optional.                               |
| `notes[]` | string[] | Bullets. Optional.                                          |

### `skills`

Object whose keys are category labels and whose values are arrays of skill
strings. The HTML and PDF render each category on its own line as
`Category: item, item, item`. Add or remove categories freely.

Example:

```json
"skills": {
  "Languages": ["Python", "JavaScript", "R"],
  "ML & data": ["XGBoost", "PyTorch", "scikit-learn"]
}
```

### `publications[]`

| Field     | Type     | Notes                                                     |
|-----------|----------|-----------------------------------------------------------|
| `title`   | string   | Paper title.                                              |
| `authors` | string   | Author list as you'd write it.                            |
| `venue`   | string   | Journal, conference, or preprint server.                  |
| `year`    | string   | Year.                                                     |
| `link`    | string   | Bare URL, no `https://`. Optional.                        |

## Local PDF build

If you have a TeX distribution installed (`pdflatex` on the PATH):

```bash
node scripts/build-cv.mjs
```

writes `build/cv/cv.tex` then attempts to compile `public/cv.pdf`. Without
LaTeX locally, the script still writes the `.tex` file and tells you to
push so CI can compile it. CI uses the `xu-cheng/latex-action` GitHub
Action, configured to be non-blocking: a broken PDF will not stop the
site deploy.

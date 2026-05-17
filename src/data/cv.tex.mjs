// LaTeX template for the CV.
//
// Exports `renderTex(cv)` which takes the parsed cv.json object and
// returns a complete `.tex` string. Used by scripts/build-cv.mjs.
//
// Uses pdflatex-compatible packages only (geometry, lmodern, microtype,
// xcolor, enumitem, titlesec, hyperref) so the CI build works on a
// vanilla TeXLive install with no font hunting.
//
// Section order: Summary, Skills, Projects, Education, Experience,
// Volunteering, Publications.
//
// No em dashes, no en dashes. Date ranges read as "X to Y".
// British English.

export function tex(s) {
  if (s == null || s === '') return '';
  return String(s)
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}')
    .replace(/</g, '\\textless{}')
    .replace(/>/g, '\\textgreater{}');
}

export function texUrl(s) {
  if (!s) return '';
  return String(s).replace(/#/g, '\\#').replace(/%/g, '\\%');
}

function dateRange(start, end) {
  if (!start && !end) return '';
  if (!start) return end;
  if (!end) return start;
  return `${start} to ${end}`;
}

function entryHeader(left, rightParts) {
  const right = rightParts.filter(Boolean).map(tex).join(' \\quad ');
  return `\\vspace{0.25em}\\noindent ${left}\\hfill \\textit{${right}}\\par`;
}

function bullets(items) {
  if (!items || items.length === 0) return '';
  const lines = items.map((n) => `  \\item ${tex(n)}`);
  return ['\\begin{itemize}', ...lines, '\\end{itemize}'].join('\n');
}

function roleSection(heading, entries) {
  if (!entries?.length) return '';
  const items = entries.map((x) => {
    const left = [
      `\\textbf{${tex(x.role)}}`,
      x.organisation ? `, \\textit{${tex(x.organisation)}}` : '',
    ].join('');
    const header = entryHeader(left, [
      x.location,
      dateRange(x.start, x.end),
    ]);
    return [header, bullets(x.notes)].filter(Boolean).join('\n');
  });
  return `\\section*{${heading.toUpperCase()}}\n${items.join('\n\n')}`;
}

export function renderTex(cv) {
  // PDF contact line includes the email; the HTML page hides it to keep
  // it out of web scrapers. Website is shown in both.
  const contactBits = [
    cv.location && tex(cv.location),
    cv.email &&
      `\\href{mailto:${texUrl(cv.email)}}{${tex(cv.email)}}`,
    cv.website &&
      `\\href{https://${texUrl(cv.website)}}{${tex(cv.website)}}`,
    cv.linkedin && `\\href{https://${texUrl(cv.linkedin)}}{LinkedIn}`,
    cv.github && `\\href{https://${texUrl(cv.github)}}{GitHub}`,
  ].filter(Boolean);

  const sections = [];

  // Summary
  if (cv.summary) {
    sections.push(`\\section*{SUMMARY}\n${tex(cv.summary)}`);
  }

  // Skills: compact two-column tabular (category | items)
  if (cv.skills && Object.keys(cv.skills).length) {
    const rows = Object.entries(cv.skills)
      .filter(([, items]) => Array.isArray(items) && items.length > 0)
      .map(
        ([category, items]) =>
          `\\textbf{${tex(category)}} & ${items.map(tex).join(', ')} \\\\[0.22em]`
      );
    if (rows.length) {
      sections.push(
        `\\section*{SKILLS}\n` +
          `\\noindent\\begin{tabular}{@{}p{0.27\\linewidth}@{\\hspace{0.6em}}p{0.69\\linewidth}@{}}\n` +
          rows.join('\n') +
          `\n\\end{tabular}`
      );
    }
  }

  // Projects
  if (cv.projects?.length) {
    const items = cv.projects.map((p) => {
      const techPart =
        p.tech && p.tech.length
          ? ` {\\small (${p.tech.map(tex).join(', ')})}`
          : '';
      const left = `\\textbf{${tex(p.name)}}${techPart}`;
      const header = entryHeader(left, [p.dates]);
      const linkLine = p.link
        ? `\\noindent {\\small \\href{https://${texUrl(p.link)}}{${tex(p.link)}}}\\par`
        : '';
      const summary = p.summary ? `\\noindent ${tex(p.summary)}\\par` : '';
      return [header, linkLine, summary, bullets(p.notes)]
        .filter(Boolean)
        .join('\n');
    });
    sections.push(`\\section*{PROJECTS}\n${items.join('\n\n')}`);
  }

  // Education
  if (cv.education?.length) {
    const items = cv.education.map((e) => {
      const left = [
        `\\textbf{${tex(e.degree)}}`,
        e.institution ? `, \\textit{${tex(e.institution)}}` : '',
      ].join('');
      const header = entryHeader(left, [
        e.location,
        dateRange(e.start, e.end),
      ]);
      return [header, bullets(e.notes)].filter(Boolean).join('\n');
    });
    sections.push(`\\section*{EDUCATION}\n${items.join('\n\n')}`);
  }

  // Experience
  const expSection = roleSection('Experience', cv.experience);
  if (expSection) sections.push(expSection);

  // Volunteering
  const volSection = roleSection('Volunteering', cv.volunteering);
  if (volSection) sections.push(volSection);

  // Publications
  if (cv.publications?.length) {
    const items = cv.publications.map((p) => {
      const linkPart = p.link
        ? ` \\href{https://${texUrl(p.link)}}{[link]}`
        : '';
      const venue = [p.venue, p.year].filter(Boolean).map(tex).join(', ');
      return `\\item ${tex(p.authors)}. \\textit{${tex(p.title)}}. ${venue}.${linkPart}`;
    });
    sections.push(
      `\\section*{PUBLICATIONS}\n\\begin{itemize}\n${items.join('\n')}\n\\end{itemize}`
    );
  }

  return `\\documentclass[10pt,a4paper]{article}

\\usepackage[a4paper,top=14mm,bottom=14mm,left=16mm,right=16mm]{geometry}
\\usepackage{lmodern}
\\usepackage[T1]{fontenc}
\\usepackage[utf8]{inputenc}
\\usepackage{microtype}
\\usepackage{xcolor}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{hyperref}

\\definecolor{teal}{HTML}{0A554F}
\\definecolor{rule}{HTML}{DDD8D0}

\\hypersetup{
  colorlinks=true,
  linkcolor=teal,
  urlcolor=teal,
  pdftitle={CV -- ${tex(cv.name)}},
  pdfauthor={${tex(cv.name)}}
}

\\titleformat{\\section}
  {\\normalfont\\large\\bfseries\\color{teal}}
  {}{0em}{}[{\\color{rule}\\titlerule[0.4pt]}]
\\titlespacing*{\\section}{0em}{0.7em}{0.25em}

\\setlist[itemize]{
  leftmargin=1.1em,
  labelsep=0.35em,
  itemsep=0.04em,
  topsep=0.18em,
  parsep=0em
}

\\pagestyle{empty}
\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{0pt}

\\begin{document}

\\begin{center}
  {\\LARGE\\bfseries ${tex(cv.name)}}\\par
  \\vspace{0.35em}
  \\small ${contactBits.join(' \\ \\ $\\cdot$ \\ \\ ')}
\\end{center}

\\vspace{0.3em}

${sections.join('\n\n')}

\\end{document}
`;
}

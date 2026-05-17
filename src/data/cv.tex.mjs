// LaTeX template for the CV.
//
// Exports `renderTex(cv)` which takes the parsed cv.json object and
// returns a complete `.tex` string. Used by scripts/build-cv.mjs.
//
// Uses pdflatex-compatible packages only (geometry, lmodern, microtype,
// xcolor, enumitem, titlesec, hyperref) so the CI build works on a
// vanilla TeXLive install with no font hunting.
//
// No em dashes. British English.

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
  const e = end || 'Present';
  if (!start) return e;
  return `${start} -- ${e}`;
}

function entryHeader(left, rightParts) {
  const right = rightParts.filter(Boolean).map(tex).join(' \\quad ');
  return `\\vspace{0.35em}\\noindent ${left}\\hfill \\textit{${right}}\\par`;
}

function bullets(items) {
  if (!items || items.length === 0) return '';
  const lines = items.map((n) => `  \\item ${tex(n)}`);
  return ['\\begin{itemize}', ...lines, '\\end{itemize}'].join('\n');
}

export function renderTex(cv) {
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

  if (cv.summary) {
    sections.push(`\\section*{Summary}\n${tex(cv.summary)}`);
  }

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
    sections.push(`\\section*{Education}\n${items.join('\n\n')}`);
  }

  if (cv.experience?.length) {
    const items = cv.experience.map((x) => {
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
    sections.push(`\\section*{Experience}\n${items.join('\n\n')}`);
  }

  if (cv.projects?.length) {
    const items = cv.projects.map((p) => {
      const name = `\\textbf{${tex(p.name)}}`;
      const link = p.link
        ? ` \\quad \\href{https://${texUrl(p.link)}}{\\small ${tex(p.link)}}`
        : '';
      const summary = p.summary ? `\\par ${tex(p.summary)}` : '';
      return [
        `\\vspace{0.35em}\\noindent ${name}${link}${summary}`,
        bullets(p.notes),
      ]
        .filter(Boolean)
        .join('\n');
    });
    sections.push(`\\section*{Projects}\n${items.join('\n\n')}`);
  }

  if (cv.skills && Object.keys(cv.skills).length) {
    const rows = Object.entries(cv.skills)
      .filter(([, items]) => Array.isArray(items) && items.length > 0)
      .map(
        ([category, items]) =>
          `\\noindent \\textbf{${tex(category)}:} ${items.map(tex).join(', ')}\\par`
      );
    if (rows.length) {
      sections.push(`\\section*{Skills}\n${rows.join('\n\\vspace{0.15em}\n')}`);
    }
  }

  if (cv.publications?.length) {
    const items = cv.publications.map((p) => {
      const linkPart = p.link
        ? ` \\href{https://${texUrl(p.link)}}{[link]}`
        : '';
      const venue = [p.venue, p.year].filter(Boolean).map(tex).join(', ');
      return `\\item ${tex(p.authors)}. \\textit{${tex(p.title)}}. ${venue}.${linkPart}`;
    });
    sections.push(
      `\\section*{Publications}\n\\begin{itemize}\n${items.join('\n')}\n\\end{itemize}`
    );
  }

  return `\\documentclass[11pt,a4paper]{article}

\\usepackage[a4paper,top=18mm,bottom=18mm,left=20mm,right=20mm]{geometry}
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
  {\\normalfont\\large\\bfseries\\color{teal}\\scshape}
  {}{0em}{}[{\\color{rule}\\titlerule[0.4pt]}]
\\titlespacing*{\\section}{0em}{1em}{0.4em}

\\setlist[itemize]{
  leftmargin=1.2em,
  labelsep=0.4em,
  itemsep=0.12em,
  topsep=0.3em,
  parsep=0em
}

\\pagestyle{empty}
\\setlength{\\parindent}{0pt}

\\begin{document}

\\begin{center}
  {\\Huge\\bfseries ${tex(cv.name)}}\\par
  \\vspace{0.5em}
  \\small ${contactBits.join(' \\ \\ $\\cdot$ \\ \\ ')}
\\end{center}

\\vspace{0.4em}

${sections.join('\n\n')}

\\end{document}
`;
}

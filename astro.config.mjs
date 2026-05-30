import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
  site: 'https://alfiemcglennon.com',
  integrations: [mdx(), sitemap()],
  markdown: {
    // Math is parsed site-wide (gated on `$`/`$$` syntax). No existing post uses
    // `$`, so this is inert everywhere except posts that opt in. KaTeX CSS is only
    // loaded on pages with `math: true` in frontmatter (see Base.astro).
    remarkPlugins: [remarkMath],
    rehypePlugins: [
      [
        rehypeKatex,
        {
          // Dirac-notation conveniences used by the quantum explainer.
          macros: {
            '\\ket': '\\lvert #1 \\rangle',
            '\\bra': '\\langle #1 \\rvert',
            '\\braket': '\\langle #1 \\rangle',
            '\\expval': '\\langle #1 \\rangle',
          },
        },
      ],
    ],
    shikiConfig: {
      theme: 'github-dark',
    },
  },
});

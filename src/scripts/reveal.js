// reveal.js — one-shot "this is interactive" entrance for figure cards.
//
// Marks elements with [data-reveal] and fades/translates them in once as they
// scroll into view, using a single IntersectionObserver. It is deliberately
// conservative: it arms the hidden start-state with a class on <html> so that
// no-JS AND reduced-motion readers always see fully-visible content (the CSS
// start-state lives behind html.reveal-armed + prefers-reduced-motion:
// no-preference in global.css). Motion here is wayfinding, not decoration:
// only the interactive figures reveal, never the prose.

import { prefersReducedMotion } from './scrolly.js';

let io = null;

function revealAllNow(scope) {
  scope.querySelectorAll('[data-reveal]:not(.is-revealed)')
    .forEach((el) => el.classList.add('is-revealed'));
}

export function attachReveals(scope = document) {
  // No motion (reduced-motion or no IO support): leave everything visible.
  if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
    revealAllNow(scope);
    return;
  }

  // Arm the hidden start-state only now that we can guarantee a reveal.
  document.documentElement.classList.add('reveal-armed');

  if (!io) {
    io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          io.unobserve(entry.target);
        }
      }
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  }

  scope.querySelectorAll('[data-reveal]:not(.is-revealed)').forEach((el) => io.observe(el));

  // If the reader switches reduced-motion on mid-session, reveal whatever is
  // still hidden so nothing is ever stuck invisible.
  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => { if (mq.matches) revealAllNow(document); };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }
}

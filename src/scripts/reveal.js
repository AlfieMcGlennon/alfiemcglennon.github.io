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

// Reduced-motion rescue, registered exactly once at module load (not per call):
// if a reader enables reduced motion mid-session, reveal anything still hidden.
if (typeof window !== 'undefined' && window.matchMedia) {
  const _mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const _onRM = () => { if (_mq.matches) revealAllNow(document); };
  if (_mq.addEventListener) _mq.addEventListener('change', _onRM);
  else if (_mq.addListener) _mq.addListener(_onRM);
}

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
}

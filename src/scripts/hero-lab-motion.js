// hero-lab-motion.js — shared "should this variant be animating right now?"
// gate for the three Hero Lab canvas variants (Synoptic, Atmosphere) and the
// Almanac's tiny looping accents.
//
// A loop is allowed to run only when ALL of the following hold:
//   - prefers-reduced-motion is NOT set to reduce
//   - the tab is visible (document.visibilitychange)
//   - the hero section is actually on screen (IntersectionObserver)
//
// This is intentionally the single source of truth for that logic so each
// variant's renderer doesn't reimplement its own listener wiring.

export function prefersReducedMotionNow() {
  return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}

// Watches `el` and calls onChange(active) whenever the combined
// "may animate" state flips. Calls onChange once immediately with the
// starting state. Returns a detach() function.
export function watchMotionGate(el, { onChange }) {
  const state = {
    reduced: prefersReducedMotionNow(),
    hidden: typeof document !== 'undefined' ? document.hidden : false,
    // Assume visible until the observer reports otherwise (avoids a flash of
    // "not animating" before the first IO callback on some browsers).
    onScreen: true,
  };

  let last = null;
  function emit() {
    const active = !state.reduced && !state.hidden && state.onScreen;
    if (active === last) return;
    last = active;
    onChange(active);
  }

  const mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const onMq = () => { state.reduced = mq.matches; emit(); };
  if (mq) {
    if (mq.addEventListener) mq.addEventListener('change', onMq);
    else if (mq.addListener) mq.addListener(onMq);
  }

  const onVis = () => { state.hidden = document.hidden; emit(); };
  document.addEventListener('visibilitychange', onVis);

  let io = null;
  if (typeof IntersectionObserver !== 'undefined') {
    io = new IntersectionObserver((entries) => {
      for (const entry of entries) state.onScreen = entry.isIntersecting;
      emit();
    }, { threshold: 0.01 });
    io.observe(el);
  }

  emit();

  return function detach() {
    if (mq) {
      if (mq.removeEventListener) mq.removeEventListener('change', onMq);
      else if (mq.removeListener) mq.removeListener(onMq);
    }
    document.removeEventListener('visibilitychange', onVis);
    if (io) io.disconnect();
  };
}

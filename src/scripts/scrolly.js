// scrolly.js — a small scroll-progress driver for the two warranted
// scroll-linked scenes (the flatten in section 2, the spectrum in section 5).
//
// It maps how far a tall "scene" element has scrolled through the viewport to a
// progress value 0..1. It does NOT animate on its own and adds no decoration;
// the motion is the reader's scroll. prefersReducedMotion lets each component
// skip scroll-driving entirely and fall back to an ordinary slider, so nothing
// is lost when reduced motion is requested.

function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

export function prefersReducedMotion() {
  return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}

// Drive 0..1 from a scene element taller than the viewport (with a sticky inner
// element). progress 0 when the scene top is at the viewport top, 1 when its
// bottom reaches the viewport bottom. Returns detach().
export function attachScrollScene(sceneEl, onProgress) {
  let raf = 0;
  function compute() {
    raf = 0;
    const rect = sceneEl.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const total = rect.height - vh;
    let p;
    if (total <= 0) p = rect.top <= 0 ? 1 : 0;
    else p = clamp(-rect.top / total, 0, 1);
    onProgress(p);
  }
  function onScroll() { if (!raf) raf = requestAnimationFrame(compute); }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  compute();
  return function detach() {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    if (raf) cancelAnimationFrame(raf);
  };
}

export function lerp(a, b, t) { return a + (b - a) * t; }
export function easeInOut(t) {
  t = clamp(t, 0, 1);
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

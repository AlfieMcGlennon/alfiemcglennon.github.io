// hero-lab-almanac.js — the "Almanac" hero variant. Almost no motion: it
// swaps a single <use> reference to point at the right hand-drawn condition
// glyph (see the <symbol> sprite in HeroAlmanac.astro), rotates a wind-vane
// needle to the actual wind_direction_10m, and turns on a small precipitation
// tick-mark row only when precipitation_mm > 0. The tick row is the only
// thing that loops, so it is the only thing gated by watchMotionGate.

import { watchMotionGate } from './hero-lab-motion.js';

export function initAlmanac(root) {
  const use = root.querySelector('[data-almanac-glyph-use]');
  const glyph = root.querySelector('.almanac-glyph');
  const ticks = root.querySelector('[data-precip-ticks]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let swapTimer = 0;

  watchMotionGate(root, {
    onChange(active) {
      if (ticks) ticks.classList.toggle('is-paused', !active);
    },
  });

  return {
    setData(reading) {
      if (use) {
        let key = reading.glyph;
        if (key === 'clear' || key === 'partly-cloudy') {
          key = `${key}-${reading.isDay ? 'day' : 'night'}`;
        }
        const href = `#wx-${key}`;
        const apply = () => {
          use.setAttribute('href', href);
          use.setAttribute('xlink:href', href);
        };
        if (use.getAttribute('href') !== href && glyph && !reduceMotion.matches) {
          clearTimeout(swapTimer);
          glyph.classList.add('is-swapping');
          swapTimer = setTimeout(() => {
            apply();
            glyph.classList.remove('is-swapping');
          }, 140);
        } else {
          apply();
        }
      }
      if (ticks) {
        ticks.classList.toggle('is-active', reading.precipitation > 0.05);
      }
    },
  };
}

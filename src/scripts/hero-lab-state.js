// hero-lab-state.js — single shared weather-state object for /hero-lab.
//
// All three variants subscribe() to this instead of calling getWeather()
// directly, so there is exactly one source of truth: the live Open-Meteo
// fetch sets the baseline, and the lab-only override panel (see
// hero-lab.astro) can mutate it without a page reload. Every subscriber
// (each variant's telemetry paint + canvas/glyph renderer) re-runs whenever
// the state changes, whether that change came from the network or from a
// human forcing a condition to see how a variant reacts.
//
// This module is only ever imported by hero-lab.astro and the three lab
// variant components — nothing on the live site touches it.

import { getWeather, conditionFromCode, compassFromDegrees, CONDITIONS } from './weather.js';

export const CONDITION_ORDER = [
  'clear', 'partly-cloudy', 'overcast', 'fog', 'drizzle', 'rain', 'snow', 'thunderstorm',
];

// A representative WMO code + a plausible precipitation figure for each
// condition, used when the override panel forces a condition so the
// Atmosphere rain/snow streaks and Almanac precip ticks actually have
// something to react to (the panel doesn't expose a separate precip slider).
const CODE_FOR_CONDITION = {
  clear: 0, 'partly-cloudy': 2, overcast: 3, fog: 45,
  drizzle: 53, rain: 63, snow: 73, thunderstorm: 95,
};
const PRECIP_FOR_CONDITION = {
  clear: 0, 'partly-cloudy': 0, overcast: 0, fog: 0,
  drizzle: 0.4, rain: 1.6, snow: 1.2, thunderstorm: 3.2,
};

let liveReading = null;
let currentReading = null;
let overridden = false;
const subscribers = new Set();

function notify() {
  subscribers.forEach((fn) => fn(currentReading));
}

// Subscribe to state changes. Called immediately with the current reading
// if one already exists. Returns an unsubscribe function.
export function subscribe(fn) {
  subscribers.add(fn);
  if (currentReading) fn(currentReading);
  return () => subscribers.delete(fn);
}

export function getState() {
  return currentReading;
}

export function isOverridden() {
  return overridden;
}

// Kicks off (or reuses) the shared Open-Meteo fetch and sets it as the
// baseline. Safe to call once per page; if the user has already forced an
// override by the time this resolves, the live figure is stored but not
// displayed until resetToLive().
export async function initLive() {
  const reading = { ...(await getWeather()), overridden: false };
  liveReading = reading;
  if (!overridden) {
    currentReading = reading;
    notify();
  }
  return reading;
}

export function applyOverride(patch) {
  const base = currentReading || liveReading;
  if (!base) return;
  let next = { ...base, ...patch, live: false, overridden: true };
  if (patch.condition) {
    const code = CODE_FOR_CONDITION[patch.condition];
    const condition = conditionFromCode(code);
    next = {
      ...next,
      code,
      condition,
      conditionLabel: CONDITIONS[condition].label,
      glyph: CONDITIONS[condition].glyph,
      precipitation: PRECIP_FOR_CONDITION[patch.condition],
    };
  }
  if (patch.windDir != null) {
    next.windCompass = compassFromDegrees(patch.windDir);
  }
  overridden = true;
  currentReading = next;
  notify();
}

export function cycleCondition() {
  const base = currentReading || liveReading;
  const idx = base ? CONDITION_ORDER.indexOf(base.condition) : -1;
  const next = CONDITION_ORDER[(idx + 1) % CONDITION_ORDER.length];
  applyOverride({ condition: next });
  return next;
}

export function resetToLive() {
  overridden = false;
  if (liveReading) {
    currentReading = { ...liveReading, overridden: false };
    notify();
  }
}

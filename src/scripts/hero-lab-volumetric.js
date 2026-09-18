// hero-lab-volumetric.js — the "Volumetric" hero variant: a single full-band
// WebGL quad rendering a simplified single-scatter Rayleigh + Mie sky (real
// sun/moon position from src/scripts/solar.js), two lit fbm cloud layers
// domain-scrolled by the live wind, hash-based night stars, a soft moon glow,
// and in-shader rain/snow. three.js is loaded via a dynamic import() so its
// ~150KB only lands on pages that mount this component. ALL WebGL setup
// (context creation, shader compile/link) is wrapped in try/catch — on any
// failure the canvas is removed and the caller falls back to the CSS
// gradient layer (.vol-sky in HeroVolumetric.astro); telemetry keeps working
// either way because paintTelemetry never depends on this module.
//
// Architecture mirrors hero-lab-atmosphere.js: initVolumetric(root) returns
// { setData(reading) }, driven entirely by src/scripts/hero-lab-state.js's
// subscribe() — no polling, no page reload on override changes. The render
// loop itself is gated by watchMotionGate (hero-lab-motion.js): the very
// first frame is always drawn synchronously (so reduced-motion visitors get
// exactly one static frame — sky, lit clouds, stars, no twinkle, no
// lightning), and the RAF loop only starts once motion is actually allowed.

import { watchMotionGate } from './hero-lab-motion.js';
import { CONDITION_ORDER } from './hero-lab-state.js';
import { sunPosition, moonPosition, moonIlluminatedFraction, twilightPhase } from './solar.js';
import { READING } from './weather.js';

const FRAME_MS = 1000 / 30; // ~30fps target, frame-skipped like the siblings
const DPR_CAP = 1.5;
const BUFFER_MAX_W = 1600;
const BUFFER_MAX_H = 600;
const SOLAR_RECOMPUTE_MS = 60 * 1000;

const PHASE_ID = { day: 0, golden: 1, civil: 2, nautical: 3, night: 4 };

function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

function smoothstep(e0, e1, x) {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
}

// elevation/azimuth (solar.js convention: degrees, azimuth 0=N clockwise) ->
// a unit vector in a camera-local frame where "forward" (az local = 0) is
// camAzimuthDeg in the world frame. The fragment shader builds its own view
// direction from screen UV using the exact same construction, so a plain dot
// product between the two is a correct cosine of angular separation.
function localDirFromElAz(elevationDeg, azimuthDeg, camAzimuthDeg) {
  const el = (elevationDeg * Math.PI) / 180;
  const az = ((azimuthDeg - camAzimuthDeg) * Math.PI) / 180;
  return [Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)];
}

const VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const FRAG = `
precision highp float;
varying vec2 vUv;

uniform vec3 uSunDir;
uniform vec3 uMoonDir;
uniform float uMoonIllum;
uniform float uCloudCover;
uniform vec2 uWind;
uniform float uCondition;
uniform float uPrecip;
uniform float uTime;
uniform float uPhase;
uniform float uNightBlend;
uniform float uAspect;
uniform float uLightningFlash;

float hash1(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash1(i);
  float b = hash1(i + vec2(1.0, 0.0));
  float c = hash1(i + vec2(0.0, 1.0));
  float d = hash1(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  // rotate the domain each octave — breaks the grid artifacts that make
  // plain value-noise fbm read as static instead of cloud
  mat2 rot = mat2(1.62, 1.18, -1.18, 1.62);
  for (int i = 0; i < 4; i++) {
    v += amp * noise(p);
    p = rot * p;
    amp *= 0.5;
  }
  return v;
}

// 1.0 when x is within 0.5 of c, else 0.0 — a branch-free "== c" test for
// the discrete condition-class uniform.
float isEq(float x, float c) {
  return step(c - 0.5, x) * (1.0 - step(c + 0.5, x));
}

vec3 rampHorizon(float e) {
  vec3 nightC  = vec3(0.05, 0.06, 0.09);
  vec3 mauveC  = vec3(0.36, 0.28, 0.38);
  vec3 amberC  = vec3(0.80, 0.40, 0.22);
  vec3 goldenC = vec3(0.98, 0.70, 0.40);
  vec3 dayC    = vec3(0.93, 0.86, 0.73);
  vec3 c = mix(nightC, mauveC, smoothstep(-14.0, -6.0, e));
  c = mix(c, amberC, smoothstep(-6.0, -1.0, e));
  c = mix(c, goldenC, smoothstep(-1.0, 6.0, e));
  c = mix(c, dayC, smoothstep(6.0, 18.0, e));
  return c;
}

vec3 rampZenith(float e) {
  vec3 nightC = vec3(0.035, 0.045, 0.075);
  vec3 duskC  = vec3(0.14, 0.19, 0.30);
  vec3 dayC   = vec3(0.30, 0.47, 0.70);
  vec3 c = mix(nightC, duskC, smoothstep(-14.0, -4.0, e));
  c = mix(c, dayC, smoothstep(-4.0, 16.0, e));
  return c;
}

float starField(vec2 coord, float twinkleSeed) {
  vec2 cell = floor(coord);
  vec2 f = fract(coord);
  float h = hash1(cell);
  float present = step(0.965, h);
  float d = length(f - 0.5);
  float size = 0.10 + 0.10 * hash1(cell + 5.1);
  float core = smoothstep(size, 0.0, d);
  float tw = 0.55 + 0.45 * sin(twinkleSeed * 2.6 + h * 62.0);
  return present * core * tw;
}

float rainFX(vec2 uv, float t, float density, vec2 wind) {
  vec2 p = uv * vec2(46.0, 20.0);
  p.x += p.y * wind.x * 0.9;
  p.y -= t * (7.0 + density * 11.0);
  vec2 cell = floor(p);
  vec2 f = fract(p);
  float h = hash1(cell);
  float lane = step(1.0 - density * 0.9, h);
  float streak = smoothstep(0.0, 0.10, f.x) * smoothstep(0.22, 0.10, f.x) * step(f.y, 0.55);
  return lane * streak;
}

float snowFX(vec2 uv, float t, float density, vec2 wind) {
  float total = 0.0;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    vec2 p = uv * vec2(16.0 + fi * 5.0, 16.0 + fi * 5.0);
    p.y -= t * (1.1 + fi * 0.6);
    p.x += sin(t * 0.5 + fi * 12.0 + uv.y * 5.0) * 0.7 + wind.x * t * 0.4;
    vec2 cell = floor(p);
    vec2 f = fract(p);
    float h = hash1(cell + fi * 7.0);
    float present = step(1.0 - density * 0.85, h);
    float d = length(f - 0.5);
    total += present * smoothstep(0.24, 0.0, d);
  }
  return clamp(total, 0.0, 1.0);
}

void main() {
  float elevBottom = -14.0;
  float vSpan = 68.0;
  float elevTop = elevBottom + vSpan;
  float hSpan = clamp(vSpan * uAspect, 40.0, 150.0);

  float az = (vUv.x - 0.5) * radians(hSpan);
  float elDeg = mix(elevBottom, elevTop, vUv.y);
  float el = radians(elDeg);

  vec3 viewDir = vec3(sin(az) * cos(el), sin(el), cos(az) * cos(el));

  vec3 sunDir = normalize(uSunDir);
  vec3 moonDir = normalize(uMoonDir);
  float sunElDeg = degrees(asin(clamp(sunDir.y, -1.0, 1.0)));

  float sunDot = dot(viewDir, sunDir);
  float moonDot = dot(viewDir, moonDir);

  // --- base sky: Rayleigh-ish zenith->horizon gradient, keyed continuously
  // off the real solar elevation so golden/amber/mauve emerge from the
  // ramp rather than a discrete palette lookup ---
  vec3 horizonColor = rampHorizon(sunElDeg);
  vec3 zenithColor = rampZenith(sunElDeg);
  float horizonW = 1.0 - smoothstep(-6.0, 46.0, elDeg);
  vec3 sky = mix(zenithColor, horizonColor, horizonW);

  // small named-phase accent on top of the continuous ramp (golden hour)
  float goldenAccent = isEq(uPhase, 1.0);
  sky += goldenAccent * horizonW * vec3(0.04, 0.015, -0.01);

  // Mie forward-scatter halo + a small bright disc
  float sunVisible = smoothstep(-4.0, 2.0, sunElDeg);
  float mie = pow(max(sunDot, 0.0), 9.0) * 0.14 + pow(max(sunDot, 0.0), 60.0) * 0.55;
  sky += mie * sunVisible * vec3(1.0, 0.82, 0.58);
  float sunDisc = smoothstep(0.9993, 0.9998, sunDot) * sunVisible;
  sky += sunDisc * vec3(1.4, 1.2, 0.95);

  // Stars + moon glow, composited into the sky BEHIND the cloud layer
  vec2 starCoordA = vec2(az, el) * 26.0;
  vec2 starCoordB = vec2(az, el) * 55.0 + vec2(19.0, 7.0);
  float starMask = clamp(starField(starCoordA, uTime) + starField(starCoordB, uTime * 1.3) * 0.6, 0.0, 1.0);
  starMask *= uNightBlend * smoothstep(-6.0, 6.0, elDeg);
  sky += starMask * vec3(0.96, 0.97, 1.0);

  float moonGlow = (pow(max(moonDot, 0.0), 220.0) * 1.1 + pow(max(moonDot, 0.0), 10.0) * 0.16) * uMoonIllum * uNightBlend;
  sky += moonGlow * vec3(0.86, 0.89, 0.97);

  // --- clouds: two fbm layers, domain-scrolled by wind ---
  float isStorm = isEq(uCondition, 7.0);
  float coverEff = mix(clamp(uCloudCover, 0.0, 1.0), 1.0, isStorm);

  vec2 cloudUV1 = vec2(az * 2.1, el * 2.6) + uWind * uTime * 0.05;
  vec2 cloudUV2 = vec2(az * 4.6, el * 5.4) + uWind * uTime * 0.11 + vec2(31.0, 11.0);
  float n1 = fbm(cloudUV1);
  float n2 = fbm(cloudUV2);
  float density = n1 * 0.62 + n2 * 0.38;

  float cloudBand = smoothstep(-8.0, 3.0, elDeg) * (1.0 - smoothstep(40.0, 62.0, elDeg));
  density *= cloudBand;

  float covThresh = mix(0.80, 0.10, coverEff);
  float edge = 0.11;
  float cloudMask = smoothstep(covThresh - edge, covThresh + edge, density);
  cloudMask *= cloudMask * (3.0 - 2.0 * cloudMask); // steepen mids: forms, not fog
  float overcastAmt = smoothstep(0.85, 1.0, coverEff);
  cloudMask = mix(cloudMask, max(cloudMask, 0.94) * cloudBand, overcastAmt);

  // finite-difference gradient of the density field, dotted with the sun
  // direction's horizontal/vertical components, to brighten sun-facing edges
  float e2 = 0.02;
  float dnx = fbm(cloudUV1 + vec2(e2, 0.0)) - fbm(cloudUV1 - vec2(e2, 0.0));
  float dny = fbm(cloudUV1 + vec2(0.0, e2)) - fbm(cloudUV1 - vec2(0.0, e2));
  vec2 grad = vec2(dnx, dny);
  vec2 lightDir2D = normalize(vec2(sunDir.x, sunDir.y) + 1e-4);
  // un-normalized: flat regions stay neutral instead of amplifying noise
  float litAmt = clamp(dot(grad * 14.0, lightDir2D) * 0.5 + 0.55, 0.0, 1.0);

  vec3 cloudShadow = mix(vec3(0.40, 0.42, 0.47), vec3(0.10, 0.11, 0.15), uNightBlend);
  vec3 cloudLit = mix(vec3(0.99, 0.95, 0.88), vec3(0.45, 0.46, 0.52), uNightBlend);
  float warmEdge = sunVisible * (1.0 - smoothstep(6.0, 20.0, sunElDeg));
  cloudLit = mix(cloudLit, cloudLit * vec3(1.18, 0.85, 0.60), warmEdge * 0.85);
  vec3 cloudColor = mix(cloudShadow, cloudLit, litAmt);
  cloudColor = mix(cloudColor, mix(cloudShadow, cloudLit, 0.55), overcastAmt * 0.75);
  cloudColor *= mix(1.0, 0.55, uNightBlend * 0.6);

  vec3 color = mix(sky, cloudColor, cloudMask);

  // --- fog: a ground-haze band that washes contrast near the horizon ---
  float isFog = isEq(uCondition, 3.0);
  float haze = isFog * (1.0 - smoothstep(-8.0, 12.0, elDeg));
  color = mix(color, vec3(0.80, 0.79, 0.75), haze * 0.7);

  // --- thunderstorm: strong darkening + soft sheet lightning in the clouds ---
  color *= mix(1.0, 0.40, isStorm);
  color += uLightningFlash * cloudMask * vec3(0.55, 0.56, 0.60) * isStorm;

  // --- precipitation: screen-space streaks, slanted by wind ---
  float precipNorm = clamp(uPrecip / 6.0, 0.0, 1.0);
  float isSnowCond = isEq(uCondition, 6.0);
  float rainAmt = rainFX(vUv, uTime, precipNorm, uWind) * (1.0 - isSnowCond);
  float snowAmt = snowFX(vUv, uTime, precipNorm, uWind) * isSnowCond;
  color = mix(color, color * 0.65 + vec3(0.72, 0.78, 0.84) * 0.55, rainAmt);
  color = mix(color, vec3(0.97, 0.98, 1.0), snowAmt * 0.85);

  // --- tone-map / soft clip so the day sky stays parchment-soft, never a
  // saturated cyan or a blown-out white ---
  vec3 mapped = color / (1.0 + color);
  mapped = pow(clamp(mapped, 0.0, 1.0), vec3(0.92));

  // dither: breaks the 8-bit banding that smooth sky ramps otherwise show
  mapped += (hash1(gl_FragCoord.xy) - 0.5) * (1.5 / 255.0);

  gl_FragColor = vec4(mapped, 1.0);
}
`;

// --- CSS fallback palette (used whenever WebGL is unavailable or fails) ---

const FALLBACK_PALETTE = {
  clear: { top: '#6f93b8', mid: '#f0d4a0', bot: '#f3b270' },
  'partly-cloudy': { top: '#7a9bb8', mid: '#e8d4a8', bot: '#ecb37a' },
  overcast: { top: '#8b96a0', mid: '#b3bbbf', bot: '#d4c8b4' },
  fog: { top: '#9aa39e', mid: '#c1c2b8', bot: '#d8d2c2' },
  drizzle: { top: '#6d7a86', mid: '#98a0a4', bot: '#b4b0a2' },
  rain: { top: '#5e6b78', mid: '#8c95a0', bot: '#aba99e' },
  snow: { top: '#b7c6d4', mid: '#dde2e6', bot: '#e7e4d8' },
  thunderstorm: { top: '#2c3340', mid: '#5a5e68', bot: '#736c62' },
};
const FALLBACK_NIGHT = { top: '#0b131c', mid: '#16293a', bot: '#22303c' };

function applyFallbackPalette(root, reading) {
  if (!reading) return;
  const pal = reading.isDay
    ? FALLBACK_PALETTE[reading.condition] || FALLBACK_PALETTE['partly-cloudy']
    : FALLBACK_NIGHT;
  root.style.setProperty('--vol-top', pal.top);
  root.style.setProperty('--vol-mid', pal.mid);
  root.style.setProperty('--vol-bot', pal.bot);
}

// Loads three.js dynamically (so its cost only lands on pages mounting this
// component), then attempts full WebGL setup. Any failure at any stage —
// module load, context creation, shader compile/link — removes the canvas
// and hands back a lightweight object that only drives the CSS fallback,
// so the caller (HeroVolumetric.astro) never has to know which path it's on.
export async function initVolumetric(root) {
  const canvas = root.querySelector('[data-volumetric-canvas]');
  const fallback = {
    setData(reading) { applyFallbackPalette(root, reading); },
  };
  if (!canvas) return fallback;

  let THREE;
  try {
    THREE = await import('three');
  } catch (e) {
    console.warn('[hero-volumetric] three.js failed to load; using CSS fallback.', e);
    canvas.remove();
    root.dataset.webgl = 'fallback';
    return fallback;
  }

  try {
    return createRenderer(THREE, root, canvas);
  } catch (e) {
    console.warn('[hero-volumetric] WebGL setup failed; using CSS fallback.', e);
    canvas.remove();
    root.dataset.webgl = 'fallback';
    return fallback;
  }
}

function createRenderer(THREE, root, canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: false,
    powerPreference: 'low-power',
    preserveDrawingBuffer: false,
  });

  // Force any shader compile/link problem to surface as a thrown error
  // (caught by the try/catch in initVolumetric) instead of three.js's
  // default behaviour of just console-logging and rendering nothing useful.
  renderer.debug.onShaderError = () => {
    throw new Error('hero-volumetric: shader compile/link failure');
  };
  renderer.setPixelRatio(1); // buffer size is computed by hand in resize()
  renderer.setClearColor(0x000000, 1);

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const scene = new THREE.Scene();
  const geometry = new THREE.PlaneGeometry(2, 2);
  const material = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uSunDir: { value: new THREE.Vector3(0, 1, 0) },
      uMoonDir: { value: new THREE.Vector3(0, -1, 0) },
      uMoonIllum: { value: 0 },
      uCloudCover: { value: 0.45 },
      uWind: { value: new THREE.Vector2(0, 0) },
      uCondition: { value: 1 },
      uPrecip: { value: 0 },
      uTime: { value: 0 },
      uPhase: { value: 0 },
      uNightBlend: { value: 0 },
      uAspect: { value: 1 },
      uLightningFlash: { value: 0 },
    },
  });
  const quad = new THREE.Mesh(geometry, material);
  scene.add(quad);

  let running = false;
  let raf = 0;
  let lastFrame = 0;
  let tAccum = 0;
  let data = null;
  let nextFlashAt = 6 + Math.random() * 8;
  let flashUntil = -1;

  function renderOnce() {
    material.uniforms.uTime.value = tAccum;
    renderer.render(scene, camera);
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);
    const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    const bw = Math.min(Math.round(w * dpr), BUFFER_MAX_W);
    const bh = Math.min(Math.round(h * dpr), BUFFER_MAX_H);
    renderer.setSize(bw, bh, false);
    material.uniforms.uAspect.value = bw / bh;
    renderOnce();
  }

  function pickCameraAzimuth(sunElevation, sunAzimuth, moon) {
    if (sunElevation > -8) return sunAzimuth;
    if (moon.elevation > -5) return moon.azimuth;
    return 180; // fixed fallback facing: south over Reading
  }

  // Recomputed each minute + on every data update (live fetch or lab
  // override) per spec. Forced isDay overrides bend the EFFECTIVE elevation
  // used everywhere downstream (uSunDir, uNightBlend, uPhase) without
  // touching the real astronomical azimuth: forced night -> -15 deg,
  // forced day -> max(real, 30 deg).
  function recomputeSolar() {
    const now = new Date();
    const sun = sunPosition(now, READING.latitude, READING.longitude);
    const moon = moonPosition(now, READING.latitude, READING.longitude);
    const illum = moonIlluminatedFraction(now);

    let sunElevation = sun.elevation;
    if (data && data.overridden) {
      sunElevation = data.isDay ? Math.max(sun.elevation, 30) : -15;
    }

    const camAz = pickCameraAzimuth(sunElevation, sun.azimuth, moon);
    const sunVec = localDirFromElAz(sunElevation, sun.azimuth, camAz);
    const moonVec = localDirFromElAz(moon.elevation, moon.azimuth, camAz);

    material.uniforms.uSunDir.value.set(sunVec[0], sunVec[1], sunVec[2]);
    material.uniforms.uMoonDir.value.set(moonVec[0], moonVec[1], moonVec[2]);
    material.uniforms.uMoonIllum.value = clamp(illum, 0, 1);
    material.uniforms.uNightBlend.value = 1 - smoothstep(-6, 6, sunElevation);
    material.uniforms.uPhase.value = PHASE_ID[twilightPhase(sunElevation)] ?? 0;

    renderOnce();
  }

  function applyData(reading) {
    data = reading;

    const cloudCover = clamp((reading.cloudCover ?? 45) / 100, 0, 1);
    material.uniforms.uCloudCover.value = cloudCover;

    const idx = CONDITION_ORDER.indexOf(reading.condition);
    material.uniforms.uCondition.value = idx >= 0 ? idx : 1;
    // hero-lab-state.js's applyOverride() already fills in a plausible
    // precipitation figure whenever a precip condition is force-selected
    // (see PRECIP_FOR_CONDITION there), so this needs no special-casing —
    // it mirrors exactly what the Atmosphere variant reads.
    material.uniforms.uPrecip.value = clamp(reading.precipitation ?? 0, 0, 8);

    const dirRad = ((reading.windDir ?? 235) * Math.PI) / 180;
    const travelAz = dirRad + Math.PI; // "from" direction -> travel-toward
    const speedNorm = clamp((reading.windSpeed ?? 14) / 70, 0, 1);
    material.uniforms.uWind.value.set(
      Math.sin(travelAz) * speedNorm,
      Math.cos(travelAz) * speedNorm * 0.15
    );

    recomputeSolar();
  }

  function updateLightning() {
    material.uniforms.uLightningFlash.value = 0;
    const isStorm = !!(data && data.condition === 'thunderstorm');
    if (!isStorm) return;
    if (tAccum >= nextFlashAt) {
      flashUntil = tAccum + (0.06 + Math.random() * 0.06); // ~2-3 frames @ 30fps
      nextFlashAt = tAccum + 6 + Math.random() * 8; // next flash in 6-14s
    }
    if (tAccum < flashUntil) material.uniforms.uLightningFlash.value = 1;
  }

  function frame(now) {
    raf = 0;
    if (!running) return;
    if (now - lastFrame < FRAME_MS) {
      raf = requestAnimationFrame(frame);
      return;
    }
    const dt = lastFrame ? (now - lastFrame) / 1000 : 0;
    lastFrame = now;
    tAccum += dt;
    updateLightning();
    renderOnce();
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    lastFrame = 0;
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  // First frame is always drawn synchronously and unconditionally — this is
  // what gives prefers-reduced-motion visitors exactly one static frame:
  // if watchMotionGate never activates the loop (reduced motion from the
  // very start), tAccum stays at 0 forever and nothing beyond this call
  // ever runs.
  recomputeSolar();
  resize();

  window.addEventListener('resize', resize);
  const solarTimer = setInterval(recomputeSolar, SOLAR_RECOMPUTE_MS);
  const detachGate = watchMotionGate(root, {
    onChange(active) {
      if (active) start();
      else stop();
    },
  });

  root.dataset.webgl = 'active';

  function dispose() {
    stop();
    clearInterval(solarTimer);
    window.removeEventListener('resize', resize);
    if (detachGate) detachGate();
    geometry.dispose();
    material.dispose();
    renderer.dispose();
    if (renderer.forceContextLoss) renderer.forceContextLoss();
  }
  window.addEventListener('pagehide', dispose, { once: true });

  return {
    setData(reading) {
      applyFallbackPalette(root, reading); // kept in sync in case WebGL dies later
      applyData(reading);
    },
  };
}

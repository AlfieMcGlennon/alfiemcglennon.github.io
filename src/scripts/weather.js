// weather.js — shared live-weather module for the Hero Lab variants
// (src/pages/hero-lab.astro). Extends the pattern already used by the live
// homepage hero (src/pages/index.astro): same Reading coordinates, same
// short-timeout fetch, same sessionStorage cache, same silent graceful
// fallback on failure. The only difference is the field set: this pulls the
// fuller Open-Meteo `current` block (feels-like, dew point, pressure, wind
// direction, precipitation) so the three variants have real instrument data
// to render, including dew point — the variable Alfie's compound heat-stress
// dissertation actually turns on.
//
// Every consumer gets a fully-populated reading even when the network call
// fails: normalize() falls back to a plausible static Reading reading so the
// instrument panels never render blank or half-built. `live: false` on the
// returned object is the only sign anything went wrong, and nothing throws.

export const READING = { latitude: 51.4543, longitude: -0.9781, timezone: 'Europe/London' };

const FIELDS = [
  'temperature_2m',
  'apparent_temperature',
  'relative_humidity_2m',
  'dew_point_2m',
  'weather_code',
  'cloud_cover',
  'wind_speed_10m',
  'wind_direction_10m',
  'precipitation',
  'pressure_msl',
  'is_day',
].join(',');

const ENDPOINT =
  `https://api.open-meteo.com/v1/forecast?latitude=${READING.latitude}&longitude=${READING.longitude}` +
  `&current=${FIELDS}&timezone=${encodeURIComponent(READING.timezone)}`;

const CACHE_KEY = 'weather-reading-lab-v1';
const TTL_MS = 30 * 60 * 1000;
const TIMEOUT_MS = 2000;

// WMO weather_code -> named condition bucket. Collapses the ~28 WMO codes
// Open-Meteo can return into the 8 buckets the brief asks for; each bucket
// carries the label used by the mono readouts and the glyph key Almanac's
// SVG sprite is keyed on.
export const CONDITIONS = {
  clear: { label: 'CLEAR', glyph: 'clear' },
  'partly-cloudy': { label: 'PARTLY CLOUDY', glyph: 'partly-cloudy' },
  overcast: { label: 'OVERCAST', glyph: 'overcast' },
  fog: { label: 'FOG', glyph: 'fog' },
  drizzle: { label: 'DRIZZLE', glyph: 'drizzle' },
  rain: { label: 'RAIN', glyph: 'rain' },
  snow: { label: 'SNOW', glyph: 'snow' },
  thunderstorm: { label: 'THUNDERSTORM', glyph: 'thunderstorm' },
};

export function conditionFromCode(code) {
  if (code === 0 || code === 1) return 'clear';
  if (code === 2) return 'partly-cloudy';
  if (code === 3) return 'overcast';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if (code >= 95 && code <= 99) return 'thunderstorm';
  return 'partly-cloudy';
}

const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

export function compassFromDegrees(deg) {
  if (deg == null || Number.isNaN(deg)) return '--';
  return COMPASS[Math.round(deg / 22.5) % 16];
}

// A plausible, static overcast Reading reading — used whenever the network
// is unreachable, slow, or the response is malformed. Chosen so every
// variant's instrument cluster reads as a real (if slightly stale) forecast
// rather than an obviously-fake placeholder.
const STATIC_FALLBACK = {
  temperature_2m: 14.5,
  apparent_temperature: 13.6,
  relative_humidity_2m: 78,
  dew_point_2m: 10.6,
  weather_code: 2,
  cloud_cover: 45,
  wind_speed_10m: 14,
  wind_direction_10m: 235,
  precipitation: 0,
  pressure_msl: 1016,
  is_day: 1,
};

function normalize(current, fetchedAt) {
  const c = current || {};
  const code = c.weather_code ?? STATIC_FALLBACK.weather_code;
  const condition = conditionFromCode(code);
  const windDir = c.wind_direction_10m ?? STATIC_FALLBACK.wind_direction_10m;
  return {
    temp: c.temperature_2m ?? STATIC_FALLBACK.temperature_2m,
    feelsLike: c.apparent_temperature ?? STATIC_FALLBACK.apparent_temperature,
    humidity: c.relative_humidity_2m ?? STATIC_FALLBACK.relative_humidity_2m,
    dewPoint: c.dew_point_2m ?? STATIC_FALLBACK.dew_point_2m,
    code,
    condition,
    conditionLabel: CONDITIONS[condition].label,
    glyph: CONDITIONS[condition].glyph,
    cloudCover: c.cloud_cover ?? STATIC_FALLBACK.cloud_cover,
    windSpeed: c.wind_speed_10m ?? STATIC_FALLBACK.wind_speed_10m,
    windDir,
    windCompass: compassFromDegrees(windDir),
    precipitation: c.precipitation ?? STATIC_FALLBACK.precipitation,
    pressure: c.pressure_msl ?? STATIC_FALLBACK.pressure_msl,
    isDay: (c.is_day ?? STATIC_FALLBACK.is_day) === 1,
    fetchedAt,
    live: !!current,
  };
}

let _pending = null;

// Fetches once per page load (subsequent calls from other variants share the
// same in-flight/resolved promise), resolving with a normalized reading that
// is ALWAYS complete — callers never need a separate error path.
export function getWeather() {
  if (_pending) return _pending;

  _pending = (async () => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < TTL_MS) {
          return normalize(parsed.data, parsed.timestamp);
        }
      }
    } catch (e) { /* private mode / quota — ignore, fall through to fetch */ }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const res = await fetch(ENDPOINT, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error('bad response');
      const json = await res.json();
      const data = json.current;
      const fetchedAt = Date.now();
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: fetchedAt }));
      } catch (e) { /* ignore quota */ }
      return normalize(data, fetchedAt);
    } catch (e) {
      // Silent static fallback: every variant still gets a complete reading.
      return normalize(null, Date.now());
    }
  })();

  return _pending;
}

export function fmtClock(d) {
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: READING.timezone });
}

export function localHour(d) {
  const s = d.toLocaleTimeString('en-GB', { hour: '2-digit', hour12: false, timeZone: READING.timezone });
  return parseInt(s, 10);
}

// Shared instrument-cluster painter used by all three Hero Lab variants.
// Looks for the same set of [data-wx-*] hooks in whichever markup asks for
// them, so each variant only needs to include the readouts it wants and this
// stays a single source of truth for formatting.
export function paintTelemetry(root, reading) {
  const set = (sel, text) => {
    const el = root.querySelector(sel);
    if (el) el.textContent = text;
  };

  set('[data-wx-temp]', `${reading.temp.toFixed(1)}°C`);
  set('[data-wx-feels]', `${reading.feelsLike.toFixed(1)}°C`);
  set('[data-wx-dew]', `${reading.dewPoint.toFixed(1)}°C`);
  set('[data-wx-rh]', `${Math.round(reading.humidity)}%`);
  set('[data-wx-wind]', `${Math.round(reading.windSpeed)} KM/H ${reading.windCompass}`);
  set('[data-wx-wind-deg]', `${Math.round(reading.windDir)}°`);
  set('[data-wx-pressure]', `${Math.round(reading.pressure)} HPA`);
  set('[data-wx-cond]', reading.conditionLabel);
  set('[data-wx-cloud]', `${Math.round(reading.cloudCover)}%`);
  set('[data-wx-precip]', `${reading.precipitation.toFixed(1)} MM`);
  set('[data-wx-time]', `UPDATED ${fmtClock(new Date(reading.fetchedAt))}`);
  set('[data-wx-status]', reading.overridden ? 'OVERRIDE' : reading.live ? 'LIVE' : 'STATIC');

  root.querySelectorAll('[data-wx-vane]').forEach((el) => {
    el.style.transform = `rotate(${reading.windDir}deg)`;
  });

  root.classList.toggle('wx-live', !!reading.live);
  root.classList.toggle('wx-override', !!reading.overridden);
  root.classList.add('wx-ready');
  root.dataset.condition = reading.condition;
  root.dataset.dayNight = reading.isDay ? 'day' : 'night';
}

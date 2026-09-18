// solar.js — closed-form sun and low-precision moon positions, no
// dependencies. Shared by the "physical" and "volumetric" hero variants so
// the sky can place the sun/moon where they actually are over Reading.
//
// Conventions (both bodies):
//   elevation — degrees above the horizon (negative = below)
//   azimuth   — degrees from true NORTH, clockwise (90 = E, 180 = S, 270 = W)
//
// Accuracy: sun ~0.1°, moon ~1–2° (truncated Meeus terms) — plenty for
// placing a glow in a hero band. Formulae follow the standard astronomical
// almanac short series (same family as the suncalc library).

const RAD = Math.PI / 180;
const E = RAD * 23.4397; // obliquity of the ecliptic

// Days since J2000.0 (2000-01-01 12:00 UTC).
function toDays(date) {
  return date.valueOf() / 86400000 - 0.5 + 2440588 - 2451545;
}

function siderealTime(d, lw) {
  return RAD * (280.16 + 360.9856235 * d) - lw;
}

function declination(l, b) {
  return Math.asin(Math.sin(b) * Math.cos(E) + Math.cos(b) * Math.sin(E) * Math.sin(l));
}

function rightAscension(l, b) {
  return Math.atan2(Math.sin(l) * Math.cos(E) - Math.tan(b) * Math.sin(E), Math.cos(l));
}

// Ecliptic longitude of the sun.
function solarEclipticLongitude(d) {
  const m = RAD * (357.5291 + 0.98560028 * d); // mean anomaly
  const c = RAD * (1.9148 * Math.sin(m) + 0.02 * Math.sin(2 * m) + 0.0003 * Math.sin(3 * m));
  const p = RAD * 102.9372; // perihelion
  return m + c + p + Math.PI;
}

function altAz(ra, dec, d, latDeg, lonDeg) {
  const lw = RAD * -lonDeg;
  const phi = RAD * latDeg;
  const h = siderealTime(d, lw) - ra; // hour angle
  const elevation = Math.asin(
    Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(h)
  );
  // atan2 form measures from SOUTH, positive westward; +180 converts to
  // the 0-=-north clockwise convention promised above.
  const az = Math.atan2(
    Math.sin(h),
    Math.cos(h) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi)
  );
  return {
    elevation: elevation / RAD,
    azimuth: ((az / RAD + 180) % 360 + 360) % 360,
  };
}

export function sunPosition(date, latDeg, lonDeg) {
  const d = toDays(date);
  const l = solarEclipticLongitude(d);
  return altAz(rightAscension(l, 0), declination(l, 0), d, latDeg, lonDeg);
}

export function moonPosition(date, latDeg, lonDeg) {
  const d = toDays(date);
  const l = RAD * (218.316 + 13.176396 * d); // mean longitude
  const m = RAD * (134.963 + 13.064993 * d); // mean anomaly
  const f = RAD * (93.272 + 13.22935 * d); // mean distance argument
  const lng = l + RAD * 6.289 * Math.sin(m); // ecliptic longitude
  const lat = RAD * 5.128 * Math.sin(f); // ecliptic latitude
  return altAz(rightAscension(lng, lat), declination(lng, lat), d, latDeg, lonDeg);
}

// Rough illuminated fraction 0..1 (0 = new, 1 = full) from sun–moon
// elongation. Good enough to pick a crescent vs gibbous glyph; not for
// almanac use.
export function moonIlluminatedFraction(date) {
  const d = toDays(date);
  const ls = solarEclipticLongitude(d);
  const lm =
    RAD * (218.316 + 13.176396 * d) +
    RAD * 6.289 * Math.sin(RAD * (134.963 + 13.064993 * d));
  return (1 - Math.cos(lm - ls)) / 2;
}

// Buckets solar elevation into the phases the sky palettes key off.
export function twilightPhase(elevationDeg) {
  if (elevationDeg >= 12) return 'day';
  if (elevationDeg >= 3) return 'golden';
  if (elevationDeg >= -6) return 'civil'; // civil twilight
  if (elevationDeg >= -12) return 'nautical';
  return 'night';
}

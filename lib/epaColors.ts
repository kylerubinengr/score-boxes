/**
 * RBSDM-style color utilities for EPA and success rate metrics.
 * Purple (#d6b4fc) → White (#ffffff) → Green (#b4fcb4) for EPA values.
 * White → Green for success rate / first down percentage.
 */

function parseHex(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function interpolateHex(color1: string, color2: string, t: number): string {
  const [r1, g1, b1] = parseHex(color1);
  const [r2, g2, b2] = parseHex(color2);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Returns a background color for an EPA value using the RBSDM colormap.
 * Purple (negative) → White (zero) → Green (positive).
 * Values are clamped to [-range, range].
 */
export function getEpaColor(value: number | null, range: number = 0.6): string {
  if (value === null || isNaN(value)) return 'transparent';

  const clamped = Math.max(-range, Math.min(range, value));
  const t = (clamped + range) / (2 * range); // 0 = most negative, 0.5 = zero, 1 = most positive

  if (t <= 0.5) {
    return interpolateHex('#d6b4fc', '#ffffff', t / 0.5);
  } else {
    return interpolateHex('#ffffff', '#b4fcb4', (t - 0.5) / 0.5);
  }
}

/**
 * Returns a background color for success rate / first down percentage.
 * White → Green gradient, clamped to [0.3, 0.6] range.
 */
export function getSuccessRateColor(value: number | null): string {
  if (value === null || isNaN(value)) return 'transparent';
  const clamped = Math.max(0.3, Math.min(0.6, value));
  const t = (clamped - 0.3) / 0.3;
  return interpolateHex('#ffffff', '#b4fcb4', t);
}

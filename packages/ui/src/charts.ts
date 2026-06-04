/**
 * Tiny SVG geometry helper shared by web (<svg>) and mobile (react-native-svg) — the `d`
 * path syntax is identical on both. Keeps chart maths in one place (a cross-platform primitive).
 */

export interface DonutOptions {
  cx: number;
  cy: number;
  rOuter: number;
  rInner: number;
}

/** One SVG `d` string per value (same order), forming a donut chart. */
export function donutSlices(values: readonly number[], opts: DonutOptions): string[] {
  const total = values.reduce((sum, v) => sum + Math.max(0, v), 0);
  if (total <= 0) return values.map(() => "");

  const { cx, cy, rOuter, rInner } = opts;
  const point = (r: number, a: number) => `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;

  let angle = -Math.PI / 2; // start at 12 o'clock
  return values.map((v) => {
    const frac = Math.max(0, v) / total;
    if (frac <= 0) return "";
    const start = angle;
    // A single 100% slice is a degenerate full-circle arc — nudge the sweep just under 360°.
    const end = start + frac * Math.PI * 2 * (frac >= 1 ? 0.99999 : 1);
    angle += frac * Math.PI * 2;
    const large = end - start > Math.PI ? 1 : 0;
    return (
      `M${point(rOuter, start)} A${rOuter},${rOuter} 0 ${large} 1 ${point(rOuter, end)} ` +
      `L${point(rInner, end)} A${rInner},${rInner} 0 ${large} 0 ${point(rInner, start)} Z`
    );
  });
}

export interface LineOptions {
  width: number;
  height: number;
  /** The value mapped to the top of the chart (usually the max across all series). */
  max: number;
  /** Inset from the edges, in the same units as width/height. */
  pad?: number;
}

/** Evenly-spaced (x, y) points for a series of values. */
export function linePoints(
  values: readonly number[],
  opts: LineOptions,
): { x: number; y: number }[] {
  const pad = opts.pad ?? 0;
  const n = values.length;
  if (n === 0 || opts.max <= 0) return [];

  const innerW = opts.width - pad * 2;
  const innerH = opts.height - pad * 2;
  return values.map((v, i) => ({
    x: pad + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW),
    y: pad + innerH - (Math.max(0, v) / opts.max) * innerH,
  }));
}

/** SVG `d` for a polyline of evenly-spaced values (one point per value). */
export function linePath(values: readonly number[], opts: LineOptions): string {
  return linePoints(values, opts)
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
    .join(" ");
}

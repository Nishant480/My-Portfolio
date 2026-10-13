// Shared, render-free state for the scroll journey. Three.js scenes and the DOM
// overlays read from this object every frame instead of going through React.
export const journey = {
  /** Scroll progress through the journey, 0 = Earth, 1 = laptop screen filled. */
  p: 0,
  /** Laptop screen rectangle in CSS pixels, projected from the 3D scene. */
  screen: { x: 0, y: 0, w: 0, h: 0, ok: false },
  /** Camera height above ground in metres, for the HUD readout. */
  altitude: 20000000,
};

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const range = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
export const smooth = (t: number) => t * t * (3 - 2 * t);
export const ease = (p: number, a: number, b: number) => smooth(range(p, a, b));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** 0 → 1 → 0 bump across [a, b] peaking at the midpoint. */
export const bump = (p: number, a: number, b: number) => {
  const t = range(p, a, b);
  return Math.sin(Math.PI * t);
};

// Scroll positions where each scene takes over (also used for the HUD).
export const STAGES = {
  india: [0.04, 0.22],
  bengal: [0.24, 0.35],
  kgp: [0.36, 0.46],
  toCampus: 0.49, // white cloud veil peaks here, globe swaps for campus
  toRoom: 0.675, // dark veil peaks here, campus swaps for room
  screen: [0.86, 0.995],
} as const;

export const KGP = { lat: 22.3149, lon: 87.3105 };

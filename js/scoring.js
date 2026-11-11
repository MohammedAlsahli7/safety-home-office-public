/* Pure scoring: one player's answers → personal report. No DOM, safe for Node tests.
   answers = { light: 0..100, posture: 0..1, laptop: "desk", ..., fuel: {coffee, water}, stare: seconds, verdict: 0..10 } */
import { AREAS, CARDS, FINDINGS, ALL_CLEAR, PRESCRIPTIONS, poseIndex, lightBucket } from "./content.js";

const POSE_POINTS = [0, 1, 3, 3];

export function rawPoints(a) {
  const pts = Object.fromEntries(AREAS.map(k => [k, 0]));
  const add = (obj = {}) => Object.entries(obj).forEach(([k, v]) => { pts[k] += v; });

  if (typeof a.light === "number") pts.eyes += a.light < 34 ? 2 : a.light < 67 ? 1 : 0;
  if (typeof a.posture === "number") pts.posture += POSE_POINTS[poseIndex(a.posture)];
  if (a.fuel) pts.energy += Math.max(0, Math.min(3, (a.fuel.coffee || 0) - (a.fuel.water || 0)));
  if (typeof a.stare === "number") pts.eyes += a.stare < 8 ? 0 : a.stare < 15 ? 1 : a.stare < 25 ? 2 : 3;

  CARDS.filter(c => c.kind === "options").forEach(c => {
    const opt = c.options.find(o => o.v === a[c.key]);
    if (opt) add(opt.pts);
  });

  AREAS.forEach(k => { pts[k] = Math.max(0, pts[k]); });
  return pts;
}

/* Highest possible points per area, derived from the table so they never drift apart. */
export const MAX_POINTS = (() => {
  const max = { posture: POSE_POINTS[3], energy: 3, eyes: 2 + 3, balance: 0, mind: 0 };
  CARDS.filter(c => c.kind === "options").forEach(c => {
    AREAS.forEach(k => { max[k] += Math.max(0, ...c.options.map(o => o.pts[k] || 0)); });
  });
  return max;
})();

/* Strain from 1 (low) to 5 (high), one decimal */
export function strain(a) {
  const pts = rawPoints(a);
  return Object.fromEntries(AREAS.map(k => [k, Math.round((1 + 4 * pts[k] / MAX_POINTS[k]) * 10) / 10]));
}

export function report(a) {
  const s = strain(a);
  const top = AREAS.reduce((best, k) => (s[k] > s[best] ? k : best), AREAS[0]);
  const clear = s[top] < 2;
  const dark = typeof a.light === "number" && lightBucket(a.light) === "night";
  const prescription = top === "eyes" ? (dark ? PRESCRIPTIONS.eyesDark : PRESCRIPTIONS.eyes) : PRESCRIPTIONS[top];
  return {
    strain: s,
    top,
    finding: clear ? ALL_CLEAR : FINDINGS[top],
    prescription: clear ? "Keep doing what you’re doing. Stand up when a call ends." : prescription,
    eyesNote: dark ? "Dark room, bright screen" : "Overfocused"
  };
}

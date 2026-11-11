/* The posture skeleton: four keyframe poses morphed along t (0 Upright, 1/3 Leaning in,
   2/3 The Shrimp, 1 Sofa Sink). Returns an SVG string; colours come from the caller. */
const KEYS = [
  { H: [52, 35], S3: [51, 48], C2: [52, 64], C1: [49, 88], P: [50, 103], K: [74, 106], A: [75, 138], T: [85, 139], Sh: [52, 57], E: [57, 80], W: [80, 89], L0: [86, 75], L1: [104, 75], L2: [108, 50] },
  { H: [61, 40], S3: [56, 51], C2: [54, 66], C1: [47, 88], P: [49, 104], K: [73, 106], A: [74, 138], T: [84, 139], Sh: [55, 60], E: [60, 81], W: [83, 89], L0: [84, 84], L1: [103, 84], L2: [106, 61] },
  { H: [76, 56], S3: [60, 58], C2: [44, 68], C1: [41, 86], P: [46, 103], K: [72, 106], A: [73, 138], T: [83, 139], Sh: [58, 62], E: [63, 82], W: [86, 89], L0: [82, 91], L1: [102, 91], L2: [104, 70] },
  { H: [44, 62], S3: [30, 78], C2: [34, 88], C1: [42, 98], P: [50, 108], K: [77, 98], A: [83, 132], T: [93, 133], Sh: [34, 82], E: [42, 99], W: [63, 96], L0: [56, 97], L1: [77, 89], L2: [72, 69] }
];

const f1 = n => n.toFixed(1);
const pt = p => `${f1(p[0])} ${f1(p[1])}`;
const lerp = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
const norm = v => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };

export function skeletonSVG(t, { w = 120, h = 150, ink = "currentColor", sub = "currentColor" } = {}) {
  t = Math.max(0, Math.min(1, t));
  const seg = Math.min(KEYS.length - 2, Math.floor(t * (KEYS.length - 1)));
  const u = t * (KEYS.length - 1) - seg;
  const p = {};
  Object.keys(KEYS[seg]).forEach(k => { p[k] = lerp(KEYS[seg][k], KEYS[seg + 1][k], u); });
  const bez = s => { const m = 1 - s; return [0, 1].map(i => m * m * m * p.P[i] + 3 * m * m * s * p.C1[i] + 3 * m * s * s * p.C2[i] + s * s * s * p.S3[i]); };
  const bezD = s => { const m = 1 - s; return [0, 1].map(i => 3 * m * m * (p.C1[i] - p.P[i]) + 6 * m * s * (p.C2[i] - p.C1[i]) + 3 * s * s * (p.S3[i] - p.C2[i])); };
  const toS = norm([p.S3[0] - p.H[0], p.S3[1] - p.H[1]]);
  const neck = [p.H[0] + 9 * toS[0], p.H[1] + 9 * toS[1]];
  let ribs = "";
  [0.42, 0.56, 0.7].forEach(s => {
    const c = bez(s), tn = norm(bezD(s)), pp = [-tn[1], tn[0]];
    ribs += `M${pt([c[0] + 6.5 * pp[0] - 1.5 * tn[0], c[1] + 6.5 * pp[1] - 1.5 * tn[1]])} Q${pt([c[0] + 4.5 * tn[0], c[1] + 4.5 * tn[1]])} ${pt([c[0] - 6.5 * pp[0] - 1.5 * tn[0], c[1] - 6.5 * pp[1] - 1.5 * tn[1]])} `;
  });
  const t0 = norm(bezD(0)), pp0 = [-t0[1], t0[0]];
  const up = norm([p.H[0] - p.S3[0], p.H[1] - p.S3[1]]);
  const phi = Math.atan2(up[0], -up[1]);
  const rot = (dx, dy) => [p.H[0] + dx * Math.cos(phi) - dy * Math.sin(phi), p.H[1] + dx * Math.sin(phi) + dy * Math.cos(phi)];
  const eye = rot(4, -1);
  const pelvis = `M${pt([p.P[0] + 6 * pp0[0] + t0[0], p.P[1] + 6 * pp0[1] + t0[1]])} Q${pt([p.P[0] - 5 * t0[0], p.P[1] - 5 * t0[1]])} ${pt([p.P[0] - 6 * pp0[0] + t0[0], p.P[1] - 6 * pp0[1] + t0[1]])}`;
  return `<svg viewBox="0 0 120 150" width="${w}" height="${h}" aria-hidden="true">
    <path d="M${pt(p.L0)} L${pt(p.L1)} L${pt(p.L2)}" stroke="${sub}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <g stroke="${ink}" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="M${pt(p.P)} C${pt(p.C1)} ${pt(p.C2)} ${pt(p.S3)} L${pt(neck)}" stroke-width="4.4" stroke-dasharray="0.1 5.2"/>
      <g stroke-width="2.4"><circle cx="${f1(p.H[0])}" cy="${f1(p.H[1])}" r="9"/><path d="M${pt(rot(-5, 8))} Q${pt(rot(1, 12))} ${pt(rot(6, 7))}"/><path d="${ribs}"/><path d="${pelvis}"/></g>
      <g stroke-width="3"><path d="M${pt(p.P)} L${pt(p.K)} L${pt(p.A)} L${pt(p.T)}"/><path d="M${pt(p.Sh)} L${pt(p.E)} L${pt(p.W)}"/></g>
    </g>
    <circle cx="${f1(eye[0])}" cy="${f1(eye[1])}" r="2.2" fill="${ink}"/>
    <circle cx="${f1(p.K[0])}" cy="${f1(p.K[1])}" r="2.5" fill="${ink}"/>
    <circle cx="${f1(p.E[0])}" cy="${f1(p.E[1])}" r="2.3" fill="${ink}"/>
  </svg>`;
}

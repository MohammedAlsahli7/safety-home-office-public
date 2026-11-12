/* Shared visual pieces for the presenter screens and slides. */
import { config } from "../config.js";

export const C = {
  bg: "#F4EFE6", panel: "#FFFFFF", panel2: "#FBF8F2", line: "#DDD3C2", line2: "#E9E2D5",
  ink: "#1B2328", sub: "#4E5A60", muted: "#5F6A6B", deco: "#A0968A",
  acc: "#C4740A", accText: "#A15C00", tint: "#FCEBCB", tintInk: "#6B4200",
  water: "#2A78D6", grey: "#8A9497", good: "#1E7F55",
  film1: "#1D3A55", film2: "#0B1822", bone: "#E4F1F6", boneSub: "#9FB6C1"
};

export const f1 = n => n.toFixed(1);
export const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
export const enough = n => n >= config.minGroup;

/* The phone icon marks every number that came from the team's phones. */
export const PHONE = `<svg width="16" height="24" viewBox="0 0 16 24" aria-hidden="true" style="flex: none"><rect x="1.5" y="1.5" width="13" height="21" rx="3" fill="none" stroke="${C.accText}" stroke-width="2"/><path d="M6 19h4" stroke="${C.accText}" stroke-width="2" stroke-linecap="round"/></svg>`;

export const callout = (big, txt, cls = "") => `<div class="callout ${cls}">${PHONE}<span class="row"><span class="big">${big}</span><span class="txt">${txt}</span></span></div>`;

/* "6 of 14" once enough people answered, otherwise a waiting line */
export function share(part, n, txt, cls = "") {
  if (!enough(n)) return `<div class="callout ${cls}">${PHONE}<span class="wait">${txt}: shows at ${config.minGroup} answers (${n} so far)</span></div>`;
  return callout(`${part} of ${n}`, txt, cls);
}

/* A confession is an aside: one quiet line under the evidence, never the main point of a slide */
export function confess(q, stat) {
  const ready = enough(stat.n);
  return `
    <div class="confess">
      ${PHONE}
      <span class="q">“${q}”</span>
      <span class="res">${ready ? `<b>${stat.guilty} of ${stat.n}</b> tapped “Guilty”` : `Tap on your phone · ${stat.n} so far`}</span>
    </div>`;
}

export function lamp(id, cx, right, height = 720, top = 0) {
  return `
    <svg viewBox="0 0 420 ${height}" width="420" height="${height}" aria-hidden="true" style="position: absolute; right: ${right}px; top: ${top}px">
      <defs>
        <linearGradient id="${id}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFB547" stop-opacity="0.34"/><stop offset="1" stop-color="#FFB547" stop-opacity="0"/></linearGradient>
        <radialGradient id="${id}h" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFD58A" stop-opacity="0.8"/><stop offset="1" stop-color="#FFD58A" stop-opacity="0"/></radialGradient>
      </defs>
      <path d="M${cx - 60} 168 L${cx + 60} 168 L${cx + 200} ${height - 20} L${cx - 200} ${height - 20} Z" fill="url(#${id}c)"/>
      <circle cx="${cx}" cy="170" r="74" fill="url(#${id}h)"/>
      <line x1="${cx}" y1="0" x2="${cx}" y2="104" stroke="var(--deco)" stroke-width="2.5" stroke-dasharray="2 5" stroke-linecap="round"/>
      <path d="M${cx - 32} 104 H${cx + 32} L${cx + 66} 166 H${cx - 66} Z" fill="#2F3A40"/>
      <path d="M${cx - 66} 166 H${cx + 66}" stroke="${C.acc}" stroke-width="3" stroke-linecap="round"/>
      <circle cx="${cx}" cy="172" r="13" fill="#FFE6B8"/>
    </svg>`;
}

/* The join screen's lamp, with a cord to pull like the one on the phones. 0 is off, 100 is bright.
   The bead hangs from the shade and moves down as the light goes up. */
export const CORD = { x: 262, top: 214, run: 170 };   /* in the lamp's 420 × 720 drawing */
export function pullLamp(L, name) {
  const k = Math.max(0, Math.min(100, L)) / 100, bead = CORD.top + k * CORD.run, cx = 210;
  const mix = (a, b) => "#" + [1, 3, 5].map(i => Math.round(parseInt(a.slice(i, i + 2), 16) + (parseInt(b.slice(i, i + 2), 16) - parseInt(a.slice(i, i + 2), 16)) * k).toString(16).padStart(2, "0")).join("");
  return `
    <svg viewBox="0 0 420 720" width="420" height="720" aria-hidden="true">
      <defs>
        <linearGradient id="plc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFB547" stop-opacity="0.5"/><stop offset="1" stop-color="#FFB547" stop-opacity="0"/></linearGradient>
        <radialGradient id="plh" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFD58A" stop-opacity="0.95"/><stop offset="1" stop-color="#FFD58A" stop-opacity="0"/></radialGradient>
      </defs>
      <path d="M${cx - 60} 168 L${cx + 60} 168 L${cx + 200} 700 L${cx - 200} 700 Z" fill="url(#plc)" opacity="${(0.04 + 0.96 * k).toFixed(2)}"/>
      <circle cx="${cx}" cy="170" r="${(60 + 40 * k).toFixed(0)}" fill="url(#plh)" opacity="${(0.1 + 0.9 * k).toFixed(2)}"/>
      <line x1="${cx}" y1="0" x2="${cx}" y2="104" stroke="var(--deco)" stroke-width="2.5" stroke-dasharray="2 5" stroke-linecap="round"/>
      <path d="M${cx - 32} 104 H${cx + 32} L${cx + 66} 166 H${cx - 66} Z" fill="#2F3A40"/>
      <path d="M${cx - 66} 166 H${cx + 66}" stroke="${C.acc}" stroke-width="3" stroke-linecap="round"/>
      <circle cx="${cx}" cy="172" r="13" fill="${mix("#8C8478", "#FFE6B8")}"/>
      <path d="M${CORD.x} 166 V${bead.toFixed(1)}" stroke="var(--deco)" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="0.1 6"/>
      <circle cx="${CORD.x}" cy="${bead.toFixed(1)}" r="13" fill="${C.acc}" stroke="#2F3A40" stroke-width="2"/>
      <text x="${CORD.x - 24}" y="${(bead + 5).toFixed(1)}" text-anchor="end" style="font-family: var(--mono); font-size: 14px; letter-spacing: 0.1em; fill: var(--accent-text)">${k < 0.15 ? "PULL" : esc(name.toUpperCase())}</text>
    </svg>`;
}

/* Window colours for each room-light level (live screen) */
export function roomColours(L) {
  if (typeof L !== "number") return ["#E9E2D5", "rgba(0,0,0,0)"];
  return L < 17 ? ["#0C141B", "rgba(0,0,0,0)"]
    : L < 34 ? ["#1E2B35", "rgba(255,200,120,0.18)"]
    : L < 50 ? ["#5B4021", "rgba(255,190,110,0.35)"]
    : L < 67 ? ["#9C6A2A", "rgba(255,210,140,0.45)"]
    : L < 84 ? ["#E6C27E", "rgba(255,240,200,0.6)"]
    : ["#F7EAC8", "rgba(255,255,240,0.8)"];
}

/* QR code as an SVG path, from the vendored qrcode-generator (global `qrcode`). */
export function qrSVG(text, size) {
  const q = window.qrcode(0, "M");
  q.addData(text);
  q.make();
  const n = q.getModuleCount(), m = 2;
  let d = "";
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.isDark(y, x)) d += `M${x + m} ${y + m}h1v1h-1z`;
  return `<svg viewBox="0 0 ${n + 2 * m} ${n + 2 * m}" width="${size}" height="${size}" role="img" aria-label="QR code to join" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="${C.ink}"/></svg>`;
}

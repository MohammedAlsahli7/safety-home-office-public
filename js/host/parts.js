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

/* One figure per person who tapped; filled = "Guilty" */
export function people(guilty, n) {
  const w = Math.min(24, Math.floor(400 / Math.max(n, 1)));
  let d1 = "", d0 = "";
  for (let i = 0; i < n; i++) {
    const s = w / 24, x = i * w;
    const d = `M${f1(x + 10 * s)} ${f1(1.5)} a${f1(5.5 * s)} ${f1(5.5 * s)} 0 1 0 0.01 0 Z M${f1(x + 2 * s)} 28 Q${f1(x + 2 * s)} 15 ${f1(x + 10 * s)} 15 Q${f1(x + 18 * s)} 15 ${f1(x + 18 * s)} 28 Z `;
    if (i < guilty) d1 += d; else d0 += d;
  }
  return `<svg width="${Math.max(w * n, 1)}" height="28" viewBox="0 0 ${Math.max(w * n, 1)} 28" role="img" aria-label="${guilty} of ${n}"><path d="${d1}" fill="${C.acc}"/><path d="${d0}" fill="${C.line}"/></svg>`;
}

export function confess(q, stat) {
  const ready = enough(stat.n);
  return `
    <div class="confess">
      ${PHONE}
      <div style="display: flex; flex-direction: column; gap: 12px; min-width: 0">
        <span class="q">“${q}”</span>
        ${ready ? people(stat.guilty, stat.n) : ""}
        ${ready
          ? `<span style="display: flex; align-items: baseline; gap: 10px"><span class="big">${stat.guilty} of ${stat.n}</span><span class="g">tapped “Guilty”</span></span>`
          : `<span class="g">Tap on your phone. ${stat.n} tapped so far.</span>`}
      </div>
    </div>`;
}

export function lamp(id, cx, right, height = 720) {
  return `
    <svg viewBox="0 0 420 ${height}" width="420" height="${height}" aria-hidden="true" style="position: absolute; right: ${right}px; top: 0">
      <defs>
        <linearGradient id="${id}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFB547" stop-opacity="0.34"/><stop offset="1" stop-color="#FFB547" stop-opacity="0"/></linearGradient>
        <radialGradient id="${id}h" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFD58A" stop-opacity="0.8"/><stop offset="1" stop-color="#FFD58A" stop-opacity="0"/></radialGradient>
      </defs>
      <path d="M${cx - 60} 168 L${cx + 60} 168 L${cx + 200} ${height - 20} L${cx - 200} ${height - 20} Z" fill="url(#${id}c)"/>
      <circle cx="${cx}" cy="170" r="74" fill="url(#${id}h)"/>
      <line x1="${cx}" y1="0" x2="${cx}" y2="104" stroke="${C.deco}" stroke-width="2.5" stroke-dasharray="2 5" stroke-linecap="round"/>
      <path d="M${cx - 32} 104 H${cx + 32} L${cx + 66} 166 H${cx - 66} Z" fill="#2F3A40"/>
      <path d="M${cx - 66} 166 H${cx + 66}" stroke="${C.acc}" stroke-width="3" stroke-linecap="round"/>
      <circle cx="${cx}" cy="172" r="13" fill="#FFE6B8"/>
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

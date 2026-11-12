/* Line illustrations from the design canvas. They draw with currentColor and the theme's
   CSS variables (set by theme.js on phones, by .mirror on the presenter screen), so they
   follow the room light. Colours go in style="" because var() isn't reliable in SVG attributes. */
const G = (w = 2.4) => `stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="none"`;
const tile = inner => `<svg viewBox="0 0 120 90" width="136" height="102" aria-hidden="true">${inner}</svg>`;

/* Picture tiles, keyed by card then option value */
export const TILE_ART = {
  laptop: {
    stand: tile(`<g ${G()}><path d="M8 82 H112"/><rect x="36" y="12" width="48" height="32" rx="3"/><path d="M30 50 L36 44 H84 L90 50 Z"/><path d="M40 50 L36 82 M80 50 L84 82"/><rect x="30" y="72" width="60" height="7" rx="2"/></g>`),
    desk: tile(`<g ${G()}><path d="M8 82 H112"/><rect x="36" y="42" width="48" height="32" rx="3"/><path d="M28 82 L36 74 H84 L92 82 Z"/></g>`),
    lap: tile(`<g ${G(3)}><path d="M22 70 H92"/><circle cx="20" cy="70" r="4"/><circle cx="95" cy="70" r="4"/><path d="M97 74 L100 88"/></g><path d="M34 64 H80 L88 36" style="stroke: var(--sub)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`),
    bed: tile(`<g ${G()}><rect x="8" y="46" width="34" height="16" rx="8"/><path d="M6 72 Q26 60 46 70 T86 68 T114 66"/><path d="M6 84 H114"/><path d="M54 66 L90 62 L86 34"/></g><g style="stroke: var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M20 22 h8 l-8 9 h8"/><path d="M34 12 h6 l-6 7 h6"/></g>`)
  },
  coworker: {
    cat: tile(`<g ${G()}><rect x="26" y="14" width="68" height="46" rx="4"/><path d="M16 74 L26 62 H94 L104 74 Z"/><path d="M78 70 C92 72 96 60 88 52"/></g><g stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="fill: var(--panel2)"><path d="M46 70 C44 54 50 44 60 44 C70 44 76 54 74 70 Z"/><path d="M50 38 L51 24 L58 31 Q60 30 62 31 L69 24 L70 38 Q70 48 60 48 Q50 48 50 38 Z"/></g><g style="fill: var(--accent)"><circle cx="56" cy="38" r="1.8"/><circle cx="64" cy="38" r="1.8"/></g>`),
    kids: tile(`<g ${G()}><rect x="62" y="16" width="48" height="36" rx="3"/><path d="M78 52 V62 M70 64 H94"/><path d="M10 30 L52 22 L34 42 Z M34 42 L36 32 L52 22"/><rect x="14" y="58" width="22" height="22" rx="2"/><path d="M21 75 L25 63 L29 75 M22.5 71 H27.5"/></g><path d="M4 40 h8 M2 34 h6" style="stroke: var(--deco)" stroke-width="2" stroke-linecap="round"/><path d="M68 44 l6 -10 l6 10 l6 -10 l6 10 l6 -10" style="stroke: var(--accent)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`),
    door: tile(`<g ${G()}><path d="M40 86 V8 H80 V86"/><path d="M20 86 H104"/><rect x="12" y="62" width="24" height="24" rx="2"/><path d="M12 70 H36 M24 62 V70"/><circle cx="90" cy="40" r="3.4"/></g><circle cx="72" cy="50" r="2.6" fill="currentColor"/><path d="M97 33 a10 10 0 0 1 0 14 M102 28 a17 17 0 0 1 0 24" style="stroke: var(--accent)" stroke-width="2.2" stroke-linecap="round" fill="none"/>`),
    chat: tile(`<g ${G()}><rect x="40" y="6" width="42" height="80" rx="8"/><rect x="46" y="18" width="22" height="9" rx="4"/><rect x="54" y="31" width="22" height="9" rx="4"/><rect x="46" y="44" width="18" height="9" rx="4"/><rect x="52" y="57" width="24" height="9" rx="4"/></g><circle cx="82" cy="10" r="10" fill="#FF6B5E"/><text x="82" y="13.5" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="9" font-weight="700" fill="#0B1620">99+</text>`)
  },
  lunch: {
    table: tile(`<g ${G()}><path d="M8 72 H112 M18 72 V88 M102 72 V88"/><ellipse cx="60" cy="62" rx="26" ry="6"/><ellipse cx="60" cy="61" rx="14" ry="3"/><path d="M26 54 V68 M23 54 V60 Q26 63 29 60 V54"/><path d="M94 54 V68 M94 54 Q99 58 94 63"/></g><g style="stroke: var(--accent)" stroke-width="2" stroke-linecap="round" fill="none"><path d="M52 50 q3 -5 0 -10 q-3 -5 0 -10"/><path d="M60 48 q3 -5 0 -10 q-3 -5 0 -10"/><path d="M68 50 q3 -5 0 -10 q-3 -5 0 -10"/></g>`),
    keyboard: tile(`<g ${G()}><rect x="14" y="44" width="92" height="30" rx="4"/><path d="M58 22 L92 22 L92 36 Z"/><path d="M58 22 L92 36"/></g><path d="M22 52 h6 M34 52 h6 M46 52 h6 M58 52 h6 M70 52 h6 M82 52 h6 M94 52 h4 M22 60 h6 M34 60 h6 M46 60 h6 M58 60 h6 M70 60 h6 M82 60 h6 M94 60 h4 M34 67 h52" style="stroke: var(--deco)" stroke-width="2" stroke-linecap="round"/><g style="fill: var(--accent)"><circle cx="30" cy="48" r="1.6"/><circle cx="52" cy="56" r="1.4"/><circle cx="66" cy="49" r="1.8"/><circle cx="78" cy="64" r="1.4"/><circle cx="44" cy="64" r="1.6"/><circle cx="90" cy="56" r="1.4"/></g>`),
    meeting: tile(`<g ${G()}><ellipse cx="46" cy="68" rx="30" ry="7"/><ellipse cx="46" cy="67" rx="16" ry="3.5"/><path d="M10 84 H82"/></g><circle cx="90" cy="32" r="20" style="fill: var(--tint); stroke: var(--accent)" stroke-width="2.4"/><g style="stroke: var(--accent)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"><rect x="86" y="21" width="8" height="14" rx="4"/><path d="M81 31 a9 9 0 0 0 18 0 M90 40 v4"/><path d="M80 22 L100 42"/></g>`),
    none: tile(`<g ${G()}><circle cx="60" cy="45" r="32"/><circle cx="60" cy="45" r="22"/><path d="M18 24 V66 M15 24 V32 Q18 35 21 32 V24"/><path d="M102 24 V66 M102 24 Q108 30 102 36"/></g><path d="M60 45 V31 M60 45 L70 51" style="stroke: var(--accent)" stroke-width="2.6" stroke-linecap="round" fill="none"/><circle cx="60" cy="45" r="2.4" style="fill: var(--accent)"/>`)
  },
  logoff: {
    packed: tile(`<g ${G()}><rect x="22" y="30" width="76" height="50" rx="6"/><path d="M46 30 V24 Q46 18 52 18 H68 Q74 18 74 24 V30"/><path d="M22 46 H98"/><rect x="54" y="42" width="12" height="8" rx="2"/></g>`),
    closed: tile(`<g ${G()}><path d="M8 74 H112"/><path d="M26 74 L30 66 H90 L94 74"/><circle cx="96" cy="30" r="12"/></g><path d="M96 30 V22 M96 30 L101 34" style="stroke: var(--accent)" stroke-width="2.2" stroke-linecap="round" fill="none"/>`),
    open: tile(`<g ${G()}><path d="M8 82 H112"/><rect x="30" y="26" width="60" height="42" rx="3"/><path d="M22 82 L30 72 H90 L98 82 Z"/></g><circle cx="84" cy="32" r="4" style="fill: var(--accent)"/><path d="M92 22 a12 12 0 0 1 4 10 M98 16 a20 20 0 0 1 6 16" style="stroke: var(--accent)" stroke-width="2" stroke-linecap="round" fill="none"/>`),
    meeting: tile(`<g ${G()}><path d="M8 82 H112"/><rect x="30" y="26" width="60" height="42" rx="3"/><path d="M22 82 L30 72 H90 L98 82 Z"/></g><g style="stroke: var(--deco)" stroke-width="1.8" fill="none"><rect x="36" y="31" width="22" height="15" rx="2"/><rect x="62" y="31" width="22" height="15" rx="2"/><rect x="36" y="49" width="22" height="15" rx="2"/><rect x="62" y="49" width="22" height="15" rx="2"/></g><circle cx="40" cy="20" r="3.4" style="fill: var(--accent)"/>`)
  }
};

/* Morning routes: small icons joined by chevrons; the laptop at the end is the accent */
const icon = (d, size = 26, colour = "currentColor") => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" style="stroke: ${colour}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const BED = `<path d="M3 19v-9M3 15h18v4M21 15v-2a3 3 0 0 0-3-3h-7v5"/><rect x="5" y="11" width="4" height="3" rx="1.5"/>`;
const PHONE = `<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>`;
const LAPTOP = `<rect x="5" y="5" width="14" height="10" rx="1"/><path d="M3 19h18l-2-4H5z"/>`;
const CUP = `<path d="M4 9h12v5a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5z"/><path d="M16 10h2a2 2 0 0 1 0 4h-2"/>`;
const STEAM = `<path d="M8 3c0 1.5 1 1.5 1 3M12 3c0 1.5 1 1.5 1 3"/>`;
const SHOWER = `<path d="M5 8a6 6 0 0 1 12 0z"/><path d="M11 2v2M8 12l-1 2M11 12v3M14 12l1 2M9.5 17l-.5 2M12.5 17l.5 2"/>`;
const PLATE = `<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/>`;
const SPEED = `<path d="M3 8h6M2 12h7M4 16h5"/>`;
const chev = `<span class="chev">›</span>`;
export const ROUTES = {
  pillow: [icon(BED), chev, icon(PHONE), chev, icon(LAPTOP, 26, "var(--accent)")].join(""),
  coffee: [icon(CUP + STEAM), chev, icon(LAPTOP, 26, "var(--accent)")].join(""),
  straight: [icon(SPEED, 26, "var(--done)"), icon(LAPTOP, 26, "var(--accent)")].join(""),
  routine: [icon(SHOWER, 24), chev, icon(PLATE, 24), chev, icon(CUP, 24), chev, icon(LAPTOP, 24, "var(--accent)")].join("")
};

/* Stand-up ring: a chair inside a ring that fills with the time since standing */
export const standRing = (fill, size = 188) => `
  <svg viewBox="0 0 188 188" width="${size}" height="${size}" aria-hidden="true">
    <circle cx="94" cy="94" r="78" style="fill: var(--panel)"/>
    <circle cx="94" cy="94" r="78" style="stroke: var(--line)" stroke-width="10" fill="none"/>
    <circle class="ring-fill" cx="94" cy="94" r="78" style="stroke: var(--accent)" stroke-width="10" stroke-linecap="round" fill="none" stroke-dasharray="490.1" stroke-dashoffset="${(490.1 * (1 - fill)).toFixed(1)}" transform="rotate(-90 94 94)"/>
    <path d="M94 8 v8" style="stroke: var(--deco)" stroke-width="2" stroke-linecap="round"/>
    <g ${G(2.6)} transform="translate(64 60)"><path d="M12 0 V34 H48"/><path d="M16 34 V60 M44 34 V60"/><path d="M12 46 H48"/></g>
  </svg>`;

/* Daily steps: office days on the outer ring, home days on the inner one. A full ring is `max` steps. */
const STEP_R = { office: 84, home: 58 };
export const stepsCirc = k => 2 * Math.PI * STEP_R[k];
export const stepsOffset = (k, v, max) => (stepsCirc(k) * (1 - Math.max(0, Math.min(1, (v || 0) / max)))).toFixed(1);
export const stepsRings = (office, home, max, size = 200) => `
  <svg viewBox="0 0 200 200" width="${size}" height="${size}" aria-hidden="true">
    ${["office", "home"].map(k => `
    <circle cx="100" cy="100" r="${STEP_R[k]}" style="stroke: var(--line)" stroke-width="16" fill="none"/>
    <circle class="ring-${k}" cx="100" cy="100" r="${STEP_R[k]}" style="stroke: var(${k === "office" ? "--done" : "--accent"})" stroke-width="16" stroke-linecap="round" fill="none"
      stroke-dasharray="${stepsCirc(k).toFixed(1)}" stroke-dashoffset="${stepsOffset(k, k === "office" ? office : home, max)}" transform="rotate(-90 100 100)" opacity="${(k === "office" ? office : home) > 0 ? 1 : 0}"/>`).join("")}
  </svg>`;

/* News: a phone that fills with alerts, goes quiet, or spins on refresh */
const WIDTHS = [[92, 64], [78, 52], [88, 70], [70, 46], [84, 60]];
const TIMES = ["now", "1m", "3m", "6m", "9m"];
export function newsPhone(opt) {
  const n = opt ? opt.alerts : 2;
  const quiet = opt && opt.v === "off";
  const refresh = opt && opt.v === "refresh";
  const alerts = Array.from({ length: n }, (_, i) => `
    <span class="alert"><i></i><span><b style="width: ${WIDTHS[i][0]}%"></b><b style="width: ${WIDTHS[i][1]}%"></b></span><small>${TIMES[i]}</small></span>`).join("");
  return `
    <div class="news-phone" aria-hidden="true">
      <span class="notch"></span>
      <div class="feed">
        ${refresh ? `<span class="spin-wrap"><svg class="spin" width="22" height="22" viewBox="0 0 24 24" fill="none" style="stroke: var(--accent)" stroke-width="2.2" stroke-linecap="round"><path d="M20 12a8 8 0 1 1-3-6.2"/><path d="M20 4v5h-5"/></svg></span>` : ""}
        ${quiet ? `<span class="quiet"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" style="stroke: var(--accent)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg><span>Muted · news later</span></span>` : alerts}
      </div>
    </div>`;
}

/* Coffee tower and water glass (Coffee vs. water card) */
export const MAX_CUPS = 9, MAX_GLASSES = 8, MAX_COUNT = 20;
export function cupTower(coffee, animateTop = false) {
  const shown = Math.min(coffee, MAX_CUPS);
  return Array.from({ length: shown }, (_, i) => `
    <svg viewBox="0 0 56 30" aria-hidden="true" class="cup${animateTop && i === shown - 1 ? " new" : ""}" style="bottom: ${14 + i * 17}px">
      <path d="M4 6 Q6 26 28 27 Q50 26 52 6 Z" style="fill: var(--panel2)" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M9 13 Q28 18 47 13" style="stroke: var(--accent)" stroke-width="1.8" stroke-linecap="round" fill="none"/>
      ${i === shown - 1 ? `<ellipse cx="28" cy="6.5" rx="21" ry="3" fill="#8A5A2B"/>` : ""}
    </svg>`).join("");
}
export function waterGlass(water, id = "glassInside") {
  const h = 166 * Math.min(water, MAX_GLASSES) / MAX_GLASSES;
  return `
    <svg viewBox="0 0 90 182" width="86" height="174" aria-hidden="true" style="filter: drop-shadow(0 0 5px var(--glow))">
      <defs><clipPath id="${id}"><path d="M10 8 L19 170 Q20 174 25 174 H65 Q70 174 71 170 L80 8 Z"/></clipPath></defs>
      <rect x="0" y="${(174 - h).toFixed(1)}" width="90" height="${h.toFixed(1)}" fill="#4FA8D6" opacity="0.6" clip-path="url(#${id})"/>
      <path d="M8 6 L18 172 Q19 177 25 177 H65 Q71 177 72 172 L82 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M74 27 h5 M75 48 h5 M76 69 h5 M77 90 h5 M78 111 h5 M79 132 h5 M80 153 h5" style="stroke: var(--deco)" stroke-width="1.4" stroke-linecap="round"/>
    </svg>`;
}

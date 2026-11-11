/* Small line illustrations for the option cards. They use currentColor plus the theme's accent,
   so they follow the room light. */
const A = "var(--accent)";
const S = 'stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"';

export const ART = {
  laptop: `<svg viewBox="0 0 220 110" width="220" height="110" aria-hidden="true">
    <path ${S} d="M60 78 L76 22 H152 L136 78 Z"/><path ${S} d="M40 80 H160"/><path d="M84 30 H146 L133 70 H71 Z" fill="${A}" opacity="0.25"/>
    <path ${S} d="M20 100 H200"/></svg>`,
  alarm: `<svg viewBox="0 0 220 110" width="220" height="110" aria-hidden="true">
    <circle ${S} cx="110" cy="58" r="38"/><path ${S} d="M110 36 V58 L126 68"/><path ${S} d="M78 22 L66 34 M142 22 L154 34"/>
    <path d="M88 14 Q72 8 64 22" stroke="${A}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M132 14 Q148 8 156 22" stroke="${A}" stroke-width="4" fill="none" stroke-linecap="round"/></svg>`,
  stopwatch: `<svg viewBox="0 0 220 110" width="220" height="110" aria-hidden="true">
    <circle ${S} cx="110" cy="60" r="40"/><path ${S} d="M102 12 H118 M110 12 V20"/><path d="M110 60 V30 A30 30 0 0 1 136 75 Z" fill="${A}" opacity="0.8"/></svg>`,
  cat: `<svg viewBox="0 0 220 110" width="220" height="110" aria-hidden="true">
    <path ${S} d="M84 70 L88 30 L104 44 Q110 42 116 44 L132 30 L136 70 Q136 92 110 92 Q84 92 84 70 Z"/>
    <circle cx="101" cy="62" r="3.5" fill="currentColor"/><circle cx="119" cy="62" r="3.5" fill="currentColor"/><path d="M106 72 H114 L110 77 Z" fill="${A}"/>
    <path ${S} d="M30 100 H190"/><path d="M40 92 H70 M150 92 H180" stroke="${A}" stroke-width="5" stroke-linecap="round" stroke-dasharray="6 6"/></svg>`,
  plate: `<svg viewBox="0 0 220 110" width="220" height="110" aria-hidden="true">
    <circle ${S} cx="110" cy="58" r="40"/><circle cx="110" cy="58" r="24" fill="${A}" opacity="0.3"/><path ${S} d="M48 22 V96 M42 22 V42 Q48 50 54 42 V22 M172 22 Q186 40 172 58 V96"/></svg>`,
  alerts: `<svg viewBox="0 0 220 110" width="220" height="110" aria-hidden="true">
    <rect ${S} x="74" y="6" width="72" height="104" rx="12"/>
    <rect x="82" y="22" width="56" height="14" rx="5" fill="${A}"/><rect x="82" y="42" width="56" height="14" rx="5" fill="${A}" opacity="0.7"/><rect x="82" y="62" width="56" height="14" rx="5" fill="${A}" opacity="0.45"/></svg>`,
  clock: `<svg viewBox="0 0 220 110" width="220" height="110" aria-hidden="true">
    <circle ${S} cx="110" cy="56" r="44"/><path ${S} d="M110 56 L102 34"/><path d="M110 56 V92" stroke="${A}" stroke-width="4" stroke-linecap="round"/>
    <path ${S} d="M110 16 V22 M150 56 H144 M110 96 V90 M70 56 H76"/></svg>`
};

export const cupSVG = (filled) => `<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M3 6 H21 L18.5 18 Q12 22 5.5 18 Z" fill="${filled ? A : "none"}" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`;

export const glassSVG = (level) => {
  const top = 8 + (1 - level) * 76;
  return `<svg viewBox="0 0 64 92" width="54" height="78" aria-hidden="true">
    <defs><clipPath id="glassclip"><path d="M8 4 H56 L50 88 H14 Z"/></clipPath></defs>
    <rect x="0" y="${top.toFixed(1)}" width="64" height="92" fill="#4FA3E0" opacity="0.85" clip-path="url(#glassclip)"/>
    <path d="M8 4 H56 L50 88 H14 Z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/></svg>`;
};

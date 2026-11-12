/* Presenter screens for the game: join (QR), the presenter's introduction, one screen per card
   while phones answer it (then, on the presenter's click, how many picked each answer, or the team
   average), and the wrap-up when reports land on the phones.
   The join and card screens are a fixed frame plus live parts ([data-live] slots, filled by app.js),
   so the lamp cord and the card on screen can be played without being redrawn mid-drag. The buttons
   live in a separate control bar (app.js), so live updates here never swallow a click either. */
import { CARDS, POSES, VERDICT_NOTES, poseIndex } from "../content.js";
import { config } from "../config.js";
import { skeletonSVG } from "../skeleton.js";
import { TILE_ART, ROUTES, standRing, newsPhone, cupTower, waterGlass } from "../phone/art.js";
import { C, CORD, esc, lamp, qrSVG, roomColours } from "./parts.js";

export const statusChip = status => `<span class="status" data-s="${status}"><i></i>${{ live: "Live", connecting: "Connecting", reconnecting: "Reconnecting", offline: "Offline", idle: "Starting" }[status] || status}</span>`;
const slot = (name, tag = "span", attrs = "") => `<${tag} data-live="${name}" ${attrs}></${tag}>`;

/* ---------- Introduction: who's presenting (from the private slide data, never from the code).
   A small QR code stays in the corner, so people can keep joining while the presenter talks. ---------- */
export function introFrame(intro, url) {
  const join = `
    <div class="intro-join">
      ${qrSVG(url, 132)}
      <span><b>Scan to play</b><span class="ij-n">${slot("count", "b")} joined</span></span>
    </div>`;
  if (!intro.name) {
    return `<div class="slide game">${slot("status")}<div class="s-body" style="justify-content: center"><span class="wait" style="font-size: 24px">Add your introduction in the presenter tools (P): name, role, home and assignment organization.</span></div>${join}</div>`;
  }
  return `
  <div class="slide game">
    ${slot("status")}
    ${lamp("lin", 210, 40)}
    <div class="s-body" style="justify-content: center; gap: 30px; max-width: 800px">
      <div style="display: flex; flex-direction: column; gap: 10px">
        <span class="intro-label">Introduction</span>
        <h2 class="h intro-name">${esc(intro.name)}</h2>
        ${intro.role ? `<p class="intro-role">${esc(intro.role)}</p>` : ""}
      </div>
      ${introPath(intro)}
    </div>
    ${join}
  </div>`;
}

/* The presenter's path as a picture, not sentences: studied → home organization → on assignment.
   "Downstream / Global Optimizer Department" shows the last part big and the first part under it. */
const IP_ICONS = {
  cap: `<path d="M3 13 L17 6 L31 13 L17 20 Z"/><path d="M9 16 V23 Q17 28 25 23 V16"/><path d="M31 13 V21"/>`,
  home: `<path d="M5 16 L17 6 L29 16"/><path d="M8 14 V29 H26 V14"/><path d="M14 29 V21 H20 V29"/>`,
  case: `<rect x="5" y="11" width="24" height="17" rx="3"/><path d="M13 11 V7 H21 V11"/><path d="M5 18 H29"/>`
};
function introPath(intro) {
  const split = s => { const p = String(s || "").split(/\s*\/\s*/).filter(Boolean); return p.length > 1 ? [p.at(-1), p.slice(0, -1).join(" · ")] : [p[0] || "", ""]; };
  const step = (icon, label, main, sub, now) => `
    <div class="ip-step${now ? " now" : ""}">
      <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true" fill="none" stroke="${C.accText}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${IP_ICONS[icon]}</svg>
      <span class="ip-lbl">${label}</span>
      <b class="ip-main">${esc(main)}</b>
      ${sub ? `<span class="ip-sub">${esc(sub)}</span>` : ""}
    </div>`;
  const arrow = `<svg class="ip-arrow" width="34" height="20" viewBox="0 0 34 20" aria-hidden="true"><path d="M3 10 H29 M22 3 L30 10 L22 17" fill="none" stroke="${C.deco}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const e = intro.education || {};
  const steps = [
    e.school && step("cap", "Studied", e.school, [e.field, e.focus].filter(Boolean).join(" · ")),
    intro.home && step("home", "Home", ...split(intro.home)),
    intro.assignment && step("case", "On assignment", ...split(intro.assignment), true)
  ].filter(Boolean);
  return steps.length ? `<div class="intro-path" style="grid-template-columns: ${steps.map(() => "minmax(0, 1fr)").join(" 34px ")}">${steps.join(arrow)}</div>` : "";
}

/* ---------- Join: the first screen. The lamp's cord can be pulled, like on the phones. ---------- */
export function joinFrame(url) {
  return `
  <div class="slide game lamplit">
    ${slot("status")}
    <div class="pull-lamp" id="pull-lamp"></div>
    <div class="s-body" style="display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: 56px">
      <div style="display: flex; flex-direction: column; justify-content: center; gap: 22px">
        <h1 class="h">Home office check-up</h1>
        <p style="margin: 0; font-size: 24px; line-height: 1.4; color: var(--sub); max-width: 560px">Scan, pull the lamp cord, and wait for the first card. Eleven quick ones, on your phone, anonymous.</p>
        <div style="display: flex; align-items: baseline; gap: 14px">
          ${slot("count", "span", `style="font-family: var(--mono); font-size: 56px; font-weight: 500; color: var(--accent-text); line-height: 1"`)}
          <span style="font-size: 22px; color: var(--sub)">joined</span>
        </div>
        <div class="names-row" id="names" data-live="names"></div>
      </div>
      <div style="display: flex; flex-direction: column; justify-content: center">
        <div class="qr-card" data-join="${esc(url)}">
          ${qrSVG(url, 290)}
          <span style="font-size: 28px; font-weight: 800; font-stretch: 80%">Scan to play</span>
          <span style="font-family: var(--mono); font-size: 13px; color: ${C.muted}; text-align: center; word-break: break-all">${esc(url.replace(/^https?:\/\//, ""))}</span>
        </div>
      </div>
    </div>
    <div class="cord-hit" id="cord" role="slider" tabindex="0" aria-label="Room light" aria-valuemin="0" aria-valuemax="100" style="left: ${530 + CORD.x - 30}px; top: 150px; height: ${CORD.top + CORD.run - 150 + 30}px"></div>
  </div>`;
}

export const joinNames = (players, newest) => Object.values(players).slice(-80).map(p => `<span class="name-chip${p === newest ? " new" : ""}">${esc(p.nick)}</span>`).join("");

/* ---------- One card while phones answer it, then its results ---------- */
const pick = (o, extra = "", cls = "") => `<div class="m-pick ${cls}"><span class="t">${esc(o.label)}</span><span class="n">${esc(o.note)}</span>${extra}</div>`;
const pct = (c, n) => (n ? Math.round(c / n * 100) : 0);
const resBar = (c, n, lead) => `<span class="m-res${lead ? " lead" : ""}"><span class="m-bar"><i style="width: ${pct(c, n)}%"></i></span><b>${c}</b></span>`;
const f1 = x => (Math.round(x * 10) / 10).toFixed(1);

/* The numbers behind a card, once the presenter shows them (never below the minimum group) */
function results(card, stats) {
  const n = stats.answered[card.key] || 0;
  if (n < config.minGroup) return { n, wait: true };
  if (card.kind === "options") {
    const counts = stats[card.key].counts;
    return { n, count: v => counts[v] || 0, max: Math.max(...Object.values(counts)) };
  }
  if (card.kind === "dial") return { n, counts: stats.posture.counts, max: Math.max(...stats.posture.counts), avg: stats.posture.avg };
  if (card.kind === "fuel") return { n, coffee: stats.fuel.coffee / stats.fuel.n, water: stats.fuel.water / stats.fuel.n };
  if (card.kind === "stare") return { n, avg: stats.stare.avg };
  if (card.kind === "verdict") return { n, hist: stats.verdict.hist, max: Math.max(...stats.verdict.hist), avg: stats.verdict.avg };
  return { n };
}

function cardVisual(card, r) {
  const kind = card.kind === "options" ? card.layout : card.kind;
  const lead = o => r && r.count && r.count(o.v) === r.max && r.max > 0;
  const bar = o => (r && r.count ? resBar(r.count(o.v), r.n, lead(o)) : "");
  switch (kind) {
    case "tiles":
      return `<div class="m-tiles${r ? " shown" : ""}">${card.options.map(o => `<div class="m-tile${lead(o) ? " lead" : ""}"><span class="pic">${TILE_ART[card.key][o.v]}</span><span class="t">${esc(o.label)}</span><span class="n">${esc(o.note)}</span>${bar(o)}</div>`).join("")}</div>`;
    case "routes":
      return `<div class="m-routes">${card.options.map(o => `<div class="m-route${lead(o) ? " lead" : ""}"><span class="txt"><span class="t">${esc(o.label)}</span><span class="n">${esc(o.note)}</span></span>${r ? bar(o) : `<span class="icons">${ROUTES[o.v]}</span>`}</div>`).join("")}</div>`;
    case "stand":
      return `<div class="m-split"><div class="m-ring">${standRing(0.5, 210)}</div><div class="m-grid2">${card.options.map(o => pick(o, bar(o), lead(o) ? "lead" : "")).join("")}</div></div>`;
    case "news":
      return `<div class="m-split"><div class="m-news">${newsPhone(card.options[2])}</div><div class="m-grid2">${card.options.map(o => pick(o, bar(o), lead(o) ? "lead" : "")).join("")}</div></div>`;
    case "dial": {
      const poses = POSES.map((name, i) => {
        const top = r && r.counts[i] === r.max && r.max > 0;
        return `<div class="m-pose${top ? " lead" : ""}"><span class="xray">${skeletonSVG(i / 3, { w: 132, h: 165, ink: C.bone, sub: C.boneSub })}</span><span class="t">${name}</span>${r ? resBar(r.counts[i], r.n, top) : ""}</div>`;
      }).join("");
      const avg = r ? `<div class="m-pose avg"><span class="xray">${skeletonSVG(r.avg, { w: 132, h: 165, ink: "#FFE2B3", sub: "#C9A46A" })}</span><span class="t">Team average</span><span class="n">closest to ${POSES[poseIndex(r.avg)]}</span></div>` : "";
      return `<div class="m-poses${r ? " shown" : ""}">${poses}${avg}</div>`;
    }
    case "fuel":
      return `<div class="m-fuel">
        <div class="m-fuel-col"><div class="fuel-scene coffee"><div class="tower">${cupTower(r ? Math.round(r.coffee) : 4)}</div></div>${r ? `<span class="m-avg-n"><b>${f1(r.coffee)}</b> cups on average</span>` : `<span class="t">Coffee, Karak</span>`}</div>
        <div class="m-fuel-col"><div class="fuel-scene water">${waterGlass(r ? r.water : 2, "hostGlass")}</div>${r ? `<span class="m-avg-n"><b>${f1(r.water)}</b> glasses on average</span>` : `<span class="t">Water</span>`}</div>
        <p class="m-note">${r ? `Team average for yesterday, from ${r.n} answers.` : "Count yesterday’s cups and glasses with the + and − buttons."}</p>
      </div>`;
    case "stare":
      return `<div class="m-stare">
        <svg viewBox="0 0 300 300" width="250" height="250" aria-hidden="true">
          <circle cx="150" cy="150" r="132" style="fill: var(--panel2)"/>
          <circle cx="150" cy="150" r="104" style="stroke: var(--line)" stroke-width="2" fill="none"/>
          <circle cx="150" cy="150" r="74" style="stroke: var(--line)" stroke-width="2" fill="none"/>
          <circle cx="150" cy="150" r="44" style="stroke: var(--line)" stroke-width="2" fill="none"/>
          <circle cx="150" cy="150" r="140" style="stroke: var(--line)" stroke-width="6" fill="none"/>
          <circle class="pulse-host" cx="150" cy="150" r="12" style="fill: var(--accent)"/>
          <circle cx="150" cy="150" r="10" style="fill: var(--accent)"/>
        </svg>
        ${r ? `<div class="m-big-avg"><b>${f1(r.avg)} s</b><span>team average before the first blink</span><span class="n">from ${r.n} answers</span></div>`
          : `<ol class="m-steps"><li>Stare at the dot on your phone.</li><li>Tap the moment you blink.</li><li>Then look at something 6 m away for 20 seconds.</li></ol>`}
      </div>`;
    case "verdict":
      if (r) {
        return `<div class="m-verdict">
          <div class="m-avg-line"><b>${f1(r.avg)}</b><small>/ 10 · team average</small></div>
          <div class="m-hist">${r.hist.map((c, i) => `<div class="col${c === r.max && c > 0 ? " lead" : ""}"><small>${c || ""}</small><i style="height: ${r.max ? Math.round(c / r.max * 92) : 0}px"></i><span class="m-num">${i}</span></div>`).join("")}</div>
          <div class="m-scale-ends"><span>${esc(VERDICT_NOTES[0])}</span><span>${esc(VERDICT_NOTES[10])}</span></div>
        </div>`;
      }
      return `<div class="m-scale">${VERDICT_NOTES.map((_, i) => `<span class="m-num">${i}</span>`).join("")}</div>
        <div class="m-scale-ends"><span>${esc(VERDICT_NOTES[0])}</span><span>${esc(VERDICT_NOTES[10])}</span></div>`;
    default:
      return "";
  }
}

/* The card screen's frame. Before the answers are shown, the card itself sits in #play and works
   like a phone's (app.js mounts it), so the presenter can play along on the shared screen. */
export function questionFrame(index, shown) {
  const card = CARDS[index];
  const kind = card.kind === "options" ? card.layout : card.kind;
  return `
  <div class="slide game mirror">
    ${slot("status")}
    <div class="q-top">
      <span class="mono-cap">Card ${String(index + 1).padStart(2, "0")} / ${CARDS.length}</span>
      <span class="q-segs">${CARDS.map((_, j) => `<i class="${j < index ? "done" : j === index ? "now" : ""}"></i>`).join("")}</span>
    </div>
    <div class="q-grid">
      <div class="q-main">
        <h2 class="h">${esc(card.title)}</h2>
        <p class="q-sub">${esc(card.sub)}</p>
        ${shown ? slot("results", "div", `class="q-visual"`) : `<div class="q-visual"><div class="play k-${kind}" id="play"></div></div>`}
      </div>
      ${slot("side", "div", `class="q-side"`)}
    </div>
    ${slot("moment", "div", `class="q-moment"`)}
  </div>`;
}

/* Live: the results, once shown (never below the minimum group) */
export function questionResults(index, stats) {
  const card = CARDS[index], r = results(card, stats);
  return `${r.wait ? `<span class="q-wait">Counts appear once ${config.minGroup} people have answered, to keep answers anonymous. ${r.n} so far.</span>` : ""}${cardVisual(card, r.wait ? null : r)}`;
}

/* Live: how many have answered, and a window per player that lights up when they have */
export function questionSide(index, stats, players, shown) {
  const card = CARDS[index];
  const joined = stats.joined;
  const n = stats.answered[card.key] || 0;
  const all = joined > 0 && n >= joined;
  const R = 70, CIRC = 2 * Math.PI * R, share = joined ? Math.min(1, n / joined) : 0;
  const rooms = Object.values(players).slice(0, 28).map(p => {
    const [fill, glow] = roomColours(p.answers?.light);
    const done = p.answers && p.answers[card.key] !== undefined;
    return `<span class="room${done ? " in" : ""}" style="background: ${fill}; box-shadow: inset 0 0 14px ${glow}"></span>`;
  }).join("");
  return `
    <div class="q-count${all ? " all" : ""}">
      <svg viewBox="0 0 170 170" width="170" height="170" aria-hidden="true">
        <circle cx="85" cy="85" r="${R}" fill="none" stroke="${C.line2}" stroke-width="12"/>
        <circle cx="85" cy="85" r="${R}" fill="none" stroke="${all ? C.good : C.acc}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${CIRC.toFixed(1)}" stroke-dashoffset="${(CIRC * (1 - share)).toFixed(1)}" transform="rotate(-90 85 85)" style="transition: stroke-dashoffset 0.4s ease"/>
      </svg>
      <span class="q-num"><b>${n}</b><small>of ${joined}</small></span>
    </div>
    <span class="q-label">${all ? "Everyone has answered" : "answered"}${shown ? "<br>Only totals are shown" : ""}</span>
    ${rooms ? `<div class="rooms">${rooms}</div>` : ""}`;
}

export const questionMoment = feed => (feed[0] ? `<span class="mono-cap">From the check-up</span><span>${esc(feed[0])}</span>` : "");

/* ---------- Wrap-up: reports are on the phones ---------- */
export function wrapScreen({ reports, feed, status }) {
  const moments = feed.slice(0, 6);
  return `
  <div class="slide game">
    ${statusChip(status)}
    <div class="s-body" style="display: grid; grid-template-columns: minmax(0, 1fr) 470px; gap: 48px; align-items: center">
      <div style="display: flex; flex-direction: column; gap: 22px">
        <h2 class="h">Your report is on your phone</h2>
        <p style="margin: 0; font-size: 24px; line-height: 1.4; color: ${C.sub}; max-width: 560px">Only you can see yours. The team’s totals come up in the next few slides.</p>
        <div style="display: flex; align-items: baseline; gap: 14px">
          <span style="font-family: var(--mono); font-size: 56px; font-weight: 500; color: ${C.accText}; line-height: 1">${reports}</span>
          <span style="font-size: 22px; color: ${C.sub}">reports sent</span>
        </div>
      </div>
      <div style="display: flex; flex-direction: column; gap: 10px; position: relative">
        <span style="font-size: var(--t-label); font-weight: 700">From the check-up</span>
        ${moments.map(f => `<div class="feed-item"><span style="font-size: var(--t-label); line-height: 1.35">${esc(f)}</span></div>`).join("") || `<span class="wait">Moments from the game show up here. No names attached.</span>`}
      </div>
    </div>
  </div>`;
}

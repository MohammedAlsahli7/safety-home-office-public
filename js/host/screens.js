/* Presenter screens for the game: join (QR), one screen per card while phones answer it,
   and the wrap-up when reports land on the phones. The buttons live in a separate control
   bar (app.js), so live updates here never swallow a click. */
import { CARDS, POSES, VERDICT_NOTES } from "../content.js";
import { skeletonSVG } from "../skeleton.js";
import { TILE_ART, ROUTES, standRing, newsPhone, cupTower, waterGlass } from "../phone/art.js";
import { C, esc, lamp, qrSVG, roomColours } from "./parts.js";

export const statusChip = status => `<span class="status" data-s="${status}"><i></i>${{ live: "Live", connecting: "Connecting", reconnecting: "Reconnecting", offline: "Offline", idle: "Starting" }[status] || status}</span>`;

/* ---------- Join ---------- */
export function joinScreen({ url, players, status, newest }) {
  const list = Object.values(players);
  const names = list.slice(-24).map(p => `<span class="name-chip${p === newest ? " new" : ""}">${esc(p.nick)}</span>`).join("");
  return `
  <div class="slide game">
    ${statusChip(status)}
    ${lamp("lj", 210, 330)}
    <div class="s-body" style="display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: 56px">
      <div style="display: flex; flex-direction: column; justify-content: center; gap: 22px">
        <h1 style="margin: 0; font-size: 104px; line-height: 0.84; font-weight: 800; font-stretch: 62%; text-transform: uppercase">Home office<br>check-up</h1>
        <p style="margin: 0; font-size: 24px; line-height: 1.4; color: ${C.sub}; max-width: 560px">Scan, pull the lamp cord, and wait for the first card. Eleven quick ones, on your phone, anonymous.</p>
        <div style="display: flex; align-items: baseline; gap: 14px">
          <span style="font-family: var(--mono); font-size: 56px; font-weight: 500; color: ${C.accText}; line-height: 1">${list.length}</span>
          <span style="font-size: 22px; color: ${C.sub}">joined</span>
        </div>
        <div class="names-row" style="max-height: 92px; overflow: hidden">${names}</div>
      </div>
      <div style="display: flex; flex-direction: column; justify-content: center">
        <div class="qr-card">
          ${qrSVG(url, 290)}
          <span style="font-size: 28px; font-weight: 800; font-stretch: 80%">Scan to play</span>
          <span style="font-family: var(--mono); font-size: 12px; color: ${C.muted}; text-align: center; word-break: break-all">${esc(url.replace(/^https?:\/\//, ""))}</span>
        </div>
      </div>
    </div>
  </div>`;
}

/* ---------- One card while phones answer it ---------- */
const pick = (o, cls = "") => `<div class="m-pick ${cls}"><span class="t">${esc(o.label)}</span><span class="n">${esc(o.note)}</span></div>`;

function cardVisual(card) {
  const kind = card.kind === "options" ? card.layout : card.kind;
  switch (kind) {
    case "tiles":
      return `<div class="m-tiles">${card.options.map(o => `<div class="m-tile"><span class="pic">${TILE_ART[card.key][o.v]}</span><span class="t">${esc(o.label)}</span><span class="n">${esc(o.note)}</span></div>`).join("")}</div>`;
    case "routes":
      return `<div class="m-routes">${card.options.map(o => `<div class="m-route"><span class="txt"><span class="t">${esc(o.label)}</span><span class="n">${esc(o.note)}</span></span><span class="icons">${ROUTES[o.v]}</span></div>`).join("")}</div>`;
    case "stand":
      return `<div class="m-split"><div class="m-ring">${standRing(0.5, 210)}</div><div class="m-grid2">${card.options.map(o => pick(o)).join("")}</div></div>`;
    case "news":
      return `<div class="m-split"><div class="m-news">${newsPhone(card.options[2])}</div><div class="m-grid2">${card.options.map(o => pick(o)).join("")}</div></div>`;
    case "dial":
      return `<div class="m-poses">${POSES.map((name, i) => `<div class="m-pose"><span class="xray">${skeletonSVG(i / 3, { w: 132, h: 165, ink: C.bone, sub: C.boneSub })}</span><span class="t">${name}</span></div>`).join("")}</div>`;
    case "fuel":
      return `<div class="m-fuel">
        <div class="m-fuel-col"><div class="fuel-scene coffee"><div class="tower">${cupTower(4)}</div></div><span class="t">Coffee, qahwa, karak</span></div>
        <div class="m-fuel-col"><div class="fuel-scene water">${waterGlass(2, "hostGlass")}</div><span class="t">Water</span></div>
        <p class="m-note">Count yesterday’s cups and glasses with the + and − buttons.</p>
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
        <ol class="m-steps"><li>Stare at the dot on your phone.</li><li>Tap the moment you blink.</li><li>Then look at something 6 m away for 20 seconds.</li></ol>
      </div>`;
    case "verdict":
      return `<div class="m-scale">${VERDICT_NOTES.map((_, i) => `<span class="m-num">${i}</span>`).join("")}</div>
        <div class="m-scale-ends"><span>${esc(VERDICT_NOTES[0])}</span><span>${esc(VERDICT_NOTES[10])}</span></div>`;
    default:
      return "";
  }
}

export function questionScreen({ index, stats, players, feed, status }) {
  const card = CARDS[index];
  const total = CARDS.length;
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
  <div class="slide game mirror">
    ${statusChip(status)}
    <div class="q-top">
      <span class="mono-cap">Card ${String(index + 1).padStart(2, "0")} / ${total}</span>
      <span class="q-segs">${CARDS.map((_, j) => `<i class="${j < index ? "done" : j === index ? "now" : ""}"></i>`).join("")}</span>
    </div>
    <div class="q-grid">
      <div class="q-main">
        <h2 class="h" style="font-size: ${card.title.length > 26 ? 64 : 76}px">${esc(card.title)}</h2>
        <p class="q-sub">${esc(card.sub)}</p>
        <div class="q-visual">${cardVisual(card)}</div>
      </div>
      <div class="q-side">
        <div class="q-count${all ? " all" : ""}">
          <svg viewBox="0 0 170 170" width="170" height="170" aria-hidden="true">
            <circle cx="85" cy="85" r="${R}" fill="none" stroke="${C.line2}" stroke-width="12"/>
            <circle cx="85" cy="85" r="${R}" fill="none" stroke="${all ? C.good : C.acc}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${CIRC.toFixed(1)}" stroke-dashoffset="${(CIRC * (1 - share)).toFixed(1)}" transform="rotate(-90 85 85)" style="transition: stroke-dashoffset 0.4s ease"/>
          </svg>
          <span class="q-num"><b>${n}</b><small>of ${joined}</small></span>
        </div>
        <span class="q-label">${all ? "Everyone has answered" : "answered on their phones"}</span>
        ${rooms ? `<div class="rooms">${rooms}</div>` : ""}
      </div>
    </div>
    <div class="q-moment">${feed[0] ? `<span class="mono-cap">From the check-up</span><span>${esc(feed[0])}</span>` : ""}</div>
  </div>`;
}

/* ---------- Wrap-up: reports are on the phones ---------- */
export function wrapScreen({ stats, feed, status }) {
  const moments = feed.slice(0, 6);
  return `
  <div class="slide game">
    ${statusChip(status)}
    <div class="s-body" style="display: grid; grid-template-columns: minmax(0, 1fr) 470px; gap: 48px; align-items: center">
      <div style="display: flex; flex-direction: column; gap: 22px">
        <h2 class="h" style="font-size: 96px">Your report is on your phone</h2>
        <p style="margin: 0; font-size: 24px; line-height: 1.4; color: ${C.sub}; max-width: 560px">Only you can see yours. The team’s totals come up in the next few slides.</p>
        <div style="display: flex; align-items: baseline; gap: 14px">
          <span style="font-family: var(--mono); font-size: 56px; font-weight: 500; color: ${C.accText}; line-height: 1">${stats.done}</span>
          <span style="font-size: 22px; color: ${C.sub}">reports sent</span>
        </div>
      </div>
      <div style="display: flex; flex-direction: column; gap: 10px; position: relative">
        <span style="font-size: 18px; font-weight: 700">From the check-up</span>
        ${moments.map(f => `<div class="feed-item"><span style="font-size: 18px; line-height: 1.35">${esc(f)}</span></div>`).join("") || `<span class="wait">Moments from the game show up here. No names attached.</span>`}
      </div>
    </div>
  </div>`;
}

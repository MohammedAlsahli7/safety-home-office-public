/* Presenter screens shown during the game: join (QR) and live (rooms + moments). */
import { CARDS } from "../content.js";
import { C, esc, lamp, qrSVG, roomColours } from "./parts.js";

const statusChip = status => `<span class="status" data-s="${status}"><i></i>${{ live: "Live", connecting: "Connecting", reconnecting: "Reconnecting", offline: "Offline", idle: "Starting" }[status] || status}</span>`;

export function joinScreen({ url, players, status, newest }) {
  const list = Object.values(players);
  const names = list.slice(-24).map(p => `<span class="name-chip${p === newest ? " new" : ""}">${esc(p.nick)}</span>`).join("");
  return `
  <div class="slide">
    ${statusChip(status)}
    ${lamp("lj", 210, 330)}
    <div class="s-body" style="display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: 56px">
      <div style="display: flex; flex-direction: column; justify-content: center; gap: 24px">
        <h1 style="margin: 0; font-size: 104px; line-height: 0.84; font-weight: 800; font-stretch: 62%; text-transform: uppercase">Home office<br>check-up</h1>
        <p style="margin: 0; font-size: 24px; line-height: 1.4; color: ${C.sub}; max-width: 560px">Scan, pull the lamp cord, play 11 quick cards. About 3 minutes, on your phone, anonymous.</p>
        <div style="display: flex; align-items: baseline; gap: 14px">
          <span style="font-family: var(--mono); font-size: 56px; font-weight: 500; color: ${C.accText}; line-height: 1">${list.length}</span>
          <span style="font-size: 22px; color: ${C.sub}">joined</span>
        </div>
        <div class="names-row" style="max-height: 100px; overflow: hidden">${names}</div>
      </div>
      <div style="display: flex; flex-direction: column; justify-content: center">
        <div class="qr-card">
          ${qrSVG(url, 300)}
          <span style="font-size: 28px; font-weight: 800; font-stretch: 80%">Scan to play</span>
          <span style="font-family: var(--mono); font-size: 12px; color: ${C.muted}; text-align: center; word-break: break-all">${esc(url.replace(/^https?:\/\//, ""))}</span>
        </div>
      </div>
    </div>
  </div>`;
}

export function liveScreen({ stats, feed, status, url }) {
  const total = CARDS.length;
  const windows = stats.progress.map(p => {
    const [fill, glow] = roomColours(p.light);
    return `
      <div style="display: flex; flex-direction: column; gap: 6px; min-width: 0">
        <span class="window" style="background: ${fill}; box-shadow: inset 0 0 22px ${glow}, 0 0 18px ${glow}"></span>
        <span style="font-family: var(--mono); font-size: 12px; color: ${C.sub}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${esc(p.nick)}</span>
        <span class="track" style="height: 5px"><i style="width: ${Math.round(p.card / total * 100)}%; background: ${p.done ? C.acc : C.grey}"></i></span>
      </div>`;
  }).join("");
  const pct = stats.joined ? stats.done / stats.joined * 100 : 0;
  return `
  <div class="slide">
    ${statusChip(status)}
    <div class="s-body" style="display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 40px">
      <div style="display: flex; flex-direction: column; gap: 18px; min-width: 0">
        <h2 class="h" style="font-size: 72px">Playing now</h2>
        <p style="margin: 0; font-size: 19px; color: ${C.sub}">Each window is one player’s room, lit the way they set it. The bar is how far they’ve got.</p>
        <div style="display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 16px 14px; align-content: start; overflow: hidden">${windows || `<span class="wait" style="grid-column: span 7">Waiting for the first player…</span>`}</div>
      </div>
      <div style="display: flex; flex-direction: column; gap: 12px; min-width: 0">
        <span style="font-size: 18px; font-weight: 700">From the check-up</span>
        ${feed.slice(0, 6).map(f => `<div class="feed-item"><span style="font-size: 17px; line-height: 1.35">${esc(f)}</span></div>`).join("") || `<span class="wait">Moments appear here as people play. No names attached.</span>`}
      </div>
    </div>
    <div style="display: flex; align-items: center; gap: 22px; padding-top: 14px; border-top: 1px solid ${C.line}">
      <span style="display: flex; align-items: baseline; gap: 8px"><span style="font-family: var(--mono); font-size: 34px; font-weight: 500; color: ${C.accText}">${stats.done}</span><span style="font-size: 17px; color: ${C.sub}">of ${stats.joined} done</span></span>
      <span class="track" style="flex: 1; height: 10px"><i style="width: ${pct.toFixed(0)}%; background: ${C.acc}"></i></span>
      <span style="font-size: 15px; color: ${C.muted}">Press → for the talk · late joiners: ${esc(url.replace(/^https?:\/\//, ""))}</span>
    </div>
  </div>`;
}

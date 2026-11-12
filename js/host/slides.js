/* The presentation: 10 slides, the last 7 drawn from live team stats. Sizes follow the type scale in
   host.css (--t-hero … --t-tick). Each slide may name a `stage`,
   which tells every phone to show a confession or the closing vote while it is on screen. */
import { loadKpis, SAFETY_LABELS } from "../kpis.js";
import { CONFESSIONS, HABITS, POSES } from "../content.js";
import { skeletonSVG } from "../skeleton.js";
import { C, f1, esc, enough, PHONE, callout, share, confess, lamp, qrSVG } from "./parts.js";

const COWORKER = { cat: "The cat", kids: "The kids", door: "The doorbell", chat: "The family group chat" };
const num = (i, total) => `<span class="s-num">${i} / ${total}</span>`;
/* A one-line footnote at the bottom of a slide, short names only; full references are on slide 11 */
const foot = (...n) => `<span class="s-foot">Sources: ${n.map(i => esc(SOURCES.flatMap(g => g[1]).at(i - 1)[0])).join(" · ")}</span>`;
const dash = v => (v === null || v === undefined || v === "" ? "—" : v);

/* ---------- KPI slides: figures come from the presenter tools, never from the code ---------- */
const TICK = size => `<svg width="${size}" height="${size}" viewBox="0 0 30 30" aria-label="zero"><circle cx="15" cy="15" r="13" fill="none" stroke="${C.good}" stroke-width="2.5"/><path d="M9 15.5 L13.5 20 L21.5 11" fill="none" stroke="${C.good}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const kpiEmpty = what => `<div class="panel" style="flex: 1; display: grid; place-items: center"><span class="wait" style="font-size: 22px">Add the ${what} in the presenter tools (P).</span></div>`;
const kpiHead = (title, sub) => `
  <div style="display: flex; align-items: baseline; justify-content: space-between; gap: 20px">
    <h2 class="h" style="white-space: nowrap">${esc(title)}</h2>${sub ? `<span style="font-size: var(--t-body); color: ${C.sub}; text-align: right">${esc(sub)}</span>` : ""}
  </div>`;
const HATCH = `repeating-linear-gradient(135deg, ${C.acc} 0 4px, ${C.tint} 4px 9px)`;

/* 1 · Safety courses: complete, still open, or the rest already enrolled */
function kpiCourses(n, total) {
  const k = loadKpis();
  const anyEnrolled = k.courses.some(c => c.enrolledRest);
  const row = c => {
    const done = c.pct === 100, p = c.pct ?? 0;
    return `
    <div style="display: flex; flex-direction: column; gap: 6px">
      <div style="display: grid; grid-template-columns: 300px minmax(0, 1fr) 120px; gap: 22px; align-items: center">
        <span style="font-size: 28px; line-height: 1.1; font-weight: 600; font-stretch: 85%">${esc(c.name)}</span>
        <span class="track" style="height: 22px; display: flex"><i style="width: ${p}%; background: ${done ? C.good : C.acc}; border-radius: ${c.enrolledRest ? "4px 0 0 4px" : "4px"}"></i>${c.enrolledRest && !done ? `<i style="width: ${100 - p}%; background: ${HATCH}; border-radius: 0 4px 4px 0"></i>` : ""}</span>
        <span style="font-family: var(--mono); font-size: var(--t-num); font-weight: 500; text-align: right">${c.pct === null ? "—" : `${c.pct}%`}</span>
      </div>
      ${c.note ? `<span style="margin-left: 322px; font-size: var(--t-label); color: ${C.tintInk}">${esc(c.note)}</span>` : ""}
    </div>`;
  };
  return `
  <div class="slide">
    <div class="s-body" style="gap: 22px">
      ${kpiHead(k.coursesTitle || "Safety courses", k.period ? `Completion · ${k.period}` : "Completion")}
      ${k.courses.length ? `
      <div class="panel" style="flex: 1; display: flex; flex-direction: column; justify-content: space-around; padding: 18px 34px">${k.courses.map(row).join("")}</div>
      <div style="display: flex; gap: 26px; font-size: var(--t-label); color: ${C.sub}">
        <span><span style="color: ${C.good}">■</span> complete</span>
        <span><span style="color: ${C.acc}">■</span> in progress</span>
        ${anyEnrolled ? `<span style="display: inline-flex; align-items: center; gap: 6px"><i style="display: inline-block; width: 26px; height: 14px; border-radius: 3px; background: ${HATCH}"></i> enrolled in upcoming sessions</span>` : ""}
      </div>` : kpiEmpty("course figures")}
    </div>
    ${num(n, total)}
  </div>`;
}

/* 2 · Phishing test: the monthly log, the failures row, and the departments */
function kpiPhishing(n, total) {
  const ph = loadKpis().phishing;
  const m = ph.months;
  const depts = ph.departments.slice().sort((a, b) => (b[1] ?? -1) - (a[1] ?? -1));
  if (!m.length && !depts.length) {
    return `<div class="slide"><div class="s-body" style="gap: 22px">${kpiHead(ph.title, "")}${kpiEmpty("phishing figures")}</div>${num(n, total)}</div>`;
  }
  /* Monthly chart: passed and neutral as labelled lines on one honest 0-based axis */
  const W = 720, H = 250, top = 28, base = 214, x0 = 30, x1 = W - 30;
  const max = Math.max(100, ...m.map(r => Math.max(r.passed ?? 0, r.neutral ?? 0)));
  const yMax = Math.ceil(max / 100) * 100;
  const X = i => (m.length > 1 ? x0 + i * (x1 - x0) / (m.length - 1) : (x0 + x1) / 2);
  const Y = v => base - (v / yMax) * (base - top);
  const line = (key, color) => {
    const pts = m.map((r, i) => r[key] === null ? null : [X(i), Y(r[key])]).filter(Boolean);
    return `<path d="${pts.map((p, i) => `${i ? "L" : "M"}${f1(p[0])} ${f1(p[1])}`).join(" ")}" fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
      ${m.map((r, i) => r[key] === null ? "" : `<circle cx="${f1(X(i))}" cy="${f1(Y(r[key]))}" r="4.5" fill="${color}"/><text x="${f1(X(i))}" y="${f1(Y(r[key]) - 11)}" text-anchor="middle" fill="${C.ink}" style="font-family: 'IBM Plex Mono', monospace; font-size: 16px">${r[key]}</text>`).join("")}`;
  };
  const chart = m.length ? `
    <svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Passed and neutral results per month">
      <line x1="${x0 - 10}" y1="${base}" x2="${x1 + 10}" y2="${base}" stroke="${C.line}" stroke-width="1.5"/>
      ${line("passed", C.good)}${line("neutral", C.grey)}
      ${m.map((r, i) => `<text x="${f1(X(i))}" y="${base + 26}" text-anchor="middle" fill="${C.muted}" style="font-family: 'IBM Plex Mono', monospace; font-size: 16px">${esc(r.label)}</text>`).join("")}
    </svg>` : "";
  const fails = m.length ? `
    <div style="display: flex; flex-direction: column; gap: 8px">
      <span class="chart-label">Failures (negative) per month</span>
      <div style="display: grid; grid-template-columns: repeat(${m.length}, minmax(0, 1fr)); gap: 8px">
        ${m.map(r => {
          const zero = r.negative === 0;
          return `<span style="display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 8px 0; border-radius: 10px; background: ${zero ? "#E3F1EA" : r.negative === null ? C.panel2 : C.tint}">
            <span style="font-family: var(--mono); font-size: 26px; font-weight: 500; line-height: 1; color: ${zero ? C.good : C.accText}">${r.negative ?? "—"}</span>
            <span style="font-family: var(--mono); font-size: 14px; color: ${C.muted}">${esc(r.label)}</span>
          </span>`;
        }).join("")}
      </div>
    </div>` : "";
  const deptRows = depts.map(([name, v]) => {
    const us = name === ph.team;
    return `<div style="display: grid; grid-template-columns: 104px minmax(0, 1fr) 76px; gap: 10px; align-items: center">
      <span style="font-size: var(--t-label); font-weight: ${us ? 800 : 500}; ${us ? `color: ${C.accText}` : ""}">${esc(name)}</span>
      <span class="track" style="height: 12px"><i style="width: ${v ?? 0}%; background: ${us ? C.acc : C.grey}"></i></span>
      <span style="font-family: var(--mono); font-size: 18px; text-align: right; ${us ? `font-weight: 500; color: ${C.accText}` : ""}">${v === null ? "—" : v.toFixed(1) + "%"}</span>
    </div>`;
  }).join("");
  const sub = [ph.scope, ph.range].filter(Boolean).join(" · ");
  /* The month's headline numbers, as on the report: negative, passed, neutral */
  const last = m[m.length - 1];
  const statCard = (v, label, color, mark) => `
    <div class="panel" style="flex: 1; display: flex; align-items: center; gap: 16px; padding: 12px 22px">
      <span style="font-size: 64px; font-weight: 800; font-stretch: 68%; line-height: 0.9; color: ${color}">${v ?? "—"}</span>
      <span style="display: flex; flex-direction: column; gap: 2px"><span style="font-size: 24px; font-weight: 700; font-stretch: 85%">${label}</span><span style="font-size: var(--t-tick); color: ${C.sub}">${esc(last.label === "Sep" && ph.period ? ph.period : last.label)}</span></span>
      ${mark || ""}
    </div>`;
  const stats = last ? `
    <div style="display: flex; gap: 16px">
      ${statCard(last.negative, "Negative", last.negative === 0 ? C.good : C.accText, last.negative === 0 ? `<span style="margin-left: auto">${TICK(30)}</span>` : "")}
      ${statCard(last.passed, "Passed", C.good)}
      ${statCard(last.neutral, "Neutral", C.ink)}
    </div>` : "";
  return `
  <div class="slide">
    <div class="s-body" style="gap: 14px">
      ${kpiHead(ph.title, sub)}
      ${stats}
      <div style="flex: 1; display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 20px; min-height: 0">
        <div class="panel" style="display: flex; flex-direction: column; gap: 10px; padding: 16px 24px">
          <div style="display: flex; justify-content: space-between; align-items: baseline">
            <span class="chart-label">Monthly results</span>
            <span style="display: flex; gap: 18px; font-size: var(--t-tick); color: ${C.sub}"><span><span style="color: ${C.good}">●</span> passed</span><span><span style="color: ${C.grey}">●</span> neutral</span></span>
          </div>
          ${chart}
          ${fails}
        </div>
        ${depts.length ? `<div class="panel" style="display: flex; flex-direction: column; gap: 10px; padding: 16px 20px">
          <span class="chart-label">Positive response${ph.period ? ` · ${esc(ph.period)}` : ""}</span>
          <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-around">${deptRows}</div>
        </div>` : ""}
      </div>
    </div>
    ${num(n, total)}
  </div>`;
}

/* 3 · Incidents and violations: the big zero */
const ICONS = {
  home: `<path d="M5 23 L24 7 L43 23"/><path d="M10 19 V42 H38 V19"/><path d="M19 42 V30 H29 V42"/>`,
  car: `<path d="M3 33 V25 L10 13 H38 L45 25 V33 Z"/><circle cx="13" cy="35" r="4.5"/><circle cx="35" cy="35" r="4.5"/><path d="M10 23 H38"/>`,
  clock: `<circle cx="24" cy="25" r="15"/><path d="M24 16 V25 L31 29"/><path d="M19 6 H29"/>`,
  aid: `<rect x="8" y="14" width="32" height="24" rx="4"/><path d="M18 14 V9 H30 V14 M24 21 V31 M19 26 H29"/>`,
  light: `<rect x="17" y="5" width="14" height="34" rx="5"/><circle cx="24" cy="13" r="3"/><circle cx="24" cy="22" r="3"/><circle cx="24" cy="31" r="3"/><path d="M24 39 V44"/>`,
  ticket: `<path d="M9 8 H39 V40 L34 36 L29 40 L24 36 L19 40 L14 36 L9 40 Z"/><path d="M16 17 H32 M16 24 H32 M16 31 H26"/>`
};
const icon = name => `<svg width="44" height="44" viewBox="0 0 48 48" aria-hidden="true" style="flex: none" fill="none" stroke="${C.accText}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;

function kpiIncidents(n, total) {
  const k = loadKpis();
  const vals = k.safety;
  const sum = vals.every(v => v !== null) ? vals.reduce((a, v) => a + v, 0) : null;
  const zero = sum === 0;
  /* Fixed geometry so the bubble tails aim at the zero: grid 1152 x 470, centre column 330 */
  const GW = 1152, GH = 470, COL = 360, CARD_GAP = 14, MID = GW - 2 * COL;
  const cardH = (GH - 2 * CARD_GAP) / 3;
  const cx = GW / 2, cy = GH / 2, R = 150;
  const rows = [0, 1, 2].map(i => cardH / 2 + i * (cardH + CARD_GAP));
  /* Each card is a speech bubble whose tail points at the shared zero */
  const tail = (x, y) => {
    const dx = cx - x, dy = cy - y, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
    const reach = Math.min(len - R - 16, 56);
    const side = Math.sign(dx), tipX = x + ux * reach, tipY = y + uy * reach;
    const a = [x - side * 2, y - 14], b = [x - side * 2, y + 14];
    return `<path d="M${f1(a[0])} ${f1(a[1])} L${f1(tipX)} ${f1(tipY)} L${f1(b[0])} ${f1(b[1])} Z" fill="${C.panel}"/>
      <path d="M${f1(x)} ${f1(a[1])} L${f1(tipX)} ${f1(tipY)} L${f1(x)} ${f1(b[1])}" fill="none" stroke="${C.line2}" stroke-width="1" stroke-linejoin="round"/>`;
  };
  const card = (i, side) => {
    const l = SAFETY_LABELS[i], v = vals[i];
    const flag = v !== null && v !== 0
      ? `<span style="margin-${side === "left" ? "left" : "right"}: auto; font-size: 40px; font-weight: 800; font-stretch: 70%; color: ${C.accText}">${v}</span>` : "";
    return `
    <div class="panel" style="height: ${f1(cardH)}px; display: flex; align-items: center; gap: 18px; padding: 10px 24px">
      ${icon(l.icon)}
      <span style="font-size: 24px; line-height: 1.2">${esc(l.label)}${l.short ? ` <span style="color: ${C.sub}; white-space: nowrap">(${esc(l.short)})</span>` : ""}</span>
      ${flag}
    </div>`;
  };
  return `
  <div class="slide">
    <div class="s-body" style="gap: 14px">
      ${kpiHead(k.safetyTitle || "Incidents and violations", "Incidents and violations")}
      <div style="position: relative; width: ${GW}px; height: ${GH}px">
        <div style="position: absolute; left: 0; top: 0; width: ${f1(COL)}px; display: flex; flex-direction: column; gap: ${CARD_GAP}px">${[0, 1, 2].map(i => card(i, "left")).join("")}</div>
        <div style="position: absolute; right: 0; top: 0; width: ${f1(COL)}px; display: flex; flex-direction: column; gap: ${CARD_GAP}px">${[3, 4, 5].map(i => card(i, "right")).join("")}</div>
        <svg viewBox="0 0 ${GW} ${GH}" width="${GW}" height="${GH}" aria-hidden="true" style="position: absolute; inset: 0; pointer-events: none">
          <circle cx="${cx}" cy="${cy}" r="${R}" fill="${C.panel}" stroke="${C.line2}" stroke-width="1"/>
          ${rows.map(y => tail(COL, y)).join("")}
          ${rows.map(y => tail(GW - COL, y)).join("")}
        </svg>
        <div class="big-zero" style="position: absolute; left: ${cx - R}px; top: ${cy - R}px; width: ${2 * R}px; height: ${2 * R}px; display: grid; place-items: center">
          <span style="font-size: 320px; font-weight: 800; font-stretch: 62%; line-height: 0.8; color: ${zero ? C.good : C.ink}; transform: translateY(6px)">${sum === null ? "—" : sum}</span>
        </div>
      </div>
      <div style="text-align: center; font-size: var(--t-body); color: ${C.sub}">${zero ? "Zero across all six. Let’s keep it that way." : ""}</div>
    </div>
    ${num(n, total)}
  </div>`;
}

/* ---------- 2 · Title ---------- */
function title(n, total, s) {
  return `
  <div class="slide">
    ${lamp("l1", 210, 150)}
    <div class="s-body" style="justify-content: center; max-width: 760px; gap: 28px">
      <h1 class="h">Uncertain times show up in the body</h1>
      <div style="display: flex; gap: 12px">
        ${["Attention", "Hours", "Body"].map((x, i) => `<span style="display: flex; align-items: center; gap: 10px; padding: 10px 18px 10px 10px; border-radius: 999px; border: 1.5px solid ${C.line}; background: ${C.panel}; font-size: 20px; font-weight: 600"><span style="display: grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; background: ${C.acc}; color: #fff; font-family: var(--mono); font-size: 14px; font-weight: 500">${i + 1}</span>${x}</span>`).join("")}
      </div>
      <div style="max-width: 640px; display: flex; flex-direction: column; gap: 12px">
        ${callout(s.done, "of us played this morning. Only team totals appear here.")}
        <span style="font-size: var(--t-body); color: ${C.sub}">Keep the page open on your phone. Three quick confessions are coming.</span>
      </div>
    </div>
    ${num(n, total)}
  </div>`;
}

/* ---------- 3 · Attention ---------- */
function attention(n, total, s) {
  return `
  <div class="slide">
    <div class="s-body" style="gap: 48px; justify-content: center">
      <div class="lead-fix"><h2 class="h">Mute the news alerts. Check the news when you choose.</h2><p class="why">Every alert puts you back on edge.</p></div>
      <div style="display: grid; grid-template-columns: minmax(0, 1fr) 500px; gap: 40px; align-items: stretch">
        <div class="panel" style="display: flex; flex-direction: column; justify-content: space-between; gap: 18px; padding: 22px 26px">
          <span class="chart-label">Stress, out of 10</span>
          <div style="display: grid; grid-template-columns: 280px minmax(0, 1fr) 64px; gap: 16px; align-items: center">
            <span style="font-size: var(--t-body); line-height: 1.25">Constantly check email, texts and social media</span>
            <span class="track" style="height: 22px"><i style="width: 53%; background: ${C.acc}"></i></span>
            <b style="font-family: var(--mono); font-size: var(--t-num); font-weight: 500; color: ${C.accText}">5.3</b>
            <span style="font-size: var(--t-body); color: ${C.sub}">Check less often</span>
            <span class="track" style="height: 22px"><i style="width: 44%; background: ${C.grey}"></i></span>
            <b style="font-family: var(--mono); font-size: var(--t-num); font-weight: 500">4.4</b>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; justify-content: space-between; gap: 14px; min-width: 0">
          ${share(s.news.always, s.news.n, "get every news alert", "big-c")}
          ${confess(CONFESSIONS.c1, s.confess.c1)}
        </div>
      </div>
    </div>
    ${foot(1, 2, 3)}
    ${num(n, total)}
  </div>`;
}

/* ---------- 4 · Hours ---------- */
function hours(n, total, s) {
  const X = h => 24 + (h - 5) * (1104 / 15);
  const label = h => (h === 12 ? "12pm" : h > 12 ? `${h - 12}pm` : `${h}am`);
  let ticks = "";
  for (let h = 5; h <= 20; h++) {
    const strong = h === 7 || h === 16;
    ticks += `<line x1="${f1(X(h))}" y1="138" x2="${f1(X(h))}" y2="146" stroke="${C.deco}" stroke-width="1.5"/><text x="${f1(X(h))}" y="168" text-anchor="middle" fill="${strong ? C.ink : C.muted}" style="font-family: 'IBM Plex Mono', monospace; font-size: 16px; font-weight: ${strong ? 500 : 400}">${label(h)}</text>`;
  }
  return `
  <div class="slide">
    <div class="s-body" style="gap: 34px; justify-content: center">
      <div class="lead-fix"><h2 class="h">Close the laptop after work.<br>Put it out of sight.</h2><p class="why">At home, the office has no door, so the workday leaks at both ends.</p></div>
      <svg viewBox="0 0 1152 178" width="1152" height="178" role="img" aria-label="A day from 5am to 8pm. The workday runs 7am to 4pm, with leaks in the hour before and the hour after.">
        <defs><pattern id="hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="${C.tint}"/><rect width="4" height="10" fill="${C.acc}"/></pattern></defs>
        <rect x="${f1(X(5))}" y="96" width="${f1(X(20) - X(5))}" height="42" rx="8" fill="${C.line2}"/>
        <rect x="${f1(X(7))}" y="96" width="${f1(X(16) - X(7))}" height="42" fill="#F2D49B"/>
        <text x="${f1(X(11.5))}" y="124" text-anchor="middle" fill="${C.tintInk}" style="font-family: Archivo, sans-serif; font-size: 22px; font-weight: 700">Workday · 7:00 to 4:00</text>
        <rect x="${f1(X(6))}" y="96" width="${f1(X(7) - X(6))}" height="42" fill="url(#hatch)"/>
        <rect x="${f1(X(16))}" y="96" width="${f1(X(17) - X(16))}" height="42" fill="url(#hatch)"/>
        <path d="M${f1(X(6))} 82 V74 H${f1(X(7))} V82" fill="none" stroke="${C.accText}" stroke-width="2"/>
        <path d="M${f1(X(16))} 82 V74 H${f1(X(17))} V82" fill="none" stroke="${C.accText}" stroke-width="2"/>
        <text x="${f1(X(6.5))}" y="60" text-anchor="middle" fill="${C.accText}" style="font-family: 'IBM Plex Mono', monospace; font-size: 18px">Before 7:00</text>
        <text x="${f1(X(16.5))}" y="60" text-anchor="middle" fill="${C.accText}" style="font-family: 'IBM Plex Mono', monospace; font-size: 18px">After 4:00</text>
        ${ticks}
      </svg>
      <div style="display: flex; flex-direction: column; gap: 14px">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: stretch">
          ${share(s.morning.counts.pillow, s.morning.n, "check email from the pillow before 7:00")}
          ${share(s.logoff.open, s.logoff.n, "laptops still open at 5:00")}
        </div>
        ${confess(CONFESSIONS.c2, s.confess.c2)}
      </div>
    </div>
    ${foot(4)}
    ${num(n, total)}
  </div>`;
}

/* ---------- 5 · Body ---------- */
function body(n, total, s) {
  /* One icon per cup while it fits; otherwise each icon stands for several cups (same scale for both) */
  const perIcon = Math.max(1, Math.ceil(Math.max(s.fuel.coffee, s.fuel.water) / 52));
  const nc = Math.round(s.fuel.coffee / perIcon), nw = Math.round(s.fuel.water / perIcon);
  const rowsC = Math.ceil(nc / 13);
  let cups = "", glasses = "";
  for (let i = 0; i < nc; i++) { const x = (i % 13) * 22, y = Math.floor(i / 13) * 21; cups += `M${x + 3} ${y + 5} H${x + 19} L${x + 16.5} ${y + 17} Q${x + 11} ${y + 20} ${x + 5.5} ${y + 17} Z `; }
  for (let i = 0; i < nw; i++) { const x = (i % 13) * 22, y = rowsC * 21 + 12 + Math.floor(i / 13) * 21; glasses += `M${x + 5} ${y + 2} H${x + 17} L${x + 15.5} ${y + 19} H${x + 6.5} Z `; }
  const head = t => `<span style="font-size: var(--t-head); font-weight: 800; font-stretch: 80%">${t}</span>`;
  const pose = s.posture;
  return `
  <div class="slide">
    <div class="s-body" style="gap: 18px">
      <div class="lead-fix"><h2 class="h">Raise your screen to eye level.</h2><p class="why">Two books under the laptop will do. Then rest your eyes, and drink water.</p></div>
      <div style="flex: 1; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; min-height: 0">
        <div class="panel" style="display: flex; flex-direction: column; gap: 10px; padding: 16px 20px; border: 2px solid ${C.acc}">
          ${head("Neck")}
          <div style="display: flex; align-items: center; gap: 18px; height: 196px">
            <div style="flex: none; border-radius: 12px; color: ${C.bone}; background: radial-gradient(70% 60% at 50% 45%, ${C.film1}, ${C.film2})">${skeletonSVG(0.62, { w: 150, h: 188, ink: C.bone, sub: C.boneSub })}</div>
            <div style="display: flex; flex-direction: column; gap: 5px">
              <span style="font-family: var(--mono); font-size: var(--t-num); font-weight: 500; line-height: 1">5 kg</span>
              <span style="font-size: var(--t-tick); color: ${C.sub}">head, upright</span>
              <span style="font-family: var(--mono); font-size: var(--t-num); font-weight: 500; line-height: 1; color: ${C.accText}; margin-top: 6px">27 kg</span>
              <span style="font-size: var(--t-tick); color: ${C.sub}">neck, at a 60° tilt</span>
            </div>
          </div>
          <div style="margin-top: auto">${share(pose.topCount, pose.n, `sit like ${POSES[pose.top]}`, "stack")}</div>
        </div>
        <div class="panel" style="display: flex; flex-direction: column; gap: 10px; padding: 16px 20px">
          ${head("Eyes")}
          <span class="pfix">Lamp on. Look 6 m away every 20 minutes.</span>
          <div style="display: flex; align-items: center; gap: 18px; height: 128px">
            <svg width="118" height="118" viewBox="0 0 128 128" aria-hidden="true" style="flex: none">
              <circle cx="64" cy="64" r="54" fill="none" stroke="${C.line2}" stroke-width="10"/>
              <circle cx="64" cy="64" r="54" fill="none" stroke="${C.acc}" stroke-width="10" stroke-linecap="round" stroke-dasharray="254 340" transform="rotate(-90 64 64)"/>
              <text x="64" y="72" text-anchor="middle" fill="${C.ink}" style="font-family: 'IBM Plex Mono', monospace; font-size: 30px; font-weight: 500">20 s</text>
            </svg>
            <span style="display: flex; flex-direction: column; gap: 6px; font-family: var(--mono); font-size: 17px; line-height: 1.2"><b style="font-family: var(--display); font-size: var(--t-head); font-weight: 800; font-stretch: 80%; color: ${C.accText}">20-20-20</b><span>every 20 min</span><span>look 6 m away</span><span>for 20 s</span></span>
          </div>
          <span style="font-size: var(--t-tick); line-height: 1.35; color: ${C.sub}">Blinks a minute: about 15 normally, 5 to 7 at a screen</span>
          <div style="margin-top: auto">${share(s.light.dark, s.light.n, "work in the dark", "stack")}</div>
        </div>
        <div class="panel" style="display: flex; flex-direction: column; gap: 10px; padding: 16px 20px">
          ${head("Fuel")}
          <span class="pfix">One glass of water with every coffee.</span>
          <div style="display: flex; align-items: center; height: 128px">
            ${enough(s.fuel.n) ? `<svg width="236" height="128" viewBox="0 0 284 ${Math.max(160, rowsC * 21 + 12 + Math.ceil(nw / 13) * 21)}" role="img" aria-label="${s.fuel.coffee} coffees and ${s.fuel.water} glasses of water"><path d="${cups}" fill="${C.acc}"/><path d="${glasses}" fill="${C.water}"/></svg>` : ""}
          </div>
          <span style="font-size: var(--t-tick); line-height: 1.35; color: ${C.sub}"><span style="color: ${C.acc}">■</span> coffee, karak &nbsp; <span style="color: ${C.water}">■</span> water${perIcon > 1 ? ` · each icon = ${perIcon}` : ""}</span>
          <div style="margin-top: auto">${enough(s.fuel.n) ? callout(`${s.fuel.coffee} : ${s.fuel.water}`, "coffees to waters, yesterday", "stack") : share(0, s.fuel.n, "coffee vs water", "stack")}</div>
        </div>
      </div>
      ${confess(CONFESSIONS.c3, s.confess.c3)}
    </div>
    ${foot(5, 6, 7, 8, 9, 10)}
    ${num(n, total)}
  </div>`;
}

/* ---------- 6 · Awards ---------- */
const catIcon = `<svg width="96" height="96" viewBox="0 0 96 96" aria-hidden="true"><path d="M20 42 L24 14 L40 29 Q48 26 56 29 L72 14 L76 42 Q82 72 48 82 Q14 72 20 42 Z" fill="${C.tint}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/><ellipse cx="37" cy="49" rx="3.5" ry="5" fill="${C.ink}"/><ellipse cx="59" cy="49" rx="3.5" ry="5" fill="${C.ink}"/><path d="M44 59 H52 L48 64 Z" fill="${C.acc}"/><path d="M30 60 H12 M30 65 L14 70 M66 60 H84 M66 65 L82 70" stroke="${C.ink}" stroke-width="2.5" stroke-linecap="round"/></svg>`;
const eyeIcon = `<svg width="96" height="96" viewBox="0 0 96 96" aria-hidden="true"><path d="M8 48 Q48 10 88 48 Q48 86 8 48 Z" fill="${C.panel}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/><circle cx="48" cy="48" r="15" fill="${C.acc}"/><circle cx="48" cy="48" r="6.5" fill="${C.ink}"/><circle cx="52" cy="44" r="2.5" fill="#fff"/></svg>`;
const cupIcon = `<svg width="96" height="96" viewBox="0 0 96 96" aria-hidden="true"><path d="M36 22 Q32 14 38 8 M48 22 Q44 14 50 8 M60 22 Q56 14 62 8" stroke="${C.deco}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M20 32 H76 L68 74 Q48 86 28 74 Z" fill="${C.acc}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/><path d="M20 32 H76" stroke="${C.ink}" stroke-width="3" stroke-linecap="round"/></svg>`;
const award = (icon, t, winner, detail) => `
  <div class="panel" style="position: relative; display: flex; flex-direction: column; justify-content: center; gap: 16px; padding: 30px">
    <span style="position: absolute; right: 24px; top: 24px">${PHONE}</span>
    <span style="display: block; transform: scale(1.15); transform-origin: 0 50%; margin-bottom: 10px">${icon}</span>
    <span style="font-size: var(--t-head); font-weight: 700; font-stretch: 85%; color: ${C.sub}">${t}</span>
    <span style="font-size: ${winner.length > 12 ? 56 : 80}px; line-height: 0.92; font-weight: 800; font-stretch: 64%; color: ${C.accText}">${esc(winner)}</span>
    <span style="font-size: var(--t-body); line-height: 1.3">${detail}</span>
  </div>`;

function awards(n, total, s) {
  const cw = s.coworker, st = s.stare, fu = s.fuel;
  const wait = `<span class="wait">Shows at 5 answers</span>`;
  const top = cw.top || ["", 0], second = cw.second || ["", 0];
  /* The most picked coworker; a tie names both rather than whichever comes first on the card */
  const tied = Object.entries(cw.counts || {}).filter(([, c]) => c === top[1] && c > 0).map(([k]) => k);
  const cwWinner = tied.length === 2 ? `${COWORKER[tied[0]]} and ${COWORKER[tied[1]].toLowerCase()}` : tied.length > 2 ? "A tie" : COWORKER[top[0]];
  const cwDetail = tied.length === 2 ? `${top[1]} votes each.` : tied.length > 2 ? `${tied.map((k, i) => (i ? COWORKER[k].toLowerCase() : COWORKER[k])).join(", ").replace(/, ([^,]*)$/, " and $1")}: ${top[1]} votes each.` : `${top[1]} votes.${second[1] ? ` ${COWORKER[second[0]]} came second.` : ""}`;
  return `
  <div class="slide">
    <div class="s-body" style="gap: 28px">
      <h2 class="h">This morning’s awards</h2>
      <div style="flex: 1; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 22px; min-height: 0">
        ${enough(cw.n) ? award(catIcon, "Coworker of the month", cwWinner, cwDetail) : award(catIcon, "Coworker of the month", "…", wait)}
        ${enough(st.n) ? award(eyeIcon, "Staring champion", `${st.max.toFixed(1)} s`, "Without one blink. Unmute if it was you.") : award(eyeIcon, "Staring champion", "…", wait)}
        ${enough(fu.n) ? award(cupIcon, "Most caffeinated", `${fu.maxCoffee} ${fu.maxCoffee === 1 ? "cup" : "cups"}`, "In one day. Please drink some water.") : award(cupIcon, "Most caffeinated", "…", wait)}
      </div>
    </div>
    ${num(n, total)}
  </div>`;
}

/* ---------- 7 · Three things + one-tap vote ---------- */
const HABIT_REFS = { "Raise your screen to eye level": 5, "Mute the news alerts": 1, "Stand up when a call ends": 11, "Close the laptop after work, out of sight": 4 };
function habits(n, total, s) {
  const v = s.vote, max = Math.max(...v.counts);
  return `
  <div class="slide">
    <div class="s-body" style="gap: 22px">
      <div style="display: flex; align-items: flex-end; justify-content: space-between; gap: 24px">
        <h2 class="h">Three things for this week</h2>
        <span style="display: flex; align-items: center; gap: 10px; padding-bottom: 8px; font-size: var(--t-body); color: ${C.sub}">${PHONE}${v.n ? `${v.n} voted` : "Tap the one you’ll start with"}</span>
      </div>
      <div style="flex: 1; display: flex; flex-direction: column; gap: 14px; min-height: 0">
        ${HABITS.map((t, i) => {
          const c = v.counts[i], lead = v.n && c === max;
          return `
          <div style="flex: 1; display: grid; grid-template-columns: 56px minmax(0, 1fr) 300px; gap: 20px; align-items: center; padding: 16px 28px; border-radius: 16px; background: ${C.panel}; border: 1px solid ${C.line2}">
            <span style="font-family: var(--mono); font-size: 38px; font-weight: 500; line-height: 1; color: ${C.accText}">${i + 1}</span>
            <span style="font-size: 40px; line-height: 1.05; font-weight: 800; font-stretch: 75%">${t}</span>
            <span style="display: grid; grid-template-columns: minmax(0, 1fr) 70px; gap: 14px; align-items: center">
              <span class="track" style="height: 20px"><i style="width: ${v.n ? (c / v.n * 100).toFixed(1) : 0}%; background: ${lead ? C.acc : C.grey}"></i></span>
              <span style="font-family: var(--mono); font-size: var(--t-num); font-weight: 500; color: ${lead ? C.accText : C.ink}">${v.n ? c : ""}</span>
            </span>
          </div>`;
        }).join("")}
      </div>
      <span style="font-size: var(--t-body); color: ${C.sub}">Nothing to buy. Each one works at a dining table.</span>
    </div>
    ${foot(...HABITS.map(h => HABIT_REFS[h]).filter(Boolean))}
    ${num(n, total)}
  </div>`;
}

/* ---------- 8 · Close ---------- */
function close(n, total, s) {
  const vd = s.verdict;
  const colW = 456 / 11, cx = i => colW * i + colW / 2;
  const unit = Math.min(62, 250 / Math.max(1, ...vd.hist));
  const hist = vd.hist.map((c, i) => {
    const h = c * unit;
    return `<rect x="${f1(cx(i) - 13)}" y="${f1(276 - h)}" width="26" height="${f1(h)}" rx="3" fill="${i <= 5 ? C.grey : C.acc}"/>
      ${c ? `<text x="${f1(cx(i))}" y="${f1(268 - h)}" text-anchor="middle" fill="${C.ink}" style="font-family: 'IBM Plex Mono', monospace; font-size: 16px">${c}</text>` : ""}
      <text x="${f1(cx(i))}" y="300" text-anchor="middle" fill="${C.muted}" style="font-family: 'IBM Plex Mono', monospace; font-size: 16px">${i}</text>`;
  }).join("");
  const ready = enough(vd.n);
  /* Where to say so: the team board's QR code and the support line, from the private slide data */
  const { board, support } = loadKpis().close;
  const reach = board.url || support.phone ? `
        <div class="reach${board.url ? "" : " no-qr"}">
          ${board.url ? qrSVG(board.url, 176) : ""}
          <div class="reach-txt">
            ${board.url ? `<span><b>${esc(board.title || "Share your experience")}</b>${board.where || board.question ? `<span class="sub">${board.where ? `On ${esc(board.where)}${board.question ? ": " : ""}` : ""}${board.question ? `“${esc(board.question)}”` : ""}</span>` : ""}</span>` : ""}
            ${board.url && support.phone ? `<hr>` : ""}
            ${support.phone ? `<span>${support.name ? `<b>${esc(support.name)}</b>` : ""}<span class="sub">${esc(support.text || "To speak with a counselor, call")} <b class="tel">${esc(support.phone)}</b>${support.note ? ` (${esc(support.note)})` : ""}</span></span>` : ""}
          </div>
        </div>` : "";
  return `
  <div class="slide">
    ${lamp("l8", 210, reach ? -60 : 40)}
    <div class="s-body" style="display: grid; grid-template-columns: 520px minmax(0, 1fr); gap: 56px; align-items: stretch">
      <div class="panel" style="display: flex; flex-direction: column; gap: 14px">
        <span style="display: flex; align-items: center; justify-content: space-between"><span style="font-size: var(--t-head); font-weight: 700; font-stretch: 85%">Working from home so far</span>${PHONE}</span>
        ${ready ? `
        <span style="display: flex; align-items: baseline; gap: 12px"><span style="font-size: var(--t-hero); font-weight: 800; font-stretch: 70%; line-height: 0.85; color: ${C.accText}">${vd.avg.toFixed(1)}</span><span style="font-family: var(--mono); font-size: var(--t-body); color: ${C.sub}">out of 10</span></span>
        <svg width="456" height="306" viewBox="0 0 456 306" role="img" aria-label="Scores from 0 to 10, average ${vd.avg.toFixed(1)}">
          <line x1="0" y1="276" x2="456" y2="276" stroke="${C.line}" stroke-width="1.5"/>
          ${hist}
          <line x1="${f1(cx(vd.avg))}" y1="10" x2="${f1(cx(vd.avg))}" y2="276" stroke="${C.ink}" stroke-width="1.5" stroke-dasharray="5 5"/>
          <text x="${f1(cx(vd.avg) - 8)}" y="22" text-anchor="end" fill="${C.ink}" style="font-family: 'IBM Plex Mono', monospace; font-size: 16px">average</text>
        </svg>
        <span style="margin-top: auto; display: flex; align-items: center; gap: 10px; font-size: var(--t-label); color: ${C.sub}"><span style="width: 14px; height: 14px; border-radius: 3px; background: ${C.grey}"></span><span><b style="font-family: var(--mono); font-weight: 500; color: ${C.ink}">${vd.low}</b> of us said 5 or below</span></span>`
        : `<span class="wait">Shows at 5 answers (${vd.n} so far)</span>`}
      </div>
      <div style="position: relative; display: flex; flex-direction: column; gap: ${reach ? 18 : 24}px; justify-content: center; padding-top: ${reach ? 0 : 120}px">
        <h2 class="h">If the weeks feel heavy, say so</h2>
        <p style="margin: 0; font-size: ${reach ? "var(--t-body)" : "28px"}; line-height: 1.35">Unmute. Message a colleague. Talk to your manager.</p>${reach}
        <p style="margin: 0; font-size: var(--t-label); color: ${C.sub}">Your report stays on your phone.</p>
      </div>
    </div>
    ${num(n, total)}
  </div>`;
}

/* ---------- 11 · Sources: kept small, after the close, only if someone asks ---------- */
const SOURCES = [
  ["Attention · mute the news alerts", [
    ["Fitz et al. 2019", "Fitz N, Kushlev K, Jagannathan R, et al. Batching smartphone notifications can improve well-being. Computers in Human Behavior 101 (2019): 84–94."],
    ["McLaughlin et al. 2022", "McLaughlin B, Gotlieb MR, Mills DJ. Caught in a dangerous world: problematic news consumption and its relationship to mental and physical ill-being. Health Communication (2022)."],
    ["APA 2017", "American Psychological Association. Stress in America: Coping with Change, part 2 (February 2017)."]]],
  ["Hours · close the laptop, out of sight", [
    ["Sonnentag et al. 2022", "Sonnentag S, Cheng BH, Parker SL. Recovery from work: advancing the field toward the future. Annual Review of Organizational Psychology and Organizational Behavior 9 (2022): 33–60."]]],
  ["Body · screen at eye level", [
    ["OSHA", "OSHA. Computer Workstations eTool: Monitors (top of the screen at or slightly below eye level)."],
    ["Hansraj 2014", "Hansraj KK. Assessment of stresses in the cervical spine caused by posture and position of the head. Surgical Technology International 25 (2014)."]]],
  ["Body · eyes", [
    ["AAO 2024", "American Academy of Ophthalmology. Computers, digital devices and eye strain (2024, reviewed 2025)."],
    ["Talens-Estarelles et al. 2022", "Talens-Estarelles C, Cerviño A, García-Lázaro S, et al. The effects of breaks on digital eye strain, dry eye and binocular vision: testing the 20-20-20 rule. Contact Lens & Anterior Eye (2022)."]]],
  ["Body · fuel", [
    ["EFSA 2015", "European Food Safety Authority. Scientific opinion on the safety of caffeine (2015)."],
    ["Killer et al. 2014", "Killer SC, Blannin AK, Jeukendrup AE. No evidence of dehydration with moderate daily coffee intake. PLoS ONE 9 (2014): e84154."]]],
  ["Moving more", [
    ["WHO 2020", "World Health Organization. Guidelines on physical activity and sedentary behaviour (2020)."]]]
];
function sources(n, total) {
  const group = ([head, items]) => `<div class="src-group"><b>${esc(head)}</b>${items.map(([, t]) => `<span>${esc(t)}</span>`).join("")}</div>`;
  return `
  <div class="slide">
    <div class="s-body" style="gap: 22px">
      <h2 class="h" style="font-size: 44px">Sources</h2>
      <div class="src-cols">${SOURCES.map(group).join("")}</div>
    </div>
    ${num(n, total)}
  </div>`;
}

export const SLIDES = [
  { id: "courses", render: kpiCourses },
  { id: "phishing", render: kpiPhishing },
  { id: "incidents", render: kpiIncidents },
  { id: "title", render: title },
  { id: "attention", render: attention, stage: "c1" },
  { id: "hours", render: hours, stage: "c2" },
  { id: "body", render: body, stage: "c3" },
  { id: "awards", render: awards },
  { id: "habits", render: habits, stage: "vote" },
  { id: "close", render: close },
  { id: "sources", render: sources }
];

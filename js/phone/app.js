/* Phone app: landing (lamp) → 11 cards → private report → talk companion (confessions, vote).
   Progress is saved per session, so a reload or a locked phone picks up where it left off. */
import { config, isSessionCode } from "../config.js";
import { store, randomCode } from "../store.js";
import { createRelay } from "../relay.js";
import { CARDS, NICKNAMES, AREAS, AREA_LABEL, CONFESSIONS, HABITS, lightName } from "../content.js";
import { report } from "../scoring.js";
import { applyTheme } from "./theme.js";
import { renderCard } from "./cards.js";

const app = document.getElementById("app");
const sheet = document.getElementById("sheet");
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const session = config.demo ? (config.session || "demo") : config.session;

if (!isSessionCode(session)) {
  applyTheme(20);
  app.innerHTML = `<div class="body" style="justify-content: center; text-align: center; gap: 16px">
    <h1>Home office check-up</h1><p class="sub">Scan the QR code on the shared screen to join the game.</p></div>`;
} else {
  start();
}

function start() {
  const KEY = "play." + session;
  const state = store.get(KEY) || {
    pid: randomCode(10),
    nick: NICKNAMES[Math.floor(Math.random() * NICKNAMES.length)],
    L: 30, idx: 0, answers: {}, joined: false, done: false, taps: {}, vote: null, choosing: false
  };
  let stage = "";
  let thanksTimer = null;

  const save = () => store.set(KEY, state);
  const relay = createRelay({
    session,
    onMessage: m => {
      if (m && m.t === "stage" && typeof m.s === "string") { stage = m.s; renderSheet(); }
    }
  });
  relay.connect();
  const send = payload => relay.send({ ...payload, p: state.pid });

  /* ---------- Screens ---------- */
  function render() {
    if (state.idx === 0) landing();
    else if (state.idx <= CARDS.length) card(state.idx - 1);
    else reportScreen();
    window.scrollTo(0, 0);
  }

  function landing() {
    applyTheme(state.L);
    app.innerHTML = `
      <div class="lamp-wrap" id="lamp"></div>
      <h1 class="title-big">Home office<br>check-up</h1>
      <p class="sub">Eleven quick cards about your desk, your breaks and your screen. At the end you get a check-up report that only you can see.</p>
      <div class="level" aria-live="polite"><b id="lvl"></b><span id="pct"></span></div>
      <p class="fine" style="margin-top: -6px">Pull the lamp cord to match the light in your room right now.</p>
      <div class="nick">
        <span><small>Playing as</small><b id="nick">${esc(state.nick)}</b></span>
        <span><button type="button" class="link" data-a="shuffle">Shuffle</button><button type="button" class="link" data-a="choose">Choose</button></span>
      </div>
      <div class="names" ${state.choosing ? "" : "hidden"}>${NICKNAMES.map(n => `<button type="button" data-n="${esc(n)}" aria-pressed="${n === state.nick}">${esc(n)}</button>`).join("")}</div>
      <button type="button" class="btn" data-a="start">Start the check-up</button>
      <p class="fine">No login, no camera. Your report stays on this phone. The shared screen shows team totals only, once 5 or more people have answered.</p>`;
    drawLamp();
    app.onclick = e => {
      const a = e.target.closest("[data-a]")?.dataset.a;
      const n = e.target.closest("[data-n]")?.dataset.n;
      if (a === "shuffle") { state.nick = NICKNAMES[(NICKNAMES.indexOf(state.nick) + 1 + Math.floor(Math.random() * (NICKNAMES.length - 1))) % NICKNAMES.length]; save(); landing(); }
      else if (a === "choose") { state.choosing = !state.choosing; save(); landing(); }
      else if (n) { state.nick = n; state.choosing = false; save(); landing(); }
      else if (a === "start") {
        state.idx = 1;
        send({ t: "join", n: state.nick, L: Math.round(state.L) });
        state.joined = true;
        save();
        render();
      }
    };
  }

  function drawLamp() {
    const wrap = document.getElementById("lamp");
    if (!wrap.querySelector(".cord")) {
      wrap.innerHTML = `<div class="lamp-svg"></div><div class="cord" role="slider" tabindex="0" aria-label="Room light" aria-valuemin="0" aria-valuemax="100"></div>`;
      const cord = wrap.querySelector(".cord");
      const fromPointer = e => {
        const r = wrap.getBoundingClientRect();
        setLight(((e.clientY - r.top - 96) / 140) * 100);
      };
      cord.addEventListener("pointerdown", e => { cord.setPointerCapture(e.pointerId); fromPointer(e); });
      cord.addEventListener("pointermove", e => { if (cord.hasPointerCapture(e.pointerId)) fromPointer(e); });
      cord.addEventListener("keydown", e => {
        const d = { ArrowDown: 5, ArrowRight: 5, ArrowUp: -5, ArrowLeft: -5 }[e.key];
        if (d !== undefined) { e.preventDefault(); setLight(state.L + d); }
      });
    }
    const L = state.L, k = L / 100;
    const bead = 96 + k * 140;
    const cord = wrap.querySelector(".cord");
    cord.setAttribute("aria-valuenow", String(Math.round(L)));
    cord.setAttribute("aria-valuetext", lightName(L));
    wrap.querySelector(".lamp-svg").innerHTML = `
      <svg viewBox="0 0 400 270" width="400" height="270" aria-hidden="true">
        <defs>
          <linearGradient id="cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFB547" stop-opacity="${(0.08 + 0.4 * k).toFixed(2)}"/><stop offset="1" stop-color="#FFB547" stop-opacity="0"/></linearGradient>
          <radialGradient id="halo" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFD58A" stop-opacity="${(0.2 + 0.7 * k).toFixed(2)}"/><stop offset="1" stop-color="#FFD58A" stop-opacity="0"/></radialGradient>
        </defs>
        <path d="M170 150 L230 150 L340 270 L60 270 Z" fill="url(#cone)"/>
        <circle cx="200" cy="152" r="${(40 + 40 * k).toFixed(0)}" fill="url(#halo)"/>
        <line x1="200" y1="0" x2="200" y2="96" stroke="#7D8C92" stroke-width="2.5" stroke-dasharray="2 5" stroke-linecap="round"/>
        <path d="M176 96 H224 L250 150 H150 Z" fill="#2F3A40"/>
        <path d="M150 150 H250" stroke="#E8961E" stroke-width="3" stroke-linecap="round"/>
        <circle cx="200" cy="155" r="11" fill="${k < 0.05 ? "#5B6A70" : "#FFE6B8"}"/>
        <line x1="262" y1="0" x2="262" y2="${bead.toFixed(0)}" stroke="#9AA8AD" stroke-width="2" stroke-dasharray="1 6" stroke-linecap="round"/>
        <circle cx="262" cy="${(bead + 6).toFixed(0)}" r="8" fill="#E8961E"/>
        <text x="276" y="${(bead + 11).toFixed(0)}" fill="#E8961E" style="font-family: 'IBM Plex Mono', monospace; font-size: 14px">Pull</text>
      </svg>`;
    document.getElementById("lvl").textContent = lightName(L);
    document.getElementById("pct").textContent = Math.round(L) + "%";
  }

  function setLight(L) {
    state.L = Math.max(0, Math.min(100, L));
    applyTheme(state.L);
    drawLamp();
    save();
  }

  function card(i) {
    applyTheme(state.L);
    const c = CARDS[i];
    app.onclick = null;
    app.innerHTML = `
      <div class="topbar"><span class="brand">Home Office Check-up</span><span class="chip">${esc(state.nick)}</span></div>
      <div class="segs" aria-hidden="true">${CARDS.map((_, j) => `<i class="${j < i ? "done" : j === i ? "now" : ""}"></i>`).join("")}</div>
      <span class="count">Card ${String(i + 1).padStart(2, "0")} / ${CARDS.length}</span>
      <h1>${esc(c.title)}</h1>
      <p class="sub">${esc(c.sub)}</p>
      <div class="body" id="cardbody"></div>
      <div class="nav">
        <button type="button" class="btn ghost" data-a="back">Back</button>
        <button type="button" class="btn" data-a="next">${i === CARDS.length - 1 ? "See my report" : "Next"}</button>
      </div>`;
    const next = app.querySelector('[data-a="next"]');
    const refresh = () => { next.disabled = state.answers[c.key] === undefined; };
    renderCard(document.getElementById("cardbody"), c, state.answers[c.key], v => { state.answers[c.key] = v; save(); refresh(); });
    refresh();
    app.querySelector('[data-a="back"]').onclick = () => { state.idx -= 1; save(); render(); };
    next.onclick = () => {
      if (state.answers[c.key] === undefined) return;
      send({ t: "ans", k: c.key, v: state.answers[c.key] });
      state.idx += 1;
      if (state.idx > CARDS.length && !state.done) { state.done = true; send({ t: "done" }); }
      save();
      render();
    };
  }

  function reportScreen() {
    applyTheme(state.L);
    app.onclick = null;
    const r = report({ ...state.answers, light: state.L });
    app.innerHTML = `
      <div class="topbar"><span class="brand">Home Office Check-up</span><span class="chip">${esc(state.nick)}</span></div>
      <div class="slip">
        <span style="font-size: 19px; font-weight: 800; font-stretch: 80%">Home office check-up report</span>
        <span class="meta">Patient: ${esc(state.nick)}<br>Shift: 7:00 to 4:00<br>Room light: ${lightName(state.L)}</span>
        <span class="rule"></span>
        <span class="k">Primary finding</span>
        <span class="finding">${r.finding}</span>
        ${AREAS.map(k => `<span class="row"><span>${AREA_LABEL[k]}</span><i><b style="width: ${((r.strain[k] - 1) / 4 * 100).toFixed(0)}%"></b></i><span>${r.strain[k].toFixed(1)}</span></span>`).join("")}
        <span class="meta" style="font-size: 11px">Strain from 1 (low) to 5 (high). Eyes: ${r.eyesNote}.</span>
        <span class="rule"></span>
        <span class="k">Prescription</span>
        <span class="rx">${r.prescription}</span>
        <span class="stamp">REVIEWED<br>BY THE<br>CAT</span>
      </div>
      <p class="fine">For fun, not a medical diagnosis. This report stays on your phone.</p>
      <div class="waiting">Keep this page open. Three quick confessions pop up here during the talk. One tap each, anonymous.</div>
      <button type="button" class="btn ghost" data-a="edit" style="align-self: flex-start">Change my answers</button>`;
    app.querySelector('[data-a="edit"]').onclick = () => { state.idx = CARDS.length; save(); render(); };
  }

  /* ---------- Talk companion: follows the presenter's slides ---------- */
  function renderSheet() {
    clearTimeout(thanksTimer);
    const isConfession = stage in CONFESSIONS;
    const pending = (isConfession && state.taps[stage] === undefined) || (stage === "vote" && state.vote === null);
    if (!pending) { sheet.hidden = true; sheet.innerHTML = ""; return; }
    sheet.hidden = false;
    sheet.innerHTML = isConfession ? `
      <div class="sheet-in" role="dialog" aria-modal="true" aria-label="Anonymous confession">
        <span class="count">Confession ${stage.slice(1)} of 3 · anonymous</span>
        <p class="q">“${CONFESSIONS[stage]}”</p>
        <div class="two"><button type="button" class="btn" data-v="1">Guilty</button><button type="button" class="btn no" data-v="0">Not me</button></div>
        <p class="fine">Not even the presenter sees who tapped what.</p>
      </div>` : `
      <div class="sheet-in" role="dialog" aria-modal="true" aria-label="Pick one habit">
        <p class="q">Which one will you actually do this week?</p>
        ${HABITS.map((h, i) => `<button type="button" class="opt" data-h="${i}"><span class="dot"></span>${esc(h)}</button>`).join("")}
        <p class="fine">Anonymous. The screen shows totals only.</p>
      </div>`;
    sheet.onclick = e => {
      const v = e.target.closest("[data-v]")?.dataset.v;
      const h = e.target.closest("[data-h]")?.dataset.h;
      if (v !== undefined && isConfession) { state.taps[stage] = Number(v); send({ t: "tap", q: stage, v: Number(v) }); }
      else if (h !== undefined) { state.vote = Number(h); send({ t: "vote", v: Number(h) }); }
      else return;
      save();
      sheet.innerHTML = `<div class="sheet-in"><p class="q">Locked in.</p><p class="sub">Watch the shared screen.</p></div>`;
      thanksTimer = setTimeout(() => { sheet.hidden = true; sheet.innerHTML = ""; }, 1600);
    };
  }

  render();
}

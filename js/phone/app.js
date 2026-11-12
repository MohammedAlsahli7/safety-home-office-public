/* Phone app. The presenter drives the pace, Kahoot style:
   landing (lamp, nickname) → lobby until the presenter starts → the card the presenter is on →
   private report when the game ends → confessions and the vote pop up during the talk.
   The phone never moves on by itself. Answers are sent as the player taps, and can be changed
   until the presenter moves to the next card. Progress is saved per session, so a reload or a
   locked phone comes back to the same place.
   Stages count only when signed by the presenter's key from the QR link (?k=) and newer than the
   last one, so nobody else can move the phones. */
import { config, isSessionCode } from "../config.js";
import { store, randomCode } from "../store.js";
import { createRelay } from "../relay.js";
import { CARDS, NICKNAMES, AREAS, AREA_LABEL, AREA_WORDS, SEVERITY, PRESCRIPTIONS, CONFESSIONS, HABITS, lightName, lightBucket } from "../content.js";
import { report } from "../scoring.js";
import { applyTheme, roomBg } from "./theme.js";
import { renderCard } from "./cards.js";
import { canSign, verifier, stageText, fingerprint } from "../sign.js";

const app = document.getElementById("app");
const sheet = document.getElementById("sheet");
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const mono = (t, cls = "") => `<span class="mono-cap ${cls}">${t}</span>`;

const session = config.session;

/* Which view a presenter stage asks for: "lobby", "q1".."q11", then anything else is after the game */
const cardIndexOf = s => (typeof s === "string" && /^q([1-9]|1[01])$/.test(s) ? Number(s.slice(1)) - 1 : -1);

if (!isSessionCode(session)) {
  applyTheme(20);
  app.innerHTML = `<div class="center-msg"><h1>Home office check-up</h1><p class="sub">Scan the QR code on the shared screen to join the game.</p></div>`;
} else {
  start();
}

function start() {
  const KEY = "play." + session;
  const state = Object.assign({
    pid: randomCode(10),
    nick: NICKNAMES[Math.floor(Math.random() * NICKNAMES.length)], nickChosen: false,
    L: 30, joined: false, answers: {}, sent: {}, done: false, taps: {}, vote: null, choosing: false
  }, store.get(KEY) || {});
  let stage = null, view = null, cleanup = () => {}, thanksTimer = null;
  const pending = {};

  /* A short buzz when the presenter moves everyone to a new card, opens a confession or the vote, or
     sends the reports. Android phones only: iPhone browsers have no vibration for web pages, and the
     card still slides in. Only for a live move (the stage is less than 20 s old), never for a session a
     reloaded page replays, and a burst of stages buzzes once. Browsers allow it after the first tap. */
  let buzzNext = false, buzzTimer = null;
  function buzz(pattern) {
    if (!buzzNext || typeof navigator.vibrate !== "function") return;
    clearTimeout(buzzTimer);
    buzzTimer = setTimeout(() => { try { navigator.vibrate(pattern); } catch (_) { /* not allowed yet */ } }, 200);
  }

  /* Only the presenter moves the phones: check each stage's signature, and drop anything older */
  let lastAt = 0, chain = Promise.resolve();
  let verify = null, verifiedPk = null;
  /* The presenter's key must be the one whose fingerprint is this session's code */
  async function verifierFor(pk) {
    if (verify && pk === verifiedPk) return verify;
    if (typeof pk !== "string" || pk.length > 200) return null;
    try {
      if ((await fingerprint(pk)) !== session) return null;
      verify = await verifier(pk);
      verifiedPk = pk;
      return verify;
    } catch (_) { return null; }
  }
  async function acceptStage(m) {
    if (!Number.isFinite(m.at) || m.at <= lastAt) return;
    {
      if (canSign()) {
        const v = await verifierFor(m.pk);
        if (!v || !(await v(stageText(session, m.s, m.at), m.sig))) return;
      } else {
        console.warn("Insecure page (plain http): presenter signatures can't be checked here.");
      }
    }
    lastAt = m.at;
    stage = m.s;
    buzzNext = Date.now() - m.at < 20000;
    update();
    buzzNext = false;
  }

  const save = () => store.set(KEY, state);
  const relay = createRelay({
    session,
    onMessage: m => {
      if (m && m.t === "stage" && typeof m.s === "string") chain = chain.then(() => acceptStage(m)).catch(() => {});
      else if (m && m.t === "join" && typeof m.p === "string" && typeof m.n === "string") seenJoin(m.p, m.n);
    }
  });
  relay.connect();
  const send = payload => relay.send({ ...payload, p: state.pid });

  /* ---------- Answers: sent on tap, or after a short pause while dragging or counting ---------- */
  function flush(key) {
    clearTimeout(pending[key]);
    delete pending[key];
    if (state.answers[key] === undefined) return;
    send({ t: "ans", k: key, v: state.answers[key] });
    state.sent[key] = true;
    save();
    showSent(key);
  }
  const flushAll = () => Object.keys(pending).forEach(flush);
  function answer(key, v, now) {
    state.answers[key] = v;
    save();
    clearTimeout(pending[key]);
    if (now) flush(key);
    else { pending[key] = setTimeout(() => flush(key), 700); showSent(key, true); }
  }

  /* ---------- View routing ---------- */
  function wanted() {
    if (stage === "closed") return "closed";
    if (!state.joined) return "landing";
    const i = cardIndexOf(stage);
    if (i >= 0) return "q" + i;
    if (stage === null) return "connecting";
    if (stage === "lobby") return "lobby";
    return Object.keys(state.answers).length ? "report" : "late";
  }

  function update() {
    const v = wanted();
    if (v !== view) {
      flushAll();
      cleanup();
      cleanup = () => {};
      view = v;
      document.body.style.background = "";
      if (v === "landing") landing();
      else if (v === "lobby" || v === "connecting") lobby();
      else if (v[0] === "q") cleanup = card(Number(v.slice(1))) || cleanup;
      else if (v === "report") reportScreen();
      else if (v === "closed") closedScreen();
      else lateScreen();
      window.scrollTo(0, 0);
      if (v[0] === "q") buzz([80, 60, 80]);
      else if (v === "report") buzz([160]);
      /* Each new card slides in; other views rise (not when the same view just redraws) */
      if (v !== update.lastView) {
        update.lastView = v;
        app.classList.remove("enter", "enter-card");
        void app.offsetWidth;
        app.classList.add(v[0] === "q" ? "enter-card" : "enter");
        clearTimeout(update.animTimer);
        update.animTimer = setTimeout(() => app.classList.remove("enter", "enter-card"), 900);
      }
    }
    if ((view === "report" || view === "late") && !state.done && Object.keys(state.answers).length) {
      state.done = true;
      save();
      send({ t: "done" });
    }
    renderSheet();
  }

  const topbar = right => `<div class="topbar">${mono("Home Office Check-up")}${right || `<span class="chip"><i></i><span data-nick>${esc(state.nick)}</span></span>`}</div>`;

  /* ---------- Landing: pull the lamp cord, pick a nickname, join ---------- */
  function landing() {
    applyTheme(state.L);
    app.innerHTML = `
      <div class="topbar">${mono("Monthly meeting · safety moment")}${mono("3 min")}</div>
      <div class="lamp-box" id="lamp">
        <div class="lamp-art"></div>
        <div class="cord" role="slider" tabindex="0" aria-label="Room light" aria-valuemin="0" aria-valuemax="100"></div>
        <h1 class="title-big">Home office<br>check-up</h1>
      </div>
      <p class="lede">Eleven quick cards about where you work, your breaks and your screen. The presenter moves through them and you answer here. At the end you get a check-up report that only you can see.</p>
      <div class="level"><div><b id="lvl"></b><span id="pct"></span></div><span>Pull the cord to match your room. Every card after this keeps your light.</span></div>
      <div class="playing">
        ${mono("Playing as")}
        <span class="chip big"><i></i><span id="nick">${esc(state.nick)}</span></span>
        <button type="button" class="sq" data-a="shuffle" aria-label="Shuffle name"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg></button>
        <button type="button" class="sq wide" data-a="choose" aria-expanded="${state.choosing}">${state.choosing ? "Close" : "Choose"}</button>
      </div>
      <div class="names" ${state.choosing ? "" : "hidden"}>${NICKNAMES.map(n => `<button type="button" data-n="${esc(n)}">${esc(n)}</button>`).join("")}</div>
      <button type="button" class="btn" data-a="join">Join as <span data-nick>${esc(state.nick)}</span></button>
      <div class="how">
        ${mono("How it works")}
        <div class="steps">
          <span class="num">1</span><span><b>Set your light</b><small>Pull the lamp cord above.</small></span>
          <span class="num">2</span><span><b>Answer 11 cards</b><small>Tap, drag and count. The presenter moves everyone to the next card.</small></span>
          <span class="num">3</span><span><b>Get your report</b><small>Posture, energy, eyes, balance and mind.</small></span>
        </div>
      </div>
      <div class="yours">
        <div>
          ${mono("Your answers stay yours")}
          <div class="locks">
            ${["No login and no real names.", "Your report is worked out on this phone and stays here.", "The team sees totals only, once at least 5 people have answered."].map(t => `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg><span>${t}</span>`).join("")}
          </div>
        </div>
        <div class="mini-slip" aria-hidden="true">
          <span class="h">Check-up report</span><span class="dash"></span><span class="k">Primary finding</span><span class="bar"></span>
          <span class="segs5"><i class="r"></i><i class="r"></i><i class="r"></i><i></i><i></i></span>
          <span class="segs5"><i class="g"></i><i class="g"></i><i></i><i></i><i></i></span>
          <span class="k">revealed at the end</span>
        </div>
      </div>
      <button type="button" class="btn" data-a="join">Join as <span data-nick>${esc(state.nick)}</span></button>`;
    drawLamp();
    showNick();
    app.onclick = e => {
      const a = e.target.closest("[data-a]")?.dataset.a;
      const n = e.target.closest("[data-n]")?.dataset.n;
      if (a === "shuffle") { state.nick = freeName(state.nick); state.nickChosen = false; save(); showNick(); }
      else if (a === "choose") { state.choosing = !state.choosing; save(); showNick(); }
      else if (n && !e.target.closest("[data-n]").disabled) { state.nick = n; state.nickChosen = true; state.choosing = false; save(); showNick(); }
      else if (a === "join") {
        state.joined = true;
        state.choosing = false;
        save();
        send({ t: "join", n: state.nick, L: Math.round(state.L) });
        update();
      }
    };
  }

  /* ---------- Nicknames: skip the ones other phones in this session already use ---------- */
  const others = new Map();
  const takenNames = () => new Set(others.values());
  /* A free name at random; once all 60 are taken, numbered ones: "Lag 2", "Ping 3", … */
  function freeName(not) {
    const taken = takenNames();
    for (let k = 1; k < 100; k++) {
      const pool = NICKNAMES.map(x => (k === 1 ? x : `${x} ${k}`)).filter(x => !taken.has(x) && x !== not);
      if (pool.length) return pool[Math.floor(Math.random() * pool.length)];
    }
    return `${NICKNAMES[0]} ${Date.now() % 1000}`;
  }
  /* The same name with the next free number: "Lag" → "Lag 2" */
  function numbered(nick) {
    const taken = takenNames(), base = nick.replace(/ \d+$/, "");
    for (let k = 2; k < 1000; k++) if (!taken.has(`${base} ${k}`)) return `${base} ${k}`;
    return freeName(nick);
  }
  /* Joins arrive in the same order on every phone. If two phones joined with the same name, the one
     that joined second takes a number and joins again under it, so every name on screen is unique. */
  const joins = [];
  function seenJoin(pid, nick) {
    joins.push([pid, nick]);
    if (pid !== state.pid) { nameTaken(pid, nick); return; }
    if (nick !== state.nick) return;
    const clash = joins.slice(0, -1).some(([p, n]) => p !== state.pid && n === nick && others.get(p) === nick);
    if (!clash) return;
    state.nick = numbered(nick);
    save();
    send({ t: "join", n: state.nick, L: Math.round(state.L) });
    app.querySelectorAll("[data-nick]").forEach(x => { x.textContent = state.nick; });
  }
  function nameTaken(pid, nick) {
    others.set(pid, nick);
    /* A random name someone else just took is swapped quietly; a name picked from the list is kept */
    if (!state.joined && !state.nickChosen && nick === state.nick) { state.nick = freeName(state.nick); save(); }
    if (view === "landing") showNick();
  }
  /* Updates the name in place, so a cord pull in progress is never interrupted */
  function showNick() {
    const taken = takenNames();
    const el = document.getElementById("nick");
    if (!el) return;
    el.textContent = state.nick;
    app.querySelectorAll("[data-nick]").forEach(x => { x.textContent = state.nick; });
    const list = app.querySelector(".names");
    list.hidden = !state.choosing;
    const choose = app.querySelector('[data-a="choose"]');
    choose.textContent = state.choosing ? "Close" : "Choose";
    choose.setAttribute("aria-expanded", String(state.choosing));
    list.querySelectorAll("[data-n]").forEach(b => {
      const n = b.dataset.n, isTaken = taken.has(n) && n !== state.nick;
      b.setAttribute("aria-pressed", String(n === state.nick));
      b.disabled = isTaken;
      b.title = isTaken ? "Taken" : "";
    });
  }

  function lampSVG(L) {
    const k = L / 100, bead = 126 + k * 130;
    const mix = (a, b, u) => "#" + [1, 3, 5].map(i => Math.round(parseInt(a.slice(i, i + 2), 16) + (parseInt(b.slice(i, i + 2), 16) - parseInt(a.slice(i, i + 2), 16)) * u).toString(16).padStart(2, "0")).join("");
    return `
      <svg viewBox="0 0 350 300" aria-hidden="true">
        <defs>
          <linearGradient id="lampCone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD58A" stop-opacity="0.8"/><stop offset="1" stop-color="#FFD58A" stop-opacity="0"/></linearGradient>
          <radialGradient id="lampHalo" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFE3A3" stop-opacity="0.95"/><stop offset="1" stop-color="#FFE3A3" stop-opacity="0"/></radialGradient>
        </defs>
        <path d="M175 -24 V62" style="stroke: var(--muted)" stroke-width="2"/>
        <polygon points="140,100 210,100 350,300 0,300" fill="url(#lampCone)" opacity="${(k * 0.9).toFixed(2)}"/>
        <circle cx="175" cy="102" r="62" fill="url(#lampHalo)" opacity="${k.toFixed(2)}"/>
        <path d="M132 100 Q135 64 175 62 Q215 64 218 100 Z" fill="#1E2A33" stroke="#3A4A55" stroke-width="2"/>
        <ellipse cx="175" cy="101" rx="21" ry="7" fill="${mix("#3A4650", "#FFE6A8", k)}"/>
        <path d="M206 100 V${bead.toFixed(1)}" style="stroke: var(--muted)" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="0.1 5"/>
        <circle cx="206" cy="${bead.toFixed(1)}" r="12" style="fill: var(--accent)" stroke="#05090D" stroke-width="2"/>
        ${k < 0.6 ? `<text x="226" y="${(bead + 4).toFixed(1)}" style="fill: var(--accentText); font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.12em">PULL</text>` : ""}
      </svg>`;
  }

  function drawLamp() {
    const box = document.getElementById("lamp");
    const cord = box.querySelector(".cord");
    if (!cord.dataset.ready) {
      cord.dataset.ready = "1";
      let pulling = false;
      const fromPointer = e => {
        const r = box.getBoundingClientRect();
        const y = (e.clientY - r.top) / r.height * 300;
        setLight((y - 126) / 130 * 100);
      };
      cord.addEventListener("pointerdown", e => { pulling = true; try { cord.setPointerCapture(e.pointerId); } catch (_) { /* older browsers */ } fromPointer(e); });
      cord.addEventListener("pointermove", e => { if (pulling) fromPointer(e); });
      ["pointerup", "pointercancel"].forEach(ev => cord.addEventListener(ev, () => { pulling = false; }));
      cord.addEventListener("keydown", e => {
        const d = { ArrowDown: 5, ArrowRight: 5, ArrowUp: -5, ArrowLeft: -5 }[e.key];
        if (d !== undefined) { e.preventDefault(); setLight(state.L + d); }
      });
    }
    const L = state.L;
    box.querySelector(".lamp-art").innerHTML = lampSVG(L);
    box.querySelector(".title-big").style.opacity = (0.18 + 0.82 * Math.min(1, L / 25)).toFixed(2);
    cord.setAttribute("aria-valuenow", String(Math.round(L)));
    cord.setAttribute("aria-valuetext", lightName(L));
    document.getElementById("lvl").textContent = lightName(L);
    document.getElementById("pct").textContent = `light ${Math.round(L)}%`;
    document.body.style.background = roomBg(L);
  }

  function setLight(L) {
    state.L = Math.max(0, Math.min(100, Math.round(L)));
    applyTheme(state.L);
    drawLamp();
    save();
  }

  /* ---------- Lobby: joined, waiting for the presenter ---------- */
  function lobby() {
    applyTheme(state.L);
    app.onclick = e => {
      if (e.target.closest('[data-a="edit"]')) { state.joined = false; save(); update(); }
    };
    app.innerHTML = `
      ${topbar()}
      <div class="lobby">
        <div class="lobby-lamp">${lampSVG(state.L)}</div>
        <h1>You’re in</h1>
        <p class="sub">Playing as <b data-nick>${esc(state.nick)}</b> · ${lightName(state.L)}</p>
        <div class="waiting"><span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>${stage === null ? "Connecting…" : "Waiting for the presenter to start"}</div>
        <p class="fine">Keep this page open. Each card appears here when the presenter moves on.</p>
        <button type="button" class="link" data-a="edit">Change my name or light</button>
      </div>`;
  }

  /* ---------- One card, shown while the presenter is on it ---------- */
  function card(i) {
    applyTheme(state.L);
    app.onclick = null;
    const c = CARDS[i];
    app.innerHTML = `
      ${topbar()}
      <div class="progress">
        <div class="segs" aria-hidden="true">${CARDS.map((x, j) => `<i class="${j === i ? "now" : state.answers[x.key] !== undefined ? "done" : ""}"></i>`).join("")}</div>
        ${mono(`Card ${String(i + 1).padStart(2, "0")} / ${CARDS.length}`)}
      </div>
      <div class="head"><h1>${esc(c.title)}</h1>${c.kind === "stare" ? "" : `<p class="sub">${esc(c.sub)}</p>`}</div>
      <div class="body" id="cardbody"></div>
      <div class="sent-line" id="sent" aria-live="polite"></div>`;
    const done = renderCard(document.getElementById("cardbody"), c, state.answers[c.key], (v, now) => answer(c.key, v, now));
    showSent(c.key);
    return done;
  }

  function showSent(key, waiting) {
    const el = document.getElementById("sent");
    if (!el || view !== "q" + CARDS.findIndex(c => c.key === key)) return;
    const sent = state.sent[key] && !waiting;
    el.className = "sent-line" + (sent ? " ok" : "");
    el.innerHTML = sent
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5 L10 17 L19 7"/></svg><span>Sent. You can change it until the next card.</span>`
      : waiting ? `<span>Sending…</span>` : `<span>Answer here. The presenter moves everyone on.</span>`;
  }

  /* ---------- Private report ---------- */
  function reportScreen() {
    applyTheme(state.L);
    app.onclick = null;
    const a = { ...state.answers, light: state.L };
    const r = report(a);
    const level = k => Math.max(1, Math.min(5, Math.round(r.strain[k])));
    const colour = l => (l >= 4 ? "#C2412D" : l === 3 ? "#B7791F" : "#1E8A5A");
    const word = k => (k === "eyes" && level(k) >= 3 ? r.eyesNote : AREA_WORDS[k][level(k) - 1]);
    const dark = lightBucket(state.L) === "night";
    const tips = [r.prescription];
    const second = dark ? PRESCRIPTIONS.eyesDark : PRESCRIPTIONS.eyes;
    tips.push(second !== r.prescription ? second : PRESCRIPTIONS.posture !== r.prescription ? PRESCRIPTIONS.posture : PRESCRIPTIONS.energy);
    const LOGOFF = { packed: "laptop packed away", closed: "laptop closed, in sight", open: "laptop still open", meeting: "still in a meeting" };
    const facts = [
      a.fuel ? `Coffee to water · ${a.fuel.coffee} : ${a.fuel.water}` : "",
      a.logoff ? `5:00 pm · ${LOGOFF[a.logoff]}` : ""
    ].filter(Boolean);
    const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    app.innerHTML = `
      ${topbar(mono("Report ready", "acc"))}
      <div class="slip">
        <div class="slip-head"><span>Check-up report</span><span class="m">${date}</span></div>
        <div class="slip-meta">
          <span><small>Patient</small><b>${esc(state.nick)}</b></span>
          <span><small>Shift</small><b>7:00 to 4:00</b></span>
          <span><small>Room light</small><b>${lightName(state.L)}</b></span>
        </div>
        <div class="dash"></div>
        <div class="finding"><small>Primary finding</small><span><b>${r.finding}</b>${r.finding === "All clear" ? "" : `<span class="m">${SEVERITY[Math.round(r.strain[r.top])]}</span>`}</span></div>
        <div class="areas">
          <div class="areas-head"><span>Area</span><span>Strain · low to high</span></div>
          ${AREAS.map(k => `
            <div class="area"><b>${AREA_LABEL[k]}</b><span class="segs5" aria-label="${level(k)} of 5">${[0, 1, 2, 3, 4].map(i => `<i style="background: ${i < level(k) ? colour(level(k)) : "#D3DEE2"}"></i>`).join("")}</span><span class="w">${word(k)}</span></div>`).join("")}
        </div>
        <div class="dash"></div>
        <div class="rx"><small>Prescription</small>${tips.map(t => `<span class="box"></span><span>${t}</span>`).join("")}</div>
        ${facts.length ? `<div class="facts">${facts.map(f => `<span>${esc(f)}</span>`).join("")}</div>` : ""}
        <span class="stamp">Reviewed by the cat</span>
      </div>
      <p class="fine mono-fine">For fun, not a medical diagnosis. This report stays on your phone. The team’s results come up in the safety presentation.</p>
      <div class="waiting-box">Keep this page open. Three quick confessions and a vote pop up here during the talk. One tap each, anonymous.</div>`;
  }

  function closedScreen() {
    applyTheme(state.L);
    app.onclick = null;
    app.innerHTML = `
      ${topbar(state.joined ? undefined : " ")}
      <div class="center-msg">
        <h1>This game has ended</h1>
        <p class="sub">The presenter started a new one. Scan the new QR code on the shared screen to join it.</p>
      </div>`;
  }

  function lateScreen() {
    applyTheme(state.L);
    app.onclick = null;
    app.innerHTML = `
      ${topbar()}
      <div class="center-msg">
        <h1>The cards are done</h1>
        <p class="sub">This phone didn’t answer any, so there’s no report this time. Keep this page open: three quick confessions and a vote pop up here during the talk.</p>
      </div>`;
  }

  /* ---------- Talk companion: follows the presenter's slides ---------- */
  function renderSheet() {
    clearTimeout(thanksTimer);
    const isConfession = state.joined && stage in CONFESSIONS;
    const pending = (isConfession && state.taps[stage] === undefined) || (state.joined && stage === "vote" && state.vote === null);
    if (!pending) { sheet.hidden = true; sheet.innerHTML = ""; return; }
    if (!sheet.hidden && sheet.dataset.stage === stage) return;
    sheet.hidden = false;
    sheet.dataset.stage = stage;
    buzz([80, 60, 80]);
    const q = stage;
    sheet.innerHTML = isConfession ? `
      <div class="sheet-in" role="dialog" aria-modal="true" aria-label="Anonymous confession">
        ${mono(`Confession ${q.slice(1)} of 3 · anonymous`)}
        <p class="q">“${CONFESSIONS[q]}”</p>
        <div class="two"><button type="button" class="btn" data-v="1">Guilty</button><button type="button" class="btn no" data-v="0">Not me</button></div>
        <p class="fine">Not even the presenter sees who tapped what.</p>
      </div>` : `
      <div class="sheet-in" role="dialog" aria-modal="true" aria-label="Pick one habit">
        <p class="q">Which one will you start with this week?</p>
        <div class="habits">${HABITS.map((h, i) => `<button type="button" class="route" data-h="${i}"><span class="t">${esc(h)}</span></button>`).join("")}</div>
        <p class="fine">Anonymous. The screen shows totals only.</p>
      </div>`;
    sheet.onclick = e => {
      const v = e.target.closest("[data-v]")?.dataset.v;
      const h = e.target.closest("[data-h]")?.dataset.h;
      if (v !== undefined && q in CONFESSIONS) { state.taps[q] = Number(v); send({ t: "tap", q, v: Number(v) }); }
      else if (h !== undefined) { state.vote = Number(h); send({ t: "vote", v: Number(h) }); }
      else return;
      save();
      sheet.innerHTML = `<div class="sheet-in"><p class="q">Locked in.</p><p class="sub">Watch the shared screen.</p></div>`;
      thanksTimer = setTimeout(() => { sheet.hidden = true; sheet.innerHTML = ""; sheet.dataset.stage = ""; }, 1600);
    };
  }

  update();
}

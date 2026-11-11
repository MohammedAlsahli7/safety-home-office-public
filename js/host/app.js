/* Presenter, Kahoot style: join (QR) → one screen per card → wrap-up → 10 talk slides.
   The presenter drives the pace: every screen change is published as a `stage`, and phones
   show exactly that card (or the lobby, the report, a confession, the vote). Phones never move on
   by themselves. Share this tab in Teams.
   Buttons on screen, or keys: → Space PageDown next · ← PageUp back · F full screen · P presenter tools */
import { config, isSessionCode } from "../config.js";
import { store, randomCode } from "../store.js";
import { createRelay } from "../relay.js";
import { teamStats, applyMessage } from "../aggregate.js";
import { CARDS, POSES, poseIndex, lightName } from "../content.js";
import { SLIDES } from "./slides.js";
import { joinScreen, questionScreen, wrapScreen } from "./screens.js";
import { startDemo } from "./demo.js";
import { esc } from "./parts.js";
import { rawKpis, saveKpis, encodeKpis, importKpisFromHash } from "../kpis.js";

const stageEl = document.getElementById("stage");
const toolsEl = document.getElementById("tools");
const hintEl = document.getElementById("hint");
stageEl.innerHTML = `<div id="screen"></div><div id="controls"></div>`;
const screenEl = document.getElementById("screen");
const controlsEl = document.getElementById("controls");

const SCREENS = [
  { id: "join", stage: "lobby" },
  ...CARDS.map((c, i) => ({ id: "q" + (i + 1), card: i, stage: "q" + (i + 1) })),
  { id: "wrap", stage: "end" },
  ...SLIDES.map(s => ({ id: s.id, slide: s, stage: s.stage || "talk" }))
];
const FIRST_SLIDE = SCREENS.findIndex(s => s.slide);

/* ---------- Session ---------- */
function pickSession() {
  if (config.demo) return "demo" + randomCode(4);
  if (isSessionCode(config.session)) return config.session;
  const saved = store.get("host.session");
  if (isSessionCode(saved)) return saved;
  const fresh = randomCode(10);
  store.set("host.session", fresh);
  return fresh;
}
let session = pickSession();

function joinUrl() {
  const u = new URL("index.html", location.href);
  u.search = "";
  u.searchParams.set("s", session);
  if (config.customRelay) u.searchParams.set("relay", config.customRelay);
  if (config.demo) u.searchParams.set("demo", "");
  return u.toString().replace("demo=", "demo");
}

/* ---------- State ---------- */
let state, feed, newest, screen, relay, demo, lastStage, status = "idle", renderTimer = null, clockTimer = null, cardStarted = 0;

function boot() {
  state = { players: {}, taps: {}, votes: {} };
  feed = [];
  newest = null;
  lastStage = null;
  screen = config.demo ? 0 : Math.min(store.get("host.screen." + session, 0), SCREENS.length - 1);
  if (relay) relay.close();
  if (demo) demo.stop();
  relay = createRelay({
    session,
    onMessage,
    onStatus: s => { status = s; scheduleRender(); renderTools(); }
  });
  relay.connect();
  if (config.demo) demo = startDemo(m => relay.send(m));
  show();
}

function onMessage(m) {
  if (m && m.t === "stage") { lastStage = m.s; return; }
  const known = m && typeof m.p === "string" ? state.players[m.p] : null;
  const first = m && ((m.t === "ans" && known?.answers?.[m.k] === undefined) || (m.t === "join" && !known));
  if (!applyMessage(state, m)) return;
  if (m.t === "join") newest = state.players[m.p];
  /* A moment per player per card, read after a random delay so it can't be matched to whoever just answered */
  if (first) {
    setTimeout(() => {
      const line = moment(m.t, m.k, state.players[m.p]);
      if (!line || feed.slice(0, 4).includes(line)) return;
      feed.unshift(line);
      feed = feed.slice(0, 12);
      scheduleRender();
    }, 2000 + Math.random() * 6000);
  }
  scheduleRender();
}

function moment(t, k, p) {
  if (!p) return null;
  const a = p.answers || {};
  if (t === "join") return typeof a.light === "number" && (a.light < 10 || a.light > 90) ? `Someone set the light to ${lightName(a.light)}.` : null;
  const v = a[k];
  switch (k) {
    case "posture": return `Someone turned the dial to ${POSES[poseIndex(v)]}.`;
    case "fuel": return v.coffee >= 4 ? `Someone stacked ${v.coffee} cups of coffee yesterday.` : v.water >= 5 ? `Someone drank ${v.water} glasses of water yesterday.` : null;
    case "stare": return v >= 15 ? `Someone stared for ${v.toFixed(1)} seconds without blinking.` : null;
    case "coworker": return { cat: "Someone’s most frequent coworker is the cat.", kids: "Someone’s most frequent coworker is the kids.", door: "Someone’s most frequent coworker is the doorbell.", chat: "Someone’s most frequent coworker is the family group chat." }[v];
    case "laptop": return v === "bed" ? "Someone’s laptop lives in bed with them." : v === "lap" ? "Someone works from the sofa office." : null;
    case "lunch": return v === "none" ? "Someone skipped lunch yesterday." : null;
    case "news": return v === "refresh" ? "Someone refreshes the news before the alerts arrive." : null;
    case "logoff": return v === "open" || v === "meeting" ? "Someone’s laptop is still open at 4:30." : null;
    case "verdict": return v === 10 ? "Someone is never going back to the office." : v === 0 ? "Someone wants the office back." : null;
    default: return null;
  }
}

/* ---------- Rendering ---------- */
function scheduleRender() {
  if (renderTimer) return;
  renderTimer = setTimeout(() => { renderTimer = null; render(); }, 250);
}

function render() {
  const sc = SCREENS[screen];
  const stats = teamStats(state);
  if (sc.id === "join") screenEl.innerHTML = joinScreen({ url: joinUrl(), players: state.players, status, newest });
  else if (sc.card !== undefined) screenEl.innerHTML = questionScreen({ index: sc.card, stats, players: state.players, feed, status });
  else if (sc.id === "wrap") screenEl.innerHTML = wrapScreen({ stats, feed, status });
  else screenEl.innerHTML = sc.slide.render(SLIDES.indexOf(sc.slide) + 1, SLIDES.length, stats);
  /* Highlight Next once everyone has answered (the button itself is never re-created here) */
  const next = controlsEl.querySelector('[data-go="next"]');
  if (next && sc.card !== undefined) next.classList.toggle("ready", stats.joined > 0 && stats.answered[CARDS[sc.card].key] >= stats.joined);
}

/* The control bar is rebuilt only when the screen changes, so a click is never lost to a live update */
function renderControls() {
  const sc = SCREENS[screen];
  clearInterval(clockTimer);
  const back = `<button type="button" class="ctl ghost" data-go="back" aria-label="Back">← Back</button>`;
  if (sc.slide) {
    controlsEl.className = "controls quiet";
    controlsEl.innerHTML = `<button type="button" class="ctl round" data-go="back" aria-label="Previous slide">‹</button><button type="button" class="ctl round" data-go="next" aria-label="Next slide" ${screen === SCREENS.length - 1 ? "disabled" : ""}>›</button>`;
    return;
  }
  controlsEl.className = "controls";
  if (sc.id === "join") {
    controlsEl.innerHTML = `<span class="ctl-note">Phones wait on a lobby screen until you start.</span><button type="button" class="ctl primary" data-go="next">Start the game →</button>`;
  } else if (sc.card !== undefined) {
    const last = sc.card === CARDS.length - 1;
    controlsEl.innerHTML = `${back}<span class="ctl-note" id="clock"></span><button type="button" class="ctl primary" data-go="next">${last ? "Finish and send reports →" : "Next card →"}</button>`;
    const clock = document.getElementById("clock");
    const tick = () => { const s = Math.floor((Date.now() - cardStarted) / 1000); clock.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")} on this card`; };
    tick();
    clockTimer = setInterval(tick, 1000);
  } else {
    controlsEl.innerHTML = `${back}<span class="ctl-note"></span><button type="button" class="ctl primary" data-go="next">Start the talk →</button>`;
  }
}

function show() {
  cardStarted = Date.now();
  renderControls();
  render();
  publishStage();
}

function fit() {
  const s = Math.min(innerWidth / 1280, innerHeight / 720);
  stageEl.style.transform = `scale(${s})`;
}

/* ---------- Navigation and phone stages ---------- */
function go(i) {
  const to = Math.max(0, Math.min(SCREENS.length - 1, i));
  if (to === screen) return;
  screen = to;
  if (!config.demo) store.set("host.screen." + session, screen);
  show();
}

function publishStage() {
  const s = SCREENS[screen].stage;
  if (s === lastStage) return;
  lastStage = s;
  relay.send({ t: "stage", p: "host", s, at: Date.now() });
  if (demo) demo.onStage(s);
}

controlsEl.addEventListener("click", e => {
  const b = e.target.closest("[data-go]");
  if (!b) return;
  go(screen + (b.dataset.go === "next" ? 1 : -1));
  b.blur();
});

document.addEventListener("keydown", e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target.closest ? e.target : null;
  if (t && t.closest("input, textarea") && e.key !== "Escape") return;
  if (t && t.closest("button") && (e.key === " " || e.key === "Enter")) return;   /* the button handles it */
  const k = e.key;
  if (k === "ArrowRight" || k === " " || k === "PageDown" || k === "Enter") { e.preventDefault(); go(screen + 1); }
  else if (k === "ArrowLeft" || k === "PageUp") { e.preventDefault(); go(screen - 1); }
  else if (k === "Home") go(0);
  else if (k === "f" || k === "F") toggleFullscreen();
  else if (k === "p" || k === "P") { toolsEl.hidden = !toolsEl.hidden; renderTools(); }
  else if (k === "Escape") toolsEl.hidden = true;
});

function toggleFullscreen() {
  try {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  } catch (_) { /* not allowed here */ }
}

/* ---------- Presenter tools (P) ---------- */
function renderTools() {
  if (toolsEl.hidden) return;
  if (toolsEl.contains(document.activeElement) && ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
  toolsEl.innerHTML = `
    <h2>Presenter tools</h2>
    <span>Session <code>${esc(session)}</code> · relay <b>${esc(status)}</b>${config.demo ? " · demo" : ""}</span>
    <span>Join link</span><code>${esc(joinUrl())}</code>
    <button type="button" data-a="copy">Copy join link</button>
    <button type="button" data-a="talk">Skip to the talk (KPI slides)</button>
    ${config.demo ? "" : `<button type="button" data-a="new">Start a new session (clears rehearsal answers)</button>`}
    <button type="button" data-a="demo">${config.demo ? "Leave demo mode" : "Rehearse with 14 simulated players"}</button>
    <form id="kpiform" style="display: flex; flex-direction: column; gap: 6px; padding-top: 8px; border-top: 1px solid #DDD3C2">
      <b>KPI slide figures</b>
      <span style="color: #5F6A6B; font-size: 12px">Paste the KPI JSON. It stays in this browser only and is never published.</span>
      <textarea name="kpi" rows="9" spellcheck="false">${esc(JSON.stringify(rawKpis(), null, 2))}</textarea>
      <button type="submit">Save KPIs</button>
      <button type="button" data-a="kpilink">Copy a private presenter link with these KPIs</button>
    </form>
    <ul class="keys"><li>→ Space PageDown: next</li><li>← PageUp: back</li><li>F: full screen</li><li>P or Esc: close this panel</li></ul>`;
}

toolsEl.addEventListener("submit", e => {
  e.preventDefault();
  const btn = e.target.querySelector('[type="submit"]');
  try {
    saveKpis(JSON.parse(e.target.elements.kpi.value));
    btn.textContent = "Saved";
    render();
  } catch (_) {
    btn.textContent = "That isn't valid JSON. Check commas and quotes.";
  }
});

toolsEl.addEventListener("click", async e => {
  const a = e.target.closest("[data-a]")?.dataset.a;
  if (a === "kpilink") {
    const u = new URL("host.html", location.href);
    u.hash = "kpi=" + encodeKpis(rawKpis());
    try { await navigator.clipboard.writeText(u.toString()); e.target.textContent = "Copied. Share it privately only."; } catch (_) { e.target.textContent = "Copy failed"; }
    return;
  }
  if (a === "copy") {
    try { await navigator.clipboard.writeText(joinUrl()); e.target.textContent = "Copied"; } catch (_) { e.target.textContent = "Copy failed. Select the link above."; }
  } else if (a === "talk") {
    toolsEl.hidden = true;
    go(FIRST_SLIDE);
  } else if (a === "new" && confirm("Start a new session? Phones on the old QR code won't count.")) {
    session = randomCode(10);
    store.set("host.session", session);
    store.set("host.screen." + session, 0);
    const u = new URL(location.href); u.searchParams.delete("s"); history.replaceState(null, "", u);
    boot();
    renderTools();
  } else if (a === "demo") {
    const u = new URL(location.href);
    if (config.demo) u.searchParams.delete("demo"); else u.searchParams.set("demo", "");
    location.href = u.toString().replace("demo=", "demo");
  }
});

addEventListener("resize", fit);
importKpisFromHash();
fit();
boot();
hintEl.classList.add("show");
setTimeout(() => hintEl.classList.remove("show"), 5000);

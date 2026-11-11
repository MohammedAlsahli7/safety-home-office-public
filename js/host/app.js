/* Presenter: join screen → live screen → 8 slides. Share this tab in Teams.
   Keys: → Space PageDown next · ← PageUp back · F full screen · P presenter tools */
import { config, isSessionCode } from "../config.js";
import { store, randomCode } from "../store.js";
import { createRelay } from "../relay.js";
import { teamStats, applyMessage } from "../aggregate.js";
import { POSES, poseIndex, lightName } from "../content.js";
import { SLIDES } from "./slides.js";
import { joinScreen, liveScreen } from "./screens.js";
import { startDemo } from "./demo.js";
import { esc } from "./parts.js";
import { rawKpis, saveKpis, encodeKpis, importKpisFromHash } from "../kpis.js";

const stageEl = document.getElementById("stage");
const toolsEl = document.getElementById("tools");
const hintEl = document.getElementById("hint");

const SCREENS = [{ id: "join" }, { id: "live" }, ...SLIDES.map(s => ({ id: s.id, slide: s }))];

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
let state, feed, newest, screen, relay, demo, lastStage, status = "idle", renderTimer = null;

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
    onMessage: onMessage,
    onStatus: s => { status = s; scheduleRender(); renderTools(); }
  });
  relay.connect();
  if (config.demo) demo = startDemo(m => relay.send(m));
  render();
  publishStage();
}

function onMessage(m) {
  if (m && m.t === "stage") { lastStage = m.s; return; }
  if (!applyMessage(state, m)) return;
  if (m.t === "join") newest = state.players[m.p];
  const line = moment(m);
  /* Random delay so a moment can't be matched to the window that just moved */
  if (line) setTimeout(() => { if (feed.slice(0, 4).includes(line)) return; feed.unshift(line); feed = feed.slice(0, 12); scheduleRender(); }, 2000 + Math.random() * 6000);
  scheduleRender();
}

function moment(m) {
  if (m.t === "join" && typeof m.L === "number" && (m.L < 10 || m.L > 90)) return `Someone set the light to ${lightName(m.L)}.`;
  if (m.t !== "ans") return null;
  const v = m.v;
  switch (m.k) {
    case "posture": return `Someone turned the dial to ${POSES[poseIndex(v)]}.`;
    case "fuel": return v.coffee >= 4 ? `Someone had ${v.coffee} coffees yesterday.` : v.water >= 5 ? `Someone drank ${v.water} glasses of water yesterday.` : null;
    case "stare": return v >= 15 ? `Someone stared for ${v.toFixed(1)} seconds without blinking.` : null;
    case "coworker": return { cat: "Someone’s most frequent coworker is the cat.", kids: "Someone’s most frequent coworker is the kids.", door: "Someone’s most frequent coworker is the doorbell.", chat: "Someone’s most frequent coworker is the family group chat." }[v];
    case "laptop": return v === "bed" ? "Someone’s laptop lives in bed with them." : null;
    case "lunch": return v === "none" ? "Someone skipped lunch yesterday." : null;
    case "news": return v === "refresh" ? "Someone refreshes the news before the alerts arrive." : null;
    case "logoff": return v === "open" || v === "meeting" ? "Someone’s laptop is still open at 4:30." : null;
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
  if (sc.id === "join") stageEl.innerHTML = joinScreen({ url: joinUrl(), players: state.players, status, newest });
  else if (sc.id === "live") stageEl.innerHTML = liveScreen({ stats, feed, status, url: joinUrl() });
  else stageEl.innerHTML = sc.slide.render(SLIDES.indexOf(sc.slide) + 1, SLIDES.length, stats);
}

function fit() {
  const s = Math.min(innerWidth / 1280, innerHeight / 720);
  stageEl.style.transform = `scale(${s})`;
}

/* ---------- Navigation and phone stages ---------- */
function go(i) {
  screen = Math.max(0, Math.min(SCREENS.length - 1, i));
  if (!config.demo) store.set("host.screen." + session, screen);
  render();
  publishStage();
}

function publishStage() {
  const s = SCREENS[screen].slide?.stage || "";
  if (s === lastStage) return;
  lastStage = s;
  relay.send({ t: "stage", p: "host", s, at: Date.now() });
  if (demo) demo.onStage(s);
}

document.addEventListener("keydown", e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.target.closest && e.target.closest("input, textarea")) return;
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

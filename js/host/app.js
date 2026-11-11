/* Presenter, Kahoot style: join (QR) → one screen per card → wrap-up → 10 talk slides.
   The presenter drives the pace: every screen change is published as a `stage`, and phones
   show exactly that card (or the lobby, the report, a confession, the vote). Phones never move on
   by themselves. Share this tab in Teams.
   Only the browser that started the session can move the phones: every stage is signed with a key
   that never leaves it (see ../sign.js). Anyone else who opens host.html with the session code gets a
   locked page, and phones ignore unsigned or replayed stages.
   Buttons on screen, or keys: → Space PageDown next · ← PageUp back · F full screen · P presenter tools */
import { config, isSessionCode } from "../config.js";
import { store } from "../store.js";
import { createRelay } from "../relay.js";
import { teamStats, applyMessage } from "../aggregate.js";
import { CARDS, POSES, poseIndex, lightName } from "../content.js";
import { SLIDES } from "./slides.js";
import { introScreen, joinScreen, questionScreen, wrapScreen } from "./screens.js";
import { startDemo } from "./demo.js";
import { esc } from "./parts.js";
import { rawKpis, saveKpis, encodeKpis, importKpisFromHash, loadKpis } from "../kpis.js";
import { canSign, newHostKey, signer, verifier, stageText, fingerprint, b64url, fromB64url } from "../sign.js";

const stageEl = document.getElementById("stage");
const toolsEl = document.getElementById("tools");
const hintEl = document.getElementById("hint");
stageEl.innerHTML = `<div id="screen"></div><div id="controls"></div>`;
const screenEl = document.getElementById("screen");
const controlsEl = document.getElementById("controls");

const SCREENS = [
  { id: "intro", stage: "lobby" },
  { id: "join", stage: "lobby" },
  ...CARDS.map((c, i) => ({ id: "q" + (i + 1), card: i, stage: "q" + (i + 1) })),
  { id: "wrap", stage: "end" },
  ...SLIDES.map(s => ({ id: s.id, slide: s, stage: s.stage || "talk" }))
];
const FIRST_SLIDE = SCREENS.findIndex(s => s.slide);

/* ---------- Session and presenter key ---------- */
let session = null, hostKey = null, sign = null, verifyOwn = null;
const keyFor = s => { const k = store.get("host.key." + s); return k && k.priv && k.pub ? k : null; };

/* The meeting's session is saved as host.session; a demo's as host.demo, so neither replaces the other */
const SAVED = config.demo ? "host.demo" : "host.session";
async function freshSession() {
  hostKey = await newHostKey();
  session = await fingerprint(hostKey.pub);   /* the session code is the key's fingerprint */
  store.set("host.key." + session, hostKey);
  store.set(SAVED, session);
  store.set("host.screen." + session, 0);
}

/* The private presenter link carries the key in its #hash: host.html?s=…#key=… */
function importKeyFromHash() {
  const m = location.hash.match(/(?:^#|&)key=([A-Za-z0-9_-]+)/);
  if (!m || !isSessionCode(config.session)) return;
  try {
    const k = JSON.parse(new TextDecoder().decode(fromB64url(m[1])));
    if (k && k.priv && k.pub) { store.set("host.key." + config.session, k); store.set("host.session", config.session); }
  } catch (_) { /* a damaged link: ignore it */ }
}

/* Returns true when this browser may present this session */
async function claimSession() {
  if (!canSign()) return false;
  /* A demo is a real, signed session too (so real phones can join), saved apart from the meeting's */
  const matches = async s => { const k = keyFor(s); return k && (await fingerprint(k.pub)) === s ? k : null; };
  if (isSessionCode(config.session) && !config.demo) {
    session = config.session;
    hostKey = await matches(session);
    if (!hostKey) return false;
  } else {
    const saved = store.get(SAVED);
    const k = isSessionCode(saved) ? await matches(saved) : null;
    if (k) { session = saved; hostKey = k; }
    else await freshSession();   /* also replaces sessions from before the short links */
  }
  sign = await signer(hostKey.priv);
  verifyOwn = await verifier(hostKey.pub);
  return true;
}

/* The attendees' link: the site, then ?s=<16-character code>. It carries no data. */
function joinUrl() {
  const u = new URL("./", location.href);
  u.search = "";
  u.hash = "";
  u.searchParams.set("s", session);
  if (config.customRelay) u.searchParams.set("relay", config.customRelay);
  return u.toString();
}

/* ---------- State ---------- */
let state, feed, newest, screen, relay, demo, lastStage, status = "idle", renderTimer = null, cardStarted = 0;
let lastAt = 0, sendChain = Promise.resolve(), revealed = new Set(), lastStats = null;
let animUntil = 0, animTimer = null, gameStartedAt = 0, talkStartedAt = 0;

/* Speaker notes: a separate window (notes.html) in this same browser. It follows the screens,
   shows the script with live numbers, and can press Back and Next. Nothing here is shared on screen. */
const notesChannel = (() => { try { return new BroadcastChannel("hoc-notes"); } catch (_) { return null; } })();
let notesWin = null;
function openNotes() {
  notesWin = window.open("notes.html", "hoc-notes", "width=560,height=820");
  if (notesWin) notesWin.focus();
}
function postNotes() {
  if (!notesChannel || !relay) return;
  const sc = SCREENS[screen], nx = SCREENS[screen + 1];
  const nextBtn = controlsEl.querySelector('[data-go="next"]');
  notesChannel.postMessage({
    type: "state", index: screen, total: SCREENS.length, id: sc.id, nextId: nx ? nx.id : null,
    nextLabel: sc.slide ? (nx ? "Next slide →" : "Last slide") : nextBtn ? nextBtn.textContent.trim() : "Next →", firstSlide: FIRST_SLIDE,
    screenStartedAt: cardStarted, gameStartedAt, talkStartedAt, stats: lastStats
  });
}
if (notesChannel) notesChannel.onmessage = e => {
  const d = e.data || {};
  if (!relay) return;
  if (d.type === "hello") postNotes();
  else if (d.type === "go") { if (d.dir > 0) advance(); else go(screen - 1); }
};

/* Animations play on the presenter page even when the laptop asks for reduced motion (it's a
   presentation); P → Animations turns them off. */
const motionOn = () => store.get("host.motion", true) !== false;
const applyMotion = () => document.documentElement.classList.toggle("calm", !motionOn());
applyMotion();

/* Plays an animation class on the screen container; live updates wait until it ends */
function animate(cls) {
  screenEl.classList.remove("enter", "reveal");
  void screenEl.offsetWidth;
  screenEl.classList.add(cls);
  const ms = motionOn() ? 1300 : 0;
  animUntil = Date.now() + ms;
  clearTimeout(animTimer);
  animTimer = setTimeout(() => screenEl.classList.remove(cls), ms);
}

function boot() {
  state = { players: {}, taps: {}, votes: {} };
  feed = [];
  newest = null;
  lastStage = null;
  lastAt = 0;
  revealed = new Set();
  screen = Math.min(store.get("host.screen." + session, 0), SCREENS.length - 1);
  if (relay) relay.close();
  if (demo) demo.stop();
  relay = createRelay({
    session,
    onMessage,
    onStatus: s => { status = s; scheduleRender(); renderTools(); }
  });
  relay.connect();
  /* Simulated players play on this laptop only. Their joins go out once per session, so real phones
     skip their names. After a reload they catch up at once on every screen already shown. */
  if (config.demo) {
    const announce = !store.get("host.demoJoined." + session);
    store.set("host.demoJoined." + session, true);
    demo = startDemo(m => { onMessage(m); if (m.t === "join" && announce) relay.send(m); }, { instant: screen > 0 });
    demo.catchUp(SCREENS.slice(0, screen).map(s => s.stage));
  }
  show();
}

function onMessage(m) {
  if (m && m.t === "stage") {
    /* Our own earlier stages (after a reload or on a second device) keep the clock moving forward */
    if (verifyOwn && Number.isFinite(m.at) && m.at > lastAt) verifyOwn(stageText(session, m.s, m.at), m.sig).then(ok => { if (ok) lastAt = Math.max(lastAt, m.at); });
    return;
  }
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
    case "logoff": return v === "open" || v === "meeting" ? "Someone’s laptop is still open at 5:00." : null;
    case "verdict": return v === 10 ? "Someone is never going back to the office." : v === 0 ? "Someone wants the office back." : null;
    default: return null;
  }
}

/* ---------- Rendering ---------- */
function scheduleRender() {
  if (renderTimer) return;
  renderTimer = setTimeout(() => { renderTimer = null; render(); }, Math.max(250, animUntil - Date.now()));
}

function render() {
  const sc = SCREENS[screen];
  const stats = lastStats = teamStats(state);
  const card = sc.card !== undefined ? CARDS[sc.card] : null;
  const answered = card ? stats.answered[card.key] || 0 : 0;
  const everyone = stats.joined > 0 && answered >= stats.joined;
  /* Results appear by themselves once everyone has answered, or when the presenter asks */
  const autoReveal = card && everyone && answered >= config.minGroup && !revealed.has(sc.card);
  if (autoReveal) revealed.add(sc.card);
  if (sc.id === "intro") screenEl.innerHTML = introScreen(loadKpis().intro);
  else if (sc.id === "join") { screenEl.innerHTML = joinScreen({ url: joinUrl(), players: state.players, status, newest }); fitNames(); }
  else if (sc.card !== undefined) screenEl.innerHTML = questionScreen({ index: sc.card, stats, players: state.players, feed, status, shown: revealed.has(sc.card) });
  else if (sc.id === "wrap") screenEl.innerHTML = wrapScreen({ stats, feed, status });
  else screenEl.innerHTML = sc.slide.render(SLIDES.indexOf(sc.slide) + 1, SLIDES.length, stats);
  if (autoReveal) animate("reveal");
  if (notesChannel && !render.notesTimer) render.notesTimer = setTimeout(() => { render.notesTimer = null; postNotes(); }, 600);
  /* The main button: "Show answers" first, then "Next card". Only its text changes here, never the element */
  const next = controlsEl.querySelector('[data-go="next"]');
  if (next && card) {
    const label = canReveal() ? "Show answers" : sc.card === CARDS.length - 1 ? "Finish and send reports →" : "Next card →";
    if (next.textContent !== label) next.textContent = label;
    next.classList.toggle("ready", everyone);
  }
}

/* Every name that joined stays on the join screen: the name tags shrink until they all fit */
function fitNames() {
  const box = document.getElementById("names");
  if (!box) return;
  let size = 17;
  box.style.setProperty("--chip", size + "px");
  while (box.scrollHeight > box.clientHeight + 1 && size > 9) {
    size -= 1;
    box.style.setProperty("--chip", size + "px");
  }
}

/* The control bar is rebuilt only when the screen changes, so a click is never lost to a live update */
function renderControls() {
  const sc = SCREENS[screen];
  const back = `<button type="button" class="ctl ghost" data-go="back" aria-label="Back">← Back</button>`;
  if (sc.slide) {
    controlsEl.className = "controls quiet";
    controlsEl.innerHTML = `<button type="button" class="ctl round" data-go="back" aria-label="Previous slide">‹</button><button type="button" class="ctl round" data-go="next" aria-label="Next slide" ${screen === SCREENS.length - 1 ? "disabled" : ""}>›</button>`;
    return;
  }
  controlsEl.className = "controls";
  if (sc.id === "intro") {
    controlsEl.innerHTML = `<span class="ctl-note"></span><button type="button" class="ctl primary" data-go="next">Show the QR code →</button>`;
  } else if (sc.id === "join") {
    controlsEl.innerHTML = `${back}<span class="ctl-note"></span><button type="button" class="ctl primary" data-go="next">Start the game →</button>`;
  } else if (sc.card !== undefined) {
    const last = sc.card === CARDS.length - 1;
    controlsEl.innerHTML = `${back}<span class="ctl-note"></span><button type="button" class="ctl primary" data-go="next">${last ? "Finish and send reports →" : "Next card →"}</button>`;
  } else {
    controlsEl.innerHTML = `${back}<span class="ctl-note"></span><button type="button" class="ctl primary" data-go="next">Start the talk →</button>`;
  }
}

function show() {
  cardStarted = Date.now();
  const sc = SCREENS[screen];
  if (sc.card !== undefined && !gameStartedAt) gameStartedAt = cardStarted;
  if (sc.slide && !talkStartedAt) talkStartedAt = cardStarted;
  renderControls();
  render();
  animate("enter");
  publishStage();
  postNotes();
}

function fit() {
  const s = Math.min(innerWidth / 1280, innerHeight / 720);
  stageEl.style.transform = `scale(${s})`;
}

/* ---------- Navigation and phone stages ---------- */
/* Every card gets a "Show answers" step. Below the minimum group the screen says how many more are
   needed, and the counts fill in by themselves when the 5th answer arrives. */
function canReveal() {
  const sc = SCREENS[screen];
  return sc.card !== undefined && !revealed.has(sc.card);
}

/* Next: on a card, show its answers first (like Kahoot's results), then move on */
function advance() {
  if (canReveal()) { revealed.add(SCREENS[screen].card); render(); animate("reveal"); postNotes(); return; }
  go(screen + 1);
}

function go(i) {
  const to = Math.max(0, Math.min(SCREENS.length - 1, i));
  if (to === screen) return;
  screen = to;
  store.set("host.screen." + session, screen);
  show();
}

/* Tells phones on this session that it's over, so they ask for the new QR code instead of waiting */
function closeSession() {
  sendChain = sendChain.then(async () => {
    const at = lastAt = Math.max(Date.now(), lastAt + 1);
    const msg = { t: "stage", p: "host", s: "closed", at };
    if (sign) { msg.pk = hostKey.pub; msg.sig = await sign(stageText(session, "closed", at)); }
    relay.send(msg);
  }).catch(() => {});
  return sendChain;
}

function publishStage() {
  const s = SCREENS[screen].stage;
  if (s === lastStage) return;
  lastStage = s;
  if (demo) demo.onStage(s);
  /* Signed and sent in order; `at` only ever grows, so phones can drop replays */
  sendChain = sendChain.then(async () => {
    const at = lastAt = Math.max(Date.now(), lastAt + 1);
    const msg = { t: "stage", p: "host", s, at };
    if (sign) { msg.pk = hostKey.pub; msg.sig = await sign(stageText(session, s, at)); }
    relay.send(msg);
  }).catch(() => { /* never block later stages */ });
}

controlsEl.addEventListener("click", e => {
  const b = e.target.closest("[data-go]");
  if (!b) return;
  if (b.dataset.go === "next") advance(); else go(screen - 1);
  b.blur();
});

document.addEventListener("keydown", e => {
  if (!relay || e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target.closest ? e.target : null;
  if (t && t.closest("input, textarea") && e.key !== "Escape") return;
  if (t && t.closest("button") && (e.key === " " || e.key === "Enter")) return;   /* the button handles it */
  const k = e.key;
  if (k === "ArrowRight" || k === " " || k === "PageDown" || k === "Enter") { e.preventDefault(); advance(); }
  else if (k === "ArrowLeft" || k === "PageUp") { e.preventDefault(); go(screen - 1); }
  else if (k === "Home") go(0);
  else if (k === "f" || k === "F") toggleFullscreen();
  else if (k === "p" || k === "P") { toolsEl.hidden = !toolsEl.hidden; renderTools(); }
  else if (k === "n" || k === "N") openNotes();
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
    <button type="button" data-a="notes">Open speaker notes (N): a separate window only you see</button>
    <button type="button" data-a="talk">Skip to the talk (KPI slides)</button>
    <button type="button" data-a="motion">Animations: ${motionOn() ? "on" : "off"}</button>
    <button type="button" data-a="new">${config.demo ? "Start a new demo (new QR code)" : "Start a new session (clears rehearsal answers)"}</button>
    <button type="button" data-a="demo">${config.demo ? "Leave demo mode" : "Demo: add 14 simulated players (real phones can join too)"}</button>
    <form id="kpiform" style="display: flex; flex-direction: column; gap: 6px; padding-top: 8px; border-top: 1px solid #DDD3C2">
      <b>Private slide data: your introduction and the KPIs</b>
      <span style="color: #5F6A6B; font-size: 12px">Paste the JSON from docs/kpis.json. It stays in this browser only and is never published.</span>
      <textarea name="kpi" rows="9" spellcheck="false">${esc(JSON.stringify(rawKpis(), null, 2))}</textarea>
      <button type="submit">Save</button>
      <button type="button" data-a="kpilink">Copy a private presenter link (this session, its key and these KPIs)</button>
    </form>
    <ul class="keys"><li>→ Space PageDown: next</li><li>← PageUp: back</li><li>F: full screen</li><li>N: speaker notes</li><li>P or Esc: close this panel</li></ul>`;
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
    u.search = "";
    if (!config.demo) u.searchParams.set("s", session);
    if (config.customRelay) u.searchParams.set("relay", config.customRelay);
    u.hash = "kpi=" + encodeKpis(rawKpis()) + (hostKey ? "&key=" + b64url(new TextEncoder().encode(JSON.stringify(hostKey))) : "");
    try { await navigator.clipboard.writeText(u.toString()); e.target.textContent = "Copied. Share it privately only."; } catch (_) { e.target.textContent = "Copy failed"; }
    return;
  }
  if (a === "copy") {
    try { await navigator.clipboard.writeText(joinUrl()); e.target.textContent = "Copied"; } catch (_) { e.target.textContent = "Copy failed. Select the link above."; }
  } else if (a === "notes") {
    openNotes();
  } else if (a === "motion") {
    store.set("host.motion", !motionOn());
    applyMotion();
    e.target.textContent = `Animations: ${motionOn() ? "on" : "off"}`;
  } else if (a === "talk") {
    toolsEl.hidden = true;
    go(FIRST_SLIDE);
  } else if (a === "new" && confirm("Start a new session? Phones on the old QR code will be told to scan the new one.")) {
    await closeSession();
    await freshSession();
    sign = await signer(hostKey.priv);
    verifyOwn = await verifier(hostKey.pub);
    const u = new URL(location.href); u.searchParams.delete("s"); history.replaceState(null, "", u);
    boot();
    renderTools();
  } else if (a === "demo") {
    const u = new URL(location.href);
    if (config.demo) u.searchParams.delete("demo"); else u.searchParams.set("demo", "");
    location.href = u.toString().replace("demo=", "demo");
  }
});

/* Someone else's session: a locked page that sends nothing */
function locked() {
  screenEl.innerHTML = `
  <div class="slide">
    <div class="s-body" style="justify-content: center; max-width: 900px; gap: 24px">
      <h1 class="h" style="font-size: 96px">This presenter view is locked</h1>
      <p style="margin: 0; font-size: 26px; line-height: 1.4; color: var(--sub)">${canSign()
        ? "The game is run from the presenter’s own browser, and phones only follow that one. Opening this page changes nothing for anyone."
        : "This browser can’t sign the presenter’s moves here. Open the presenter page over https (GitHub Pages) or on localhost."}</p>
      <p style="margin: 0; font-size: 19px; line-height: 1.5; color: var(--muted)">Presenting? Open host.html without a session code to start your own session, or use your private presenter link.</p>
    </div>
  </div>`;
}

addEventListener("resize", fit);
importKeyFromHash();
importKpisFromHash();
if (location.hash) history.replaceState(null, "", location.pathname + location.search);
fit();
claimSession().then(ok => {
  if (!ok) { locked(); return; }
  boot();   /* the key hints live in the tools panel (P) and the notes window, not on the shared screen */
});

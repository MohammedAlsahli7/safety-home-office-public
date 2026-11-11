/* Speaker notes window. Opened from the presenter page (key N); it lives in its own window, so it
   is never part of the shared Teams window. It follows the presenter over a BroadcastChannel in
   this browser, shows the script for the current screen with live team numbers filled in, lets the
   presenter edit it (saved in this browser), and can press Back and Next. */
import { store } from "../store.js";
import { loadKpis } from "../kpis.js";
import { TITLES, TARGETS, DEFAULTS, kpiDefault, tokens, TOKEN_HELP } from "../notes-data.js";

const root = document.getElementById("notes");
const channel = (() => { try { return new BroadcastChannel("hoc-notes"); } catch (_) { return null; } })();
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const KPI_IDS = ["intro", "courses", "phishing", "incidents"];

let st = null, editing = false, size = store.get("notes.size", 22), saveTimer = null;
const edits = () => store.get("notes", {});
const defaultFor = id => (KPI_IDS.includes(id) ? kpiDefault(id, loadKpis()) : DEFAULTS[id] || "");
const scriptFor = id => (id in edits() ? edits()[id] : defaultFor(id));
const clock = ms => { const s = Math.max(0, Math.floor(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };

/* Plain text → paragraphs; {token} → live number; (line) → stage direction; **x** → bold */
function toHtml(text, live) {
  return text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean).map(p => {
    let h = esc(p).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\n/g, "<br>");
    h = h.replace(/\{(\w+)\}/g, (m, k) => (k in live ? (live[k] === null ? `<mark class="wait" title="Shows at 5 answers">[${k}: not enough answers yet]</mark>` : `<mark>${esc(live[k])}</mark>`) : m));
    return /^\(.*\)$/s.test(p) ? `<p class="dir">${h}</p>` : `<p>${h}</p>`;
  }).join("");
}

function frame() {
  root.innerHTML = `
    <header class="bar">
      <div class="where"><span id="pos"></span><b id="title"></b></div>
      <div class="clocks"><span id="c-screen" title="Time on this screen"></span><span id="c-total"></span><span id="target"></span></div>
    </header>
    <nav class="drive">
      <button type="button" class="ghost" data-go="-1">← Back</button>
      <button type="button" class="primary" data-go="1" id="next">Next →</button>
    </nav>
    <section class="script" id="script" style="font-size: ${size}px"></section>
    <textarea id="editor" hidden spellcheck="true" aria-label="Script for this screen"></textarea>
    <div class="row">
      <button type="button" id="toggle">Edit this script</button>
      <button type="button" id="reset">Reset to the default</button>
      <span class="size"><button type="button" data-size="-2" aria-label="Smaller text">A−</button><button type="button" data-size="2" aria-label="Larger text">A+</button></span>
    </div>
    <section class="help" id="help" hidden></section>
    <footer class="up-next"><span>Next</span><b id="next-title"></b><div id="next-first"></div></footer>`;
}

function waiting() {
  root.innerHTML = `<div class="wait-box"><b>Waiting for the presenter page…</b><p>Open host.html in this browser and press N, or keep this window open: it connects by itself.</p></div>`;
}

function paint() {
  if (!st) return waiting();
  if (!document.getElementById("script")) frame();
  const live = tokens(st.stats);
  document.getElementById("pos").textContent = `${st.index + 1} / ${st.total}`;
  document.getElementById("title").textContent = TITLES[st.id] || st.id;
  document.getElementById("next").textContent = st.nextLabel || "Next →";
  document.getElementById("target").textContent = TARGETS[st.id] ? `aim ${TARGETS[st.id]}` : "";
  document.getElementById("next-title").textContent = st.nextId ? TITLES[st.nextId] || st.nextId : "The end";
  const nextText = st.nextId ? scriptFor(st.nextId).split(/\n/)[0] : "";
  document.getElementById("next-first").innerHTML = nextText ? toHtml(nextText.length > 160 ? nextText.slice(0, 160) + "…" : nextText, live) : "";
  document.getElementById("reset").disabled = !(st.id in edits());
  if (!editing) document.getElementById("script").innerHTML = toHtml(scriptFor(st.id), live) || `<p class="dir">(No script for this screen. Press Edit to write one.)</p>`;
  tick();
}

function tick() {
  if (!st) return;
  const now = Date.now();
  const cs = document.getElementById("c-screen"), ct = document.getElementById("c-total");
  if (!cs) return;
  cs.textContent = `${clock(now - st.screenStartedAt)} here`;
  ct.textContent = st.talkStartedAt ? `talk ${clock(now - st.talkStartedAt)}` : st.gameStartedAt ? `game ${clock(now - st.gameStartedAt)}` : "";
}

function startEdit() {
  editing = true;
  const ed = document.getElementById("editor");
  ed.value = scriptFor(st.id);
  ed.style.fontSize = Math.max(15, size - 4) + "px";
  ed.hidden = false;
  document.getElementById("script").hidden = true;
  document.getElementById("toggle").textContent = "Done";
  const live = tokens(st.stats);
  const help = document.getElementById("help");
  help.hidden = false;
  help.innerHTML = `<b>Live numbers you can type</b><p>Write <code>{c1}</code> and it shows as the live number. Put a stage direction in (parentheses). Wrap words in **double stars** for bold. Saved in this browser as you type.</p>
    <dl>${Object.entries(TOKEN_HELP).map(([k, t]) => `<dt><code>{${k}}</code></dt><dd>${esc(t)}${live[k] ? ` · now <mark>${esc(live[k])}</mark>` : ""}</dd>`).join("")}</dl>`;
  ed.focus();
}

function stopEdit() {
  editing = false;
  save();
  document.getElementById("editor").hidden = true;
  document.getElementById("script").hidden = false;
  document.getElementById("help").hidden = true;
  document.getElementById("toggle").textContent = "Edit this script";
  paint();
}

function save() {
  clearTimeout(saveTimer);
  if (!st) return;
  const ed = document.getElementById("editor");
  if (!ed || ed.hidden) return;
  const all = edits();
  if (ed.value.trim() === defaultFor(st.id).trim()) delete all[st.id]; else all[st.id] = ed.value;
  store.set("notes", all);
}

root.addEventListener("input", e => {
  if (e.target.id === "editor") { clearTimeout(saveTimer); saveTimer = setTimeout(save, 400); }
});
root.addEventListener("click", e => {
  const go = e.target.closest("[data-go]");
  if (go) { if (editing) stopEdit(); if (channel) channel.postMessage({ type: "go", dir: Number(go.dataset.go) }); return; }
  const sz = e.target.closest("[data-size]");
  if (sz) {
    size = Math.max(14, Math.min(40, size + Number(sz.dataset.size)));
    store.set("notes.size", size);
    document.getElementById("script").style.fontSize = size + "px";
    return;
  }
  if (e.target.id === "toggle") { if (editing) stopEdit(); else startEdit(); }
  if (e.target.id === "reset" && st && confirm("Go back to the default script for this screen? Your edit for it will be removed.")) {
    const all = edits(); delete all[st.id]; store.set("notes", all);
    if (editing) document.getElementById("editor").value = defaultFor(st.id);
    paint();
  }
});
document.addEventListener("keydown", e => {
  if (editing || e.metaKey || e.ctrlKey || e.altKey || e.target.closest("textarea, button")) return;
  const dir = { ArrowRight: 1, PageDown: 1, " ": 1, ArrowLeft: -1, PageUp: -1 }[e.key];
  if (dir && channel) { e.preventDefault(); channel.postMessage({ type: "go", dir }); }
});

if (channel) {
  channel.onmessage = e => {
    const d = e.data || {};
    if (d.type !== "state") return;
    const moved = !st || st.id !== d.id;
    if (moved && editing) stopEdit();
    st = d;
    paint();
    if (moved) { const sc = document.getElementById("script"); if (sc) { sc.classList.remove("in"); void sc.offsetWidth; sc.classList.add("in"); } window.scrollTo(0, 0); }
  };
  const hello = () => { if (!st) channel.postMessage({ type: "hello" }); };
  hello();
  setInterval(hello, 1500);
} else {
  root.innerHTML = `<div class="wait-box"><b>This browser can’t link the notes window to the presenter page.</b></div>`;
}
addEventListener("beforeunload", save);
setInterval(tick, 1000);
waiting();

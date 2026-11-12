/* Card renderers, ported from the design canvas. Each takes (el, card, value, set) and draws one
   card body into el. set(value, now) records an answer: the app sends it straight away when
   `now` is true (a tap), or after the player pauses (a drag or a counter).
   A renderer may return a cleanup function; the app calls it before the card leaves the screen. */
import { POSES, poseIndex, VERDICT_NOTES, fmtSteps } from "../content.js";
import { config } from "../config.js";
import { skeletonSVG } from "../skeleton.js";
import { TILE_ART, ROUTES, standRing, newsPhone, cupTower, waterGlass, MAX_CUPS, MAX_GLASSES, MAX_COUNT, stepsRings, stepsOffset } from "./art.js";

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
/* Phones follow their own reduced-motion setting; the presenter page (html.present) has its own switch (html.calm) */
const reduced = () => {
  const html = document.documentElement.classList;
  if (html.contains("present")) return html.contains("calm");
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
};

export function renderCard(el, card, value, set) {
  const kind = card.kind === "options" ? card.layout : card.kind;
  return ({ tiles, routes, stand, news, dial, fuel, steps, stare, verdict })[kind](el, card, value, set) || (() => {});
}

/* Shared: a group of option buttons that keeps aria-pressed in sync */
function pickGroup(el, selector, card, value, onPick) {
  el.addEventListener("click", e => {
    const b = e.target.closest(selector);
    if (!b) return;
    el.querySelectorAll(selector).forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    onPick(card.options.find(o => o.v === b.dataset.v));
  });
}
const pressed = (o, value) => `aria-pressed="${o.v === value}"`;

/* ---------- Picture tiles, 2 × 2 (laptop, coworker, lunch, 5:00 pm) ---------- */
function tiles(el, card, value, set) {
  el.innerHTML = `
    <div class="grid2" role="group" aria-label="${esc(card.title)}">
      ${card.options.map(o => `
        <button type="button" class="tile" data-v="${o.v}" ${pressed(o, value)}>
          <span class="pic">${TILE_ART[card.key][o.v]}</span>
          <span class="t">${esc(o.label)}</span>
          <span class="n">${esc(o.note)}</span>
        </button>`).join("")}
    </div>`;
  pickGroup(el, ".tile", card, value, o => set(o.v, true));
}

/* ---------- Morning routes ---------- */
function routes(el, card, value, set) {
  el.innerHTML = `
    <div class="routes" role="group" aria-label="${esc(card.title)}">
      ${card.options.map(o => `
        <button type="button" class="route" data-v="${o.v}" ${pressed(o, value)}>
          <span class="txt"><span class="t">${esc(o.label)}</span><span class="n">${esc(o.note)}</span></span>
          <span class="icons" aria-hidden="true">${ROUTES[o.v]}</span>
        </button>`).join("")}
    </div>`;
  pickGroup(el, ".route", card, value, o => set(o.v, true));
}

/* ---------- Last stood up: a ring that fills with the time ---------- */
function stand(el, card, value, set) {
  const current = card.options.find(o => o.v === value);
  el.innerHTML = `
    <div class="stand-top">
      <div class="stand-ring">${standRing(current ? current.fill : 0)}</div>
      <span class="elapsed" aria-live="polite">${current ? current.elapsed : "pick one below"}</span>
    </div>
    <div class="grid2" role="group" aria-label="${esc(card.title)}">
      ${card.options.map(o => `
        <button type="button" class="pick" data-v="${o.v}" ${pressed(o, value)}><span class="t">${esc(o.label)}</span><span class="n">${esc(o.note)}</span></button>`).join("")}
    </div>`;
  pickGroup(el, ".pick", card, value, o => {
    el.querySelector(".ring-fill").style.strokeDashoffset = (490.1 * (1 - o.fill)).toFixed(1);
    el.querySelector(".elapsed").textContent = o.elapsed;
    set(o.v, true);
  });
}

/* ---------- News alerts: the phone fills up, goes quiet, or spins ---------- */
function news(el, card, value, set) {
  el.innerHTML = `
    <div class="news-wrap">${newsPhone(card.options.find(o => o.v === value))}</div>
    <div class="grid2" role="group" aria-label="${esc(card.title)}">
      ${card.options.map(o => `
        <button type="button" class="pick short" data-v="${o.v}" ${pressed(o, value)}><span class="t">${esc(o.label)}</span><span class="n">${esc(o.note)}</span></button>`).join("")}
    </div>`;
  pickGroup(el, ".pick", card, value, o => {
    el.querySelector(".news-wrap").innerHTML = newsPhone(o);
    set(o.v, true);
  });
}

/* ---------- Posture dial: drag around the ring, or tap a pose to glide there ---------- */
function dial(el, card, value, set) {
  const at = (deg, r) => [165 + r * Math.cos(deg * Math.PI / 180), 165 + r * Math.sin(deg * Math.PI / 180)];
  const p = xy => `${xy[0].toFixed(1)} ${xy[1].toFixed(1)}`;
  let t = typeof value === "number" ? value : 1 / 3;
  let raf = null, dragging = false;
  const ticks = [0, 1 / 3, 2 / 3, 1].map(k => `M${p(at(135 + 270 * k, 158))} L${p(at(135 + 270 * k, 164))}`).join(" ");
  el.innerHTML = `
    <div class="dial" role="slider" tabindex="0" aria-label="Posture dial" aria-valuemin="0" aria-valuemax="100">
      <svg class="ring" viewBox="0 0 330 330" aria-hidden="true">
        <defs><radialGradient id="dialFilm" cx="50%" cy="45%" r="60%"><stop offset="0" style="stop-color: var(--film1)"/><stop offset="1" style="stop-color: var(--film2)"/></radialGradient></defs>
        <circle cx="165" cy="165" r="136" fill="url(#dialFilm)"/>
        <path d="${ticks}" style="stroke: var(--deco)" stroke-width="2" stroke-linecap="round" fill="none"/>
        <path d="M58.93 271.07 A150 150 0 1 1 271.07 271.07" style="stroke: var(--line)" stroke-width="8" stroke-linecap="round" fill="none"/>
        <path class="fill" style="stroke: var(--accent)" stroke-width="8" stroke-linecap="round" fill="none"/>
        <circle class="k1" r="15" style="fill: var(--accent)"/>
        <circle class="k2" r="5" style="fill: var(--bg)"/>
      </svg>
      <div class="fig"></div>
    </div>
    <div class="pose-row"><span class="pose-name" aria-live="polite"></span><span class="mono-cap">Drag the dial</span></div>
    <div class="chips4">${POSES.map((name, i) => `<button type="button" data-i="${i}">${name}</button>`).join("")}</div>`;
  const dialEl = el.querySelector(".dial");
  const draw = () => {
    const sweep = 270 * t, start = at(135, 150), knob = at(135 + sweep, 150);
    el.querySelector(".fill").setAttribute("d", sweep < 0.5 ? `M${p(start)}` : `M${p(start)} A150 150 0 ${sweep > 180 ? 1 : 0} 1 ${p(knob)}`);
    ["k1", "k2"].forEach(c => { const k = el.querySelector("." + c); k.setAttribute("cx", knob[0].toFixed(1)); k.setAttribute("cy", knob[1].toFixed(1)); });
    el.querySelector(".fig").innerHTML = skeletonSVG(t, { w: "100%", h: "100%", ink: "currentColor", sub: "var(--sub)" });
    const pi = poseIndex(t);
    el.querySelector(".pose-name").textContent = POSES[pi];
    el.querySelectorAll(".chips4 button").forEach((b, i) => b.setAttribute("aria-pressed", String(i === pi)));
    dialEl.setAttribute("aria-valuenow", String(Math.round(t * 100)));
    dialEl.setAttribute("aria-valuetext", POSES[pi]);
  };
  const commit = () => set(Math.round(t * 1000) / 1000, false);
  const fromPointer = e => {
    const r = dialEl.getBoundingClientRect();
    let ang = Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI;
    if (ang < 0) ang += 360;
    let rel = (ang - 135 + 360) % 360;
    if (rel > 270) rel = rel > 315 ? 0 : 270;
    t = rel / 270;
    draw();
    commit();
  };
  const glide = target => {
    cancelAnimationFrame(raf);
    if (reduced()) { t = target; draw(); commit(); return; }
    const from = t, t0 = performance.now(), dur = 380;
    const step = now => {
      const k = Math.min(1, (now - t0) / dur);
      t = from + (target - from) * (1 - Math.pow(1 - k, 3));
      draw();
      if (k < 1) raf = requestAnimationFrame(step); else commit();
    };
    raf = requestAnimationFrame(step);
  };
  dialEl.addEventListener("pointerdown", e => { cancelAnimationFrame(raf); dragging = true; try { dialEl.setPointerCapture(e.pointerId); } catch (_) { /* older browsers */ } fromPointer(e); });
  dialEl.addEventListener("pointermove", e => { if (dragging) fromPointer(e); });
  ["pointerup", "pointercancel"].forEach(ev => dialEl.addEventListener(ev, () => { dragging = false; }));
  dialEl.addEventListener("keydown", e => {
    const step = { ArrowRight: 0.05, ArrowUp: 0.05, ArrowLeft: -0.05, ArrowDown: -0.05 }[e.key];
    if (step === undefined) return;
    e.preventDefault();
    t = Math.max(0, Math.min(1, t + step));
    draw();
    commit();
  });
  el.querySelector(".chips4").addEventListener("click", e => {
    const b = e.target.closest("button");
    if (b) glide(Number(b.dataset.i) / 3);
  });
  draw();
  return () => cancelAnimationFrame(raf);
}

/* ---------- Coffee vs. water: a cup tower and a glass ---------- */
function fuel(el, card, value, set) {
  const v = value ? { ...value } : { coffee: 0, water: 0 };
  el.innerHTML = `
    <div class="grid2 fuel">
      <div class="fuel-col">
        <div class="fuel-scene coffee"><div class="tower"></div><span class="over" data-over="coffee" hidden></span></div>
        <span class="t">Coffee, Karak</span>
        <div class="counter">
          <button type="button" class="step" data-k="coffee" data-d="-1" aria-label="One cup fewer">−</button>
          <span class="val"><b data-n="coffee"></b><small>cups</small></span>
          <button type="button" class="step up" data-k="coffee" data-d="1" aria-label="One cup more">+</button>
        </div>
      </div>
      <div class="fuel-col">
        <div class="fuel-scene water"><div class="glass"></div><span class="over blue" data-over="water" hidden></span></div>
        <span class="t">Water</span>
        <div class="counter">
          <button type="button" class="step" data-k="water" data-d="-1" aria-label="One glass fewer">−</button>
          <span class="val"><b data-n="water"></b><small>glasses</small></span>
          <button type="button" class="step up blue" data-k="water" data-d="1" aria-label="One glass more">+</button>
        </div>
      </div>
    </div>`;
  const draw = (grew = false) => {
    el.querySelector(".tower").innerHTML = cupTower(v.coffee, grew);
    el.querySelector(".glass").innerHTML = waterGlass(v.water);
    [["coffee", MAX_CUPS], ["water", MAX_GLASSES]].forEach(([k, max]) => {
      el.querySelector(`[data-n="${k}"]`).textContent = v[k];
      const over = el.querySelector(`[data-over="${k}"]`);
      over.hidden = v[k] <= max;
      over.textContent = "+" + (v[k] - max);
    });
  };
  el.addEventListener("click", e => {
    const b = e.target.closest(".step");
    if (!b) return;
    const k = b.dataset.k;
    v[k] = Math.max(0, Math.min(MAX_COUNT, v[k] + Number(b.dataset.d)));
    draw(k === "coffee" && b.dataset.d === "1");
    set({ ...v }, false);
  });
  draw();
}

/* ---------- Daily steps: two sliders, office days and home days, shown as two rings ---------- */
function steps(el, card, value, set) {
  const v = value ? { ...value } : { office: card.start, home: card.start };
  let touched = !!value;
  const ROWS = [["office", "Office days"], ["home", "Home days"]];
  el.innerHTML = `
    <div class="steps-card">
      <div class="steps-rings">${stepsRings(v.office, v.home, card.max)}<span class="steps-mid" aria-live="polite"><b data-diff></b><small data-diff-note></small></span></div>
      <div class="steps-sliders">
        ${ROWS.map(([k, label]) => `
        <label class="steps-row ${k}">
          <span class="steps-head"><span class="steps-lbl"><i></i>${label}</span><span class="steps-val"><b data-n="${k}"></b> <small>steps a day</small></span></span>
          <input type="range" class="steps-slider" data-k="${k}" min="0" max="${card.max}" step="${card.step}" value="${v[k]}" aria-label="${label}: steps a day">
        </label>`).join("")}
      </div>
    </div>`;
  const draw = () => {
    ROWS.forEach(([k]) => {
      const ring = el.querySelector(`.ring-${k}`);
      ring.setAttribute("stroke-dashoffset", stepsOffset(k, v[k], card.max));
      ring.setAttribute("opacity", v[k] > 0 ? 1 : 0);
      el.querySelector(`[data-n="${k}"]`).textContent = fmtSteps(v[k]);
      el.querySelector(`.steps-slider[data-k="${k}"]`).style.setProperty("--fill", `${(v[k] / card.max * 100).toFixed(1)}%`);
    });
    const d = v.home - v.office;
    el.querySelector("[data-diff]").textContent = !touched ? "Slide" : d === 0 ? "Same" : `${d < 0 ? "−" : "+"}${fmtSteps(Math.abs(d))}`;
    el.querySelector("[data-diff-note]").textContent = !touched ? "both bars below" : d === 0 ? "as the office" : `a day at home`;
  };
  el.addEventListener("input", e => {
    const s = e.target.closest(".steps-slider");
    if (!s) return;
    v[s.dataset.k] = Number(s.value);
    touched = true;
    draw();
    set({ ...v }, false);
  });
  draw();
}

/* ---------- Staring contest, then a 20-second eye break ---------- */
function stare(el, card, value, set) {
  const CIRC = 879.6, REST = config.restSeconds;
  let phase = typeof value === "number" ? "done" : "ready";
  let started = 0, stared = typeof value === "number" ? value : 0, restEnds = 0, timer = null;
  el.innerHTML = `
    <p class="sub stare-say" aria-live="polite"></p>
    <div class="target" data-box>
      <svg viewBox="0 0 300 300" aria-hidden="true">
        <defs><radialGradient id="eyeFilm" cx="50%" cy="45%" r="60%"><stop offset="0" style="stop-color: var(--film1)"/><stop offset="1" style="stop-color: var(--film2)"/></radialGradient></defs>
        <circle cx="150" cy="150" r="132" fill="url(#eyeFilm)"/>
        <circle cx="150" cy="150" r="104" style="stroke: var(--line)" stroke-width="2" fill="none"/>
        <circle cx="150" cy="150" r="74" style="stroke: var(--line)" stroke-width="2" fill="none"/>
        <circle cx="150" cy="150" r="44" style="stroke: var(--line)" stroke-width="2" fill="none"/>
        <circle cx="150" cy="150" r="140" style="stroke: var(--line)" stroke-width="6" fill="none"/>
        <circle class="prog" cx="150" cy="150" r="140" style="stroke: var(--accent)" stroke-width="6" stroke-linecap="round" fill="none" stroke-dasharray="${CIRC}" stroke-dashoffset="${CIRC}" transform="rotate(-90 150 150)"/>
        <circle class="pulse" cx="150" cy="150" r="12" style="fill: var(--accent)"/>
        <circle cx="150" cy="150" r="10" style="fill: var(--accent)"/>
      </svg>
      <div class="readout"><span class="big" data-display></span><span class="mono-cap" data-caption></span></div>
    </div>
    <button type="button" class="act" data-act></button>`;
  const $ = s => el.querySelector(s);
  const stop = () => { clearInterval(timer); timer = null; };
  const draw = () => {
    const now = performance.now();
    let say, display, caption, ring = CIRC, pulse = 1, label, quiet = false;
    if (phase === "staring") {
      const s = (now - started) / 1000;
      say = "Keep your eyes on the dot. Tap as soon as you blink.";
      display = `${s.toFixed(1)} s`; caption = "staring"; ring = CIRC * (1 - Math.min(1, s / 30)); label = "I blinked";
    } else if (phase === "rest") {
      const left = Math.max(0, (restEnds - now) / 1000);
      say = `You lasted ${stared.toFixed(1)} s. Now rest your eyes: look at something about 6 m away until the ring empties.`;
      display = String(Math.ceil(left)); caption = "look away"; ring = CIRC * (1 - left / REST); pulse = 0; label = "Resting…"; quiet = true;
    } else if (phase === "done") {
      say = `You lasted ${stared.toFixed(1)} s, then gave your eyes ${REST} seconds off.`;
      display = `${stared.toFixed(1)} s`; caption = "your score"; pulse = 0; label = "Try again";
    } else {
      say = "Stare at the dot. Tap the moment you blink.";
      display = "0.0 s"; caption = "ready"; label = "Start staring";
    }
    $(".stare-say").textContent = say;
    $("[data-display]").textContent = display;
    $("[data-caption]").textContent = caption;
    $(".prog").setAttribute("stroke-dashoffset", ring.toFixed(1));
    $(".pulse").style.opacity = String(pulse);
    $(".pulse").classList.toggle("on", phase === "ready" || phase === "staring");
    const act = $("[data-act]");
    act.textContent = label;
    act.disabled = quiet;
    act.classList.toggle("quiet", quiet);
  };
  const tick = () => {
    if (phase === "rest" && performance.now() >= restEnds) { stop(); phase = "done"; }
    draw();
  };
  const start = () => { stop(); phase = "staring"; started = performance.now(); timer = setInterval(tick, 100); draw(); };
  const blink = () => {
    const now = performance.now();
    stared = Math.round((now - started) / 100) / 10;
    set(stared, true);
    phase = "rest"; restEnds = now + REST * 1000;
    draw();
  };
  $("[data-act]").addEventListener("click", () => {
    if (phase === "staring") blink();
    else if (phase === "ready" || phase === "done") start();
  });
  $("[data-box]").addEventListener("pointerdown", () => { if (phase === "staring") blink(); });
  draw();
  return stop;
}

/* ---------- 0 to 10 gauge with a note per number ---------- */
function verdict(el, card, value, set) {
  let v = Number.isInteger(value) ? value : null;
  const at = (i, r) => { const a = Math.PI - (i * Math.PI) / 10; return [175 + r * Math.cos(a), 186 - r * Math.sin(a)]; };
  el.innerHTML = `
    <div class="gauge">
      <svg viewBox="0 0 350 212" aria-hidden="true">
        <path d="M25 186 A150 150 0 0 1 325 186" style="stroke: var(--line)" stroke-width="6" stroke-linecap="round" fill="none"/>
        <path class="arc" style="stroke: var(--accent)" stroke-width="6" stroke-linecap="round" fill="none"/>
        <line class="needle" x1="175" y1="186" style="stroke: var(--accent)" stroke-width="4" stroke-linecap="round"/>
        <circle cx="175" cy="186" r="9" style="fill: var(--bg)" stroke="currentColor" stroke-width="2.4"/>
      </svg>
      ${VERDICT_NOTES.map((note, i) => { const [x, y] = at(i, 150); return `<button type="button" data-i="${i}" aria-label="${i} out of 10: ${esc(note)}" style="left: ${(x / 350 * 100).toFixed(2)}%; top: ${(y / 212 * 100).toFixed(2)}%">${i}</button>`; }).join("")}
    </div>
    <div class="verdict-read">
      <span class="score"><b data-score></b><small>/ 10</small></span>
      <span class="note" aria-live="polite" data-note></span>
    </div>`;
  const draw = () => {
    el.querySelectorAll(".gauge button").forEach((b, i) => {
      b.setAttribute("aria-pressed", String(i === v));
      b.classList.toggle("in", v !== null && i < v);
    });
    const end = at(v ?? 0, 150), tip = at(v ?? 0, 108);
    el.querySelector(".arc").setAttribute("d", !v ? "M25 186" : `M25 186 A150 150 0 0 1 ${end[0].toFixed(1)} ${end[1].toFixed(1)}`);
    const needle = el.querySelector(".needle");
    needle.setAttribute("x2", (v === null ? 175 : tip[0]).toFixed(1));
    needle.setAttribute("y2", (v === null ? 186 : tip[1]).toFixed(1));
    el.querySelector("[data-score]").textContent = v === null ? "–" : String(v);
    el.querySelector("[data-note]").textContent = v === null ? "Pick a number on the dial" : VERDICT_NOTES[v];
  };
  el.querySelector(".gauge").addEventListener("click", e => {
    const b = e.target.closest("button[data-i]");
    if (!b) return;
    v = Number(b.dataset.i);
    draw();
    set(v, true);
  });
  draw();
}

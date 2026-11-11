/* Card renderers. Each takes (el, card, value, set) and draws one card body into el.
   set(value) stores the answer; a card is answerable once its value is not undefined. */
import { POSES, poseIndex, VERDICT_NOTES } from "../content.js";
import { config } from "../config.js";
import { skeletonSVG } from "../skeleton.js";
import { ART, cupSVG, glassSVG } from "./art.js";

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export function renderCard(el, card, value, set) {
  ({ options, dial, fuel, stare, verdict })[card.kind](el, card, value, set);
}

/* ---------- Pick one ---------- */
function options(el, card, value, set) {
  el.innerHTML = `
    <div class="art">${ART[card.art] || ""}</div>
    <div class="opts" role="group" aria-label="${esc(card.title)}">
      ${card.options.map(o => `<button type="button" class="opt" data-v="${o.v}" aria-pressed="${o.v === value}"><span class="dot"></span>${esc(o.label)}</button>`).join("")}
    </div>`;
  el.querySelector(".opts").addEventListener("click", e => {
    const b = e.target.closest(".opt");
    if (!b) return;
    el.querySelectorAll(".opt").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    set(b.dataset.v);
  });
}

/* ---------- Posture dial: drag around the ring, or tap a pose ---------- */
function dial(el, card, value, set) {
  const C = 150, R = 128;
  let t = typeof value === "number" ? value : 1 / 3;
  const at = deg => { const a = deg * Math.PI / 180; return [C + R * Math.cos(a), C + R * Math.sin(a)]; };
  const arc = (from, to) => {
    const [x0, y0] = at(from), [x1, y1] = at(to);
    return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${R} ${R} 0 ${to - from > 180 ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  };
  el.innerHTML = `
    <div class="dial" role="slider" tabindex="0" aria-label="Posture dial" aria-valuemin="0" aria-valuemax="100">
      <svg class="ring" viewBox="0 0 300 300" width="300" height="300" aria-hidden="true">
        <path d="${arc(135, 405)}" fill="none" stroke="var(--line)" stroke-width="16" stroke-linecap="round"/>
        <path class="fill" fill="none" stroke="var(--accent)" stroke-width="16" stroke-linecap="round"/>
        <circle class="knob" r="16" fill="var(--bg)" stroke="var(--accent)" stroke-width="5"/>
      </svg>
      <div class="fig"></div>
    </div>
    <div class="poses">${POSES.map((p, i) => `<button type="button" data-i="${i}">${p}</button>`).join("")}</div>`;
  const dialEl = el.querySelector(".dial");
  const update = () => {
    const deg = 135 + 270 * t;
    el.querySelector(".fill").setAttribute("d", t > 0.002 ? arc(135, deg) : "");
    const [kx, ky] = at(deg);
    const knob = el.querySelector(".knob");
    knob.setAttribute("cx", kx.toFixed(1));
    knob.setAttribute("cy", ky.toFixed(1));
    el.querySelector(".fig").innerHTML = skeletonSVG(t, { w: 168, h: 210 });
    const pi = poseIndex(t);
    el.querySelectorAll(".poses button").forEach((b, i) => b.setAttribute("aria-pressed", String(i === pi)));
    dialEl.setAttribute("aria-valuenow", String(Math.round(t * 100)));
    dialEl.setAttribute("aria-valuetext", POSES[pi]);
    set(Math.round(t * 1000) / 1000);
  };
  const fromPointer = e => {
    const r = dialEl.getBoundingClientRect();
    const deg = Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI;
    let a = (deg - 135 + 720) % 360;
    if (a > 270) a = a > 315 ? 0 : 270;
    t = a / 270;
    update();
  };
  dialEl.addEventListener("pointerdown", e => { dialEl.setPointerCapture(e.pointerId); fromPointer(e); });
  dialEl.addEventListener("pointermove", e => { if (dialEl.hasPointerCapture(e.pointerId)) fromPointer(e); });
  dialEl.addEventListener("keydown", e => {
    const step = { ArrowRight: 0.05, ArrowUp: 0.05, ArrowLeft: -0.05, ArrowDown: -0.05 }[e.key];
    if (step === undefined) return;
    e.preventDefault();
    t = Math.max(0, Math.min(1, t + step));
    update();
  });
  el.querySelector(".poses").addEventListener("click", e => {
    const b = e.target.closest("button");
    if (!b) return;
    t = Number(b.dataset.i) / 3;
    update();
  });
  update();
}

/* ---------- Coffee vs water ---------- */
function fuel(el, card, value, set) {
  const v = value ? { ...value } : { coffee: 0, water: 0 };
  const draw = () => {
    el.innerHTML = `
      <div class="fuel-row">
        <button type="button" class="stepper" data-k="coffee" data-d="-1" aria-label="One less coffee">−</button>
        <div class="mid">
          <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 2px; max-width: 200px">${Array.from({ length: 9 }, (_, i) => cupSVG(i < v.coffee)).join("")}</div>
          <span><span class="num">${v.coffee}</span> <span class="lbl">${v.coffee === 1 ? "cup" : "cups"} of coffee, qahwa or karak</span></span>
        </div>
        <button type="button" class="stepper" data-k="coffee" data-d="1" aria-label="One more coffee">+</button>
      </div>
      <div class="fuel-row">
        <button type="button" class="stepper" data-k="water" data-d="-1" aria-label="One less glass of water">−</button>
        <div class="mid">
          ${glassSVG(v.water / 8)}
          <span><span class="num">${v.water}</span> <span class="lbl">${v.water === 1 ? "glass" : "glasses"} of water</span></span>
        </div>
        <button type="button" class="stepper" data-k="water" data-d="1" aria-label="One more glass of water">+</button>
      </div>`;
  };
  el.addEventListener("click", e => {
    const b = e.target.closest(".stepper");
    if (!b) return;
    const k = b.dataset.k, max = k === "coffee" ? 9 : 8;
    v[k] = Math.max(0, Math.min(max, v[k] + Number(b.dataset.d)));
    draw();
    set({ ...v });
  });
  draw();
  set({ ...v });
}

/* ---------- Staring contest, then a live 20-second eye break ---------- */
function stare(el, card, value, set) {
  let phase = typeof value === "number" ? "done" : "ready";
  let start = 0, seconds = value || 0, timer = null, restLeft = config.restSeconds;
  const stop = () => { clearInterval(timer); timer = null; };
  const draw = () => {
    const box = {
      ready: `<div><p class="sub" style="margin-bottom: 18px">Keep your eyes on the dot. Tap anywhere in this box the moment you blink.</p><button type="button" class="btn" data-a="go" style="width: 200px">Start staring</button></div>`,
      staring: `<div style="display: grid; gap: 26px; place-items: center"><span class="target"></span><span class="big" data-clock>0.0 s</span><span class="sub">Tap when you blink</span></div>`,
      rest: `<div style="display: grid; gap: 14px; place-items: center"><span class="sub">You lasted</span><span class="big">${seconds.toFixed(1)} s</span><p class="sub" style="max-width: 260px">Now look at something about 6 m away. A window, the far wall.</p><span class="big" data-rest>${restLeft}</span><button type="button" class="link" data-a="skip">Skip the break</button></div>`,
      done: `<div style="display: grid; gap: 12px; place-items: center"><span class="sub">You lasted</span><span class="big">${seconds.toFixed(1)} s</span><p class="sub">That was the 20-20-20 rule: every 20 minutes, look 6 m away for 20 seconds.</p><button type="button" class="link" data-a="again">Try again</button></div>`
    }[phase];
    el.innerHTML = `<div class="stare" data-box>${box}</div>`;
  };
  el.addEventListener("click", e => {
    const a = e.target.closest("[data-a]")?.dataset.a;
    if (a === "go") {
      phase = "staring"; start = performance.now(); draw();
      timer = setInterval(() => { const c = el.querySelector("[data-clock]"); if (c) c.textContent = ((performance.now() - start) / 1000).toFixed(1) + " s"; }, 100);
    } else if (phase === "staring" && e.target.closest("[data-box]")) {
      stop();
      seconds = Math.round((performance.now() - start) / 100) / 10;
      set(seconds);
      phase = "rest"; restLeft = config.restSeconds; draw();
      timer = setInterval(() => {
        restLeft -= 1;
        const r = el.querySelector("[data-rest]");
        if (r) r.textContent = String(restLeft);
        if (restLeft <= 0) { stop(); phase = "done"; draw(); }
      }, 1000);
    } else if (a === "skip") {
      stop(); phase = "done"; draw();
    } else if (a === "again") {
      phase = "ready"; draw();
    }
  });
  draw();
}

/* ---------- 0 to 10 gauge with a note per number ---------- */
function verdict(el, card, value, set) {
  let v = Number.isInteger(value) ? value : null;
  const draw = () => {
    const btns = Array.from({ length: 11 }, (_, i) => {
      const th = Math.PI - i * Math.PI / 10;
      const x = 160 + 136 * Math.cos(th) - 21, y = 168 - 136 * Math.sin(th) - 21;
      return `<button type="button" data-i="${i}" aria-pressed="${i === v}" aria-label="${i} out of 10: ${VERDICT_NOTES[i]}" style="left: ${x.toFixed(1)}px; top: ${y.toFixed(1)}px">${i}</button>`;
    }).join("");
    const needle = v === null ? "" : (() => {
      const th = Math.PI - v * Math.PI / 10;
      return `<line x1="160" y1="168" x2="${(160 + 96 * Math.cos(th)).toFixed(1)}" y2="${(168 - 96 * Math.sin(th)).toFixed(1)}" stroke="var(--accent)" stroke-width="5" stroke-linecap="round"/>`;
    })();
    el.innerHTML = `
      <div class="gauge">
        <svg viewBox="0 0 320 190" width="320" height="190" aria-hidden="true" style="position: absolute; inset: 0">${needle}<circle cx="160" cy="168" r="9" fill="var(--accent)"/></svg>
        ${btns}
      </div>
      <div class="note" aria-live="polite">${v === null ? "Pick a number" : VERDICT_NOTES[v]}</div>`;
  };
  el.addEventListener("click", e => {
    const b = e.target.closest("button[data-i]");
    if (!b) return;
    v = Number(b.dataset.i);
    draw();
    set(v);
  });
  draw();
}

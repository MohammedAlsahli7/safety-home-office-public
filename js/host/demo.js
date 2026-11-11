/* Demo mode (host.html?demo): 14 simulated players with the sample answers used in the
   proposal PDF, so the whole flow can be rehearsed or shown without phones. */
import { NICKNAMES } from "../content.js";

const SAMPLE = {
  light: [8, 12, 15, 20, 25, 28, 32, 40, 44, 48, 55, 62, 75, 92],
  posture: [0.02, 0.1, 0.3, 0.35, 0.28, 0.4, 0.62, 0.66, 0.7, 0.64, 0.68, 0.72, 0.95, 1],
  laptop: ["stand", "stand", "desk", "desk", "desk", "desk", "desk", "desk", "desk", "lap", "lap", "lap", "bed", "bed"],
  morning: ["pillow", "pillow", "pillow", "pillow", "coffee", "coffee", "coffee", "coffee", "coffee", "coffee", "straight", "straight", "straight", "routine"],
  coffee: [9, 6, 5, 4, 4, 4, 3, 3, 3, 3, 3, 2, 2, 1],
  water: [1, 2, 3, 2, 3, 2, 2, 3, 1, 2, 4, 3, 2, 1],
  stand: ["30m", "30m", "30m", "1h", "1h", "1h", "1h", "1h", "2h", "2h", "2h", "2h", "fridge", "fridge"],
  coworker: ["cat", "cat", "cat", "cat", "cat", "kids", "kids", "kids", "kids", "door", "door", "chat", "chat", "chat"],
  lunch: ["table", "table", "table", "table", "table", "keyboard", "keyboard", "keyboard", "keyboard", "meeting", "meeting", "meeting", "none", "none"],
  stare: [4.8, 6.2, 7.5, 8.1, 9.9, 10.4, 11.0, 11.6, 12.9, 13.1, 14.6, 15.8, 31.2, 41.7],
  news: ["off", "off", "few", "few", "few", "few", "few", "few", "all", "all", "all", "all", "refresh", "refresh"],
  logoff: ["packed", "packed", "closed", "closed", "closed", "closed", "closed", "open", "open", "open", "open", "open", "meeting", "meeting"],
  verdict: [3, 4, 5, 5, 6, 6, 7, 7, 7, 7, 8, 8, 8, 9]
};
const GUILTY = { c1: 11, c2: 5, c3: 4 };
const VOTES = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2];
const KEYS = ["posture", "laptop", "morning", "fuel", "stand", "coworker", "lunch", "stare", "news", "logoff", "verdict"];

/* Shuffle each column independently so no simulated player is "the rough one" */
function shuffled(list) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function startDemo(send) {
  const cols = Object.fromEntries(Object.entries(SAMPLE).map(([k, v]) => [k, shuffled(v)]));
  const fuelOrder = shuffled([...Array(14).keys()]);
  const players = Array.from({ length: 14 }, (_, i) => ({ p: "demo" + i, n: NICKNAMES[i] }));
  const timers = [];
  const later = (ms, fn) => timers.push(setTimeout(fn, ms));

  players.forEach((pl, i) => {
    const t0 = 600 + i * 450 + Math.random() * 600;
    later(t0, () => send({ t: "join", p: pl.p, n: pl.n, L: cols.light[i] }));
    KEYS.forEach((k, j) => {
      const v = k === "fuel" ? { coffee: SAMPLE.coffee[fuelOrder[i]], water: SAMPLE.water[fuelOrder[i]] } : cols[k][i];
      later(t0 + 1500 + j * (900 + Math.random() * 900), () => send({ t: "ans", p: pl.p, k, v }));
    });
    later(t0 + 1500 + 11 * 1900, () => send({ t: "done", p: pl.p }));
  });

  /* Simulated taps when the presenter reaches a confession or the vote */
  const tapped = new Set();
  return {
    onStage(stage) {
      if (!stage || tapped.has(stage)) return;
      tapped.add(stage);
      const order = shuffled([...Array(14).keys()]);
      order.forEach((i, k) => later(800 + k * 350 + Math.random() * 400, () => {
        if (stage === "vote") send({ t: "vote", p: players[i].p, v: VOTES[k] });
        else send({ t: "tap", p: players[i].p, q: stage, v: k < GUILTY[stage] ? 1 : 0 });
      }));
    },
    stop() { timers.forEach(clearTimeout); }
  };
}

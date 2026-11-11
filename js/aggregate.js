/* Pure team statistics for the presenter slides. No DOM, safe for Node tests.
   players: { [pid]: { nick, answers: {...}, done: bool } }
   taps:    { c1: { [pid]: 0|1 }, c2: {...}, c3: {...} }
   votes:   { [pid]: 0|1|2 } */
import { AREAS, CARDS, VERDICT_NOTES, poseIndex, cardByKey } from "./content.js";
import { strain } from "./scoring.js";

const count = (list, pred) => list.reduce((n, x) => n + (pred(x) ? 1 : 0), 0);
const answered = (list, key) => list.filter(a => a[key] !== undefined && a[key] !== null);

export function teamStats({ players = {}, taps = {}, votes = {} }) {
  const all = Object.values(players);
  const answers = all.map(p => p.answers || {});
  const done = all.filter(p => p.done);

  const light = answered(answers, "light");
  const posture = answered(answers, "posture");
  const fuel = answered(answers, "fuel");
  const stare = answered(answers, "stare");
  const verdict = answered(answers, "verdict");
  const opt = key => answered(answers, key).map(a => a[key]);

  const tally = key => {
    const list = opt(key);
    const counts = Object.fromEntries(cardByKey[key].options.map(o => [o.v, 0]));
    list.forEach(v => { if (v in counts) counts[v] += 1; });
    return { n: list.length, counts };
  };

  const poseCounts = [0, 0, 0, 0];
  posture.forEach(a => { poseCounts[poseIndex(a.posture)] += 1; });
  const topPose = poseCounts.indexOf(Math.max(...poseCounts));

  const coworker = tally("coworker");
  const coworkerRank = Object.entries(coworker.counts).sort((a, b) => b[1] - a[1]);

  const hist = Array(11).fill(0);
  verdict.forEach(a => { hist[a.verdict] += 1; });
  const avgVerdict = verdict.length ? verdict.reduce((s, a) => s + a.verdict, 0) / verdict.length : null;
  const topNotes = hist.map((n, i) => ({ score: i, n, note: VERDICT_NOTES[i] })).filter(r => r.n > 0)
    .sort((a, b) => b.n - a.n || b.score - a.score).slice(0, 3);

  const coffees = fuel.map(a => a.fuel.coffee || 0);
  const waters = fuel.map(a => a.fuel.water || 0);

  const strains = done.map(p => strain(p.answers || {}));
  const avgStrain = Object.fromEntries(AREAS.map(k => [k, strains.length ? Math.round(strains.reduce((s, x) => s + x[k], 0) / strains.length * 10) / 10 : null]));

  const tapStats = key => {
    const vals = Object.values(taps[key] || {});
    return { n: vals.length, guilty: count(vals, v => v === 1) };
  };
  const voteVals = Object.values(votes);

  return {
    joined: all.length,
    done: done.length,
    answered: Object.fromEntries(CARDS.map(c => [c.key, count(answers, a => a[c.key] !== undefined && a[c.key] !== null)])),
    progress: all.map(p => ({ nick: p.nick, light: p.answers?.light, card: p.card || 0, done: !!p.done })),
    light: { n: light.length, dark: count(light, a => a.light < 34), levels: [17, 34, 50, 67, 84, 101].map((max, i, arr) => count(light, a => a.light < max && a.light >= (i ? arr[i - 1] : 0))) },
    posture: { n: posture.length, counts: poseCounts, top: topPose, topCount: poseCounts[topPose] },
    laptop: tally("laptop"),
    morning: tally("morning"),
    stand: tally("stand"),
    lunch: tally("lunch"),
    news: (() => { const t = tally("news"); return { ...t, always: t.counts.all + t.counts.refresh }; })(),
    logoff: (() => { const t = tally("logoff"); return { ...t, open: t.counts.open + t.counts.meeting }; })(),
    coworker: { n: coworker.n, counts: coworker.counts, top: coworkerRank[0], second: coworkerRank[1] },
    fuel: { n: fuel.length, coffee: coffees.reduce((s, x) => s + x, 0), water: waters.reduce((s, x) => s + x, 0), maxCoffee: coffees.length ? Math.max(...coffees) : 0 },
    stare: { n: stare.length, avg: stare.length ? stare.reduce((s, a) => s + a.stare, 0) / stare.length : null, max: stare.length ? Math.max(...stare.map(a => a.stare)) : null },
    verdict: { n: verdict.length, hist, avg: avgVerdict, low: count(verdict, a => a.verdict <= 5), topNotes },
    strain: { n: strains.length, avg: avgStrain },
    confess: { c1: tapStats("c1"), c2: tapStats("c2"), c3: tapStats("c3") },
    vote: { n: voteVals.length, counts: [0, 1, 2].map(i => count(voteVals, v => v === i)) }
  };
}

/* Applies one relay message to the session state. Shared by the presenter and the tests. */
export function applyMessage(state, m) {
  if (!m || typeof m !== "object" || typeof m.p !== "string" || m.p.length > 40) return false;
  const player = () => state.players[m.p] || (state.players[m.p] = { nick: "Player", answers: {}, card: 0, done: false });
  let p;
  switch (m.t) {
    case "join":
      p = player();
      if (typeof m.n === "string") p.nick = m.n.slice(0, 24);
      if (typeof m.L === "number") p.answers.light = clamp(m.L, 0, 100);
      return true;
    case "ans": {
      if (!validAnswer(m.k, m.v)) return false;
      p = player();
      p.answers[m.k] = m.v;
      const idx = CARDS.findIndex(c => c.key === m.k);
      p.card = Math.max(p.card, idx + 1);
      return true;
    }
    case "done":
      p = player();
      p.done = true;
      p.card = CARDS.length;
      return true;
    case "tap":
      if (!["c1", "c2", "c3"].includes(m.q) || ![0, 1].includes(m.v)) return false;
      (state.taps[m.q] = state.taps[m.q] || {})[m.p] = m.v;
      return true;
    case "vote":
      if (![0, 1, 2].includes(m.v)) return false;
      state.votes[m.p] = m.v;
      return true;
    default:
      return false;
  }
}

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

/* Rejects malformed or out-of-range answers, since anyone with the session link can post. */
export function validAnswer(key, v) {
  const card = cardByKey[key];
  if (!card) return false;
  switch (card.kind) {
    case "dial": return typeof v === "number" && v >= 0 && v <= 1;
    case "fuel": return v && Number.isInteger(v.coffee) && Number.isInteger(v.water) && v.coffee >= 0 && v.coffee <= 20 && v.water >= 0 && v.water <= 20;
    case "stare": return typeof v === "number" && v >= 0 && v <= 600;
    case "verdict": return Number.isInteger(v) && v >= 0 && v <= 10;
    case "options": return card.options.some(o => o.v === v);
    default: return false;
  }
}

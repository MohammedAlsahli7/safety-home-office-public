/* KPI figures for the three KPI slides. The code holds labels only; no real figure is ever published.
   The presenter pastes the figures as JSON in the presenter tools (key P), or opens a private link
   whose #kpi=… hash carries them. Either way they are kept in that browser only.

   JSON shape (every part optional; all numbers below are made up):
   {
     "period": "",
     "coursesTitle": "Safety courses", "safetyTitle": "Safety KPIs",   // slide headlines
     "safety": [0, 0, 0, 0, 0, 0],                         // same order as SAFETY_LABELS
     "courses": [
       ["Course A", 100],                                   // completion %
       ["Course B", 50, { "enrolledRest": true, "note": "Everyone remaining is booked" }]
     ],
     "phishing": {
       "title": "Phishing test", "scope": "Our unit", "range": "January to March",
       "months": [["Jan", 100, 10, 0], ["Feb", 98, 12, 1]],  // [label, passed, neutral, negative]
       "period": "March",                                    // month of the department figures
       "team": "Team A",
       "departments": [["Team A", 90], ["Team B", 85]]       // positive response %
     }
   } */
import { store } from "./store.js";

export const SAFETY_LABELS = [
  { label: "Off-job disabling injury incidents", short: "ODI", icon: "home" },
  { label: "Motor vehicle accidents", short: "MVA", icon: "car" },
  { label: "Lost time injury incidents", short: "LTI", icon: "clock" },
  { label: "Disabling injuries", short: "", icon: "aid" },
  { label: "Traffic violations", short: "with points", icon: "light" },
  { label: "Traffic violations", short: "without points", icon: "ticket" }
];

const text = (v, max = 48) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const count = v => (Number.isFinite(Number(v)) && v !== "" && v !== null ? Math.max(0, Math.round(Number(v))) : null);
const pct = v => (Number.isFinite(Number(v)) && v !== "" && v !== null ? Math.max(0, Math.min(100, Number(v))) : null);
const rows = (list, max = 10) => (Array.isArray(list) ? list : []).filter(x => Array.isArray(x) && text(x[0])).slice(0, max);

/* Accepts anything; returns a clean KPI object (unknown or bad fields dropped). */
export function cleanKpis(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  const ph = r.phishing && typeof r.phishing === "object" ? r.phishing : {};
  return {
    period: text(r.period, 40),
    coursesTitle: text(r.coursesTitle, 48),
    safetyTitle: text(r.safetyTitle, 48),
    safety: SAFETY_LABELS.map((_, i) => count(Array.isArray(r.safety) ? r.safety[i] : null)),
    courses: rows(r.courses).map(([name, value, extra]) => {
      const x = extra && typeof extra === "object" ? extra : {};
      return { name: text(name, 32), pct: pct(value), enrolledRest: x.enrolledRest === true, note: text(x.note, 80) };
    }),
    phishing: {
      title: text(ph.title, 48) || "Phishing test",
      scope: text(ph.scope, 32),
      range: text(ph.range, 40),
      months: rows(ph.months, 12).map(([label, passed, neutral, negative]) => ({ label: text(label, 6), passed: count(passed), neutral: count(neutral), negative: count(negative) })),
      period: text(ph.period, 40),
      team: text(ph.team, 32),
      departments: rows(ph.departments).map(([name, value]) => [text(name, 32), pct(value)])
    }
  };
}

export const loadKpis = () => cleanKpis(store.get("kpis", {}));

/* Saves the raw JSON (so the editor shows what was pasted) after checking it parses into something. */
export function saveKpis(data) {
  cleanKpis(data);
  store.set("kpis", data);
}
export const rawKpis = () => store.get("kpis", {});

/* Private link support: host.html#kpi=<base64url JSON>. The hash never reaches the web server. */
export function encodeKpis(data) {
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  let bin = "";
  bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeKpis(token) {
  try {
    const bin = atob(token.replace(/-/g, "+").replace(/_/g, "/"));
    const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
    const data = JSON.parse(new TextDecoder().decode(bytes));
    return data && typeof data === "object" ? data : null;
  } catch (_) {
    return null;
  }
}

/* Reads #kpi=… once, saves it, and removes it from the address bar so it isn't shown on screen. */
export function importKpisFromHash() {
  const m = location.hash.match(/(?:^#|&)kpi=([A-Za-z0-9_-]+)/);
  if (!m) return false;
  const data = decodeKpis(m[1]);
  history.replaceState(null, "", location.pathname + location.search);
  if (!data) return false;
  saveKpis(data);
  return true;
}

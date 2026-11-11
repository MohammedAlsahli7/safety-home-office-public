/* Room-light themes for the phone. The player's lamp level picks one of three palettes,
   so every card after the landing page looks the way their room does. */
import { lightBucket } from "../content.js";

const THEMES = {
  night: { bg: "#0B1620", panel: "#0F1E2A", panel2: "#12222E", panelOn: "#13232F", line: "#24394A", done: "#5B7584", ink: "#DDEFF5", sub: "#A9C0C9", muted: "#8FA9B4", deco: "#4E6B7A", film1: "#183247", film2: "#0C1922", tint: "#2A2619", tintInk: "#FFE2B3", accent: "#FFB547", accentInk: "#0B1620", accentText: "#FFB547", glow: "rgba(140, 220, 255, 0.35)", ring: "rgba(255, 181, 71, 0.18)", scheme: "dark" },
  dusk: { bg: "#2A221B", panel: "#32291F", panel2: "#3A3026", panelOn: "#3E3326", line: "#54473A", done: "#8A7A68", ink: "#F3E9DC", sub: "#D6C7B4", muted: "#B8A893", deco: "#8C7B68", film1: "#4A3B2C", film2: "#2B231B", tint: "#4A3A22", tintInk: "#FFE2B3", accent: "#FFB547", accentInk: "#1E1710", accentText: "#FFC56B", glow: "rgba(255, 210, 150, 0.3)", ring: "rgba(255, 181, 71, 0.22)", scheme: "dark" },
  day: { bg: "#EFE9DD", panel: "#F8F4EC", panel2: "#E6DFD1", panelOn: "#FFF7E8", line: "#D3C9B7", done: "#A89D8B", ink: "#1B2328", sub: "#4E5A60", muted: "#5F6A6B", deco: "#9A9080", film1: "#FBF8F1", film2: "#E4DCCC", tint: "#FCE7C2", tintInk: "#6B4200", accent: "#E8961E", accentInk: "#1B1206", accentText: "#A15C00", glow: "rgba(0, 0, 0, 0)", ring: "rgba(232, 150, 30, 0.22)", scheme: "light" }
};

export function applyTheme(L) {
  const t = THEMES[lightBucket(L)];
  const root = document.documentElement.style;
  Object.entries(t).forEach(([k, v]) => { if (k !== "scheme") root.setProperty("--" + k, v); });
  root.setProperty("color-scheme", t.scheme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", t.bg);
  return t;
}

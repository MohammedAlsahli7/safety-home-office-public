/* localStorage with JSON and graceful failure (private windows, blocked storage, previews). */
const PREFIX = "hoc.";
const memory = new Map();

export const store = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (_) {
      return memory.has(key) ? memory.get(key) : fallback;
    }
  },
  set(key, value) {
    memory.set(key, value);
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch (_) { /* memory only */ }
  },
  remove(key) {
    memory.delete(key);
    try { localStorage.removeItem(PREFIX + key); } catch (_) { /* ignore */ }
  }
};

export function randomCode(length = 10) {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => alphabet[b % alphabet.length]).join("");
}

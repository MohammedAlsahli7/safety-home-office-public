/* Message transport over one ntfy topic (https://ntfy.sh, open source).
   - Subscribe: Server-Sent Events with ?since=all, so a reloaded page replays the whole session.
   - Publish:   plain POST to the topic URL (a "simple" CORS request, no preflight).
   - Messages are de-duplicated by id, because EventSource reconnects replay the cache.
   - Failed publishes go to an outbox and are retried, so a flaky phone connection loses nothing. */
import { config, topicFor } from "./config.js";
import { randomCode } from "./store.js";

class Relay {
  constructor({ session, onMessage, onStatus }) {
    this.url = `${config.relay}/${encodeURIComponent(topicFor(session))}`;
    this.onMessage = onMessage || (() => {});
    this.onStatus = onStatus || (() => {});
    this.seen = new Set();
    this.status = "idle";
    this.outbox = [];
    this.es = null;
    this.retryTimer = null;
    this.flushTimer = null;
  }

  connect() {
    this.close();
    if (typeof EventSource === "undefined") { this._setStatus("offline"); return; }
    this._setStatus("connecting");
    const es = new EventSource(`${this.url}/sse?since=all`);
    this.es = es;
    es.addEventListener("open", () => this._setStatus("live"));
    es.addEventListener("keepalive", () => this._setStatus("live"));
    es.addEventListener("message", e => this._handle(e.data));
    es.addEventListener("error", () => {
      if (es.readyState === EventSource.CLOSED) {
        this._setStatus("offline");
        this.retryTimer = setTimeout(() => this.connect(), 5000);
      } else {
        this._setStatus("reconnecting");
      }
    });
  }

  /* Fire and forget: queues on failure and retries every few seconds. */
  send(payload) {
    this.outbox.push(payload);
    this._flush();
  }

  async _flush() {
    if (this.flushing) return;
    this.flushing = true;
    clearTimeout(this.flushTimer);
    while (this.outbox.length) {
      try {
        const res = await fetch(this.url, { method: "POST", body: JSON.stringify(this.outbox[0]), cache: "no-store" });
        if (!res.ok) throw new Error(`Relay answered ${res.status}`);
        this.outbox.shift();
      } catch (_) {
        this.flushTimer = setTimeout(() => this._flush(), 4000);
        break;
      }
    }
    this.flushing = false;
  }

  close() {
    clearTimeout(this.retryTimer);
    if (this.es) { this.es.close(); this.es = null; }
  }

  _handle(raw) {
    let msg;
    try { msg = JSON.parse(raw); } catch (_) { return; }
    if (!msg || msg.event !== "message" || typeof msg.message !== "string") return;
    if (msg.id) {
      if (this.seen.has(msg.id)) return;
      this.seen.add(msg.id);
    }
    let payload;
    try { payload = JSON.parse(msg.message); } catch (_) { return; }
    if (payload && typeof payload === "object") this.onMessage(payload, { id: msg.id, time: msg.time });
    this._setStatus("live");
  }

  _setStatus(status) {
    if (status === this.status) return;
    this.status = status;
    this.onStatus(status);
  }
}

/* Demo transport: same interface, no network. Pages on the same origin (presenter and
   phone previews) share messages over BroadcastChannel; a newcomer asks peers to replay. */
class DemoRelay {
  constructor({ session, onMessage, onStatus }) {
    this.onMessage = onMessage || (() => {});
    this.onStatus = onStatus || (() => {});
    this.seen = new Set();
    this.log = [];
    this.status = "idle";
    try { this.ch = new BroadcastChannel("hoc-demo-" + session); } catch (_) { this.ch = null; }
  }

  connect() {
    if (this.ch) {
      this.ch.onmessage = e => {
        const d = e.data || {};
        if (d.msg) this._deliver(d.msg);
        else if (d.sync) this.ch.postMessage({ replay: this.log });
        else if (Array.isArray(d.replay)) d.replay.forEach(m => this._deliver(m));
      };
    }
    setTimeout(() => {
      this._setStatus("live");
      if (this.ch) this.ch.postMessage({ sync: true });
    }, 120);
  }

  send(payload) {
    const msg = { id: randomCode(12), payload };
    this._deliver(msg);
    if (this.ch) this.ch.postMessage({ msg });
  }

  close() {
    if (this.ch) { this.ch.onmessage = null; this.ch.close(); this.ch = null; }
  }

  _deliver(msg) {
    if (!msg || !msg.id || this.seen.has(msg.id)) return;
    this.seen.add(msg.id);
    this.log.push(msg);
    this.onMessage(msg.payload, { id: msg.id });
  }

  _setStatus(status) {
    if (status === this.status) return;
    this.status = status;
    this.onStatus(status);
  }
}

export const createRelay = opts => (config.demo ? new DemoRelay(opts) : new Relay(opts));

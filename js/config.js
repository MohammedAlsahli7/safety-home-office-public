/* Runtime settings. URL overrides:
   ?s=<session code, the fingerprint of the presenter's key>   ?relay=<ntfy base URL, e.g. a self-hosted ntfy>
   ?demo (simulated players, no network) */
const params = new URLSearchParams(location.search);
const customRelay = (params.get("relay") || "").trim().replace(/\/+$/, "");

export const config = Object.freeze({
  demo: params.has("demo"),
  relay: customRelay || "https://ntfy.sh",
  customRelay,
  session: (params.get("s") || "").trim().toLowerCase(),
  topicPrefix: "hoc-",
  /* A chart or number stays hidden until at least this many people have answered it. */
  minGroup: 5,
  /* Seconds the eye break after the 20-second stare lasts. */
  restSeconds: 20
});

export const isSessionCode = code => /^[a-z0-9]{4,32}$/.test(code || "");
export const topicFor = session => config.topicPrefix + session;

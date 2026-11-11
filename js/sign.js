/* Presenter signatures. Only the presenter's browser can move the phones.
   - "Start a new session" makes an ECDSA P-256 key pair. The private key stays in that browser's
     localStorage (or travels in the private presenter link's #hash, which never reaches a server).
   - The public key goes into the QR code link (?k=…). Phones accept a `stage` message only if it is
     signed with the matching private key, and only if it is newer than the last one they accepted,
     so a copied host.html link, a hand-made POST to the topic, or a replayed old message does nothing. */

const ALG = { name: "ECDSA", namedCurve: "P-256" };
const SIG = { name: "ECDSA", hash: "SHA-256" };
const subtle = () => (typeof crypto !== "undefined" && crypto.subtle) || null;

export const canSign = () => !!subtle();

export function b64url(bytes) {
  let bin = "";
  new Uint8Array(bytes).forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function fromB64url(text) {
  const bin = atob(String(text).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}

/* What gets signed: the session, the stage and its time, so a signature can't be reused elsewhere */
export const stageText = (session, s, at) => `hoc|${session}|${s}|${at}`;

/* A new presenter key: { priv: JWK (keep private), pub: base64url raw public key (goes in the QR link) } */
export async function newHostKey() {
  const pair = await subtle().generateKey(ALG, true, ["sign", "verify"]);
  const priv = await subtle().exportKey("jwk", pair.privateKey);
  const pub = b64url(await subtle().exportKey("raw", pair.publicKey));
  return { priv, pub };
}

export async function signer(privJwk) {
  const key = await subtle().importKey("jwk", privJwk, ALG, false, ["sign"]);
  return async text => b64url(await subtle().sign(SIG, key, new TextEncoder().encode(text)));
}

/* Returns verify(text, sig) → Promise<boolean>; any malformed input is simply "not valid" */
export async function verifier(pubB64) {
  const key = await subtle().importKey("raw", fromB64url(pubB64), ALG, false, ["verify"]);
  return async (text, sig) => {
    try {
      return typeof sig === "string" && await subtle().verify(SIG, key, fromB64url(sig), new TextEncoder().encode(text));
    } catch (_) {
      return false;
    }
  };
}

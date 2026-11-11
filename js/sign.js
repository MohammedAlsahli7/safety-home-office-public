/* Presenter signatures. Only the presenter's browser can move the phones.
   - "Start a new session" makes an ECDSA P-256 key pair. The private key stays in that browser's
     localStorage (or travels in the private presenter link's #hash, which never reaches a server).
   - The session code in the QR link is a fingerprint of the public key (16 characters of its SHA-256,
     about 78 bits), so the link stays short. Each stage carries the public key; a phone accepts it only
     if its fingerprint is the session code, the signature checks out, and it is newer than the last
     stage it accepted. A copied host.html link, a hand-made or self-signed POST to the topic, or a
     replayed old message does nothing. */

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

/* The session code for a public key: 16 characters from the same alphabet as randomCode */
const CODE = "abcdefghjkmnpqrstuvwxyz23456789";
export async function fingerprint(pubB64) {
  const hash = new Uint8Array(await subtle().digest("SHA-256", fromB64url(pubB64)));
  return Array.from(hash.slice(0, 16), b => CODE[b % CODE.length]).join("");
}

/* What gets signed: the session, the stage and its time, so a signature can't be reused elsewhere */
export const stageText = (session, s, at) => `hoc|${session}|${s}|${at}`;

/* A new presenter key: { priv: JWK (keep private), pub: base64url raw public key (sent with each stage) } */
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

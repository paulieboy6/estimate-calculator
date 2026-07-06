// Minimal shared-password admin auth. No user accounts: one password (env
// var ADMIN_PASSWORD) grants a signed session cookie. Uses Web Crypto
// (`crypto.subtle`) instead of Node's `crypto` module so this file works
// unchanged in both the Edge middleware and Node.js Server Actions.

export const ADMIN_COOKIE_NAME = "admin_session";

const encoder = new TextEncoder();

function bufToHex(buf) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} environment variable.`);
  return value;
}

async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return bufToHex(sig);
}

export async function createSessionToken() {
  const secret = requiredEnv("ADMIN_SESSION_SECRET");
  return hmacHex(secret, "admin-session");
}

export async function isValidSessionToken(token) {
  if (!token) return false;
  const expected = await createSessionToken();
  return timingSafeEqual(token, expected);
}

export function isCorrectPassword(input) {
  const expected = requiredEnv("ADMIN_PASSWORD");
  return timingSafeEqual(input || "", expected);
}

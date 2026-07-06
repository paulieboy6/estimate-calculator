import crypto from "crypto";

// Per-client leads-portal auth. Unlike lib/auth.js (one shared admin
// password), each client has their own password, hashed and stored in
// clients.portal_password_hash. This file only runs in Server Components /
// Server Actions (never Edge middleware), so it can use Node's `crypto`
// directly instead of Web Crypto.

export const PORTAL_COOKIE_NAME = "portal_session";

function requiredSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("Missing ADMIN_SESSION_SECRET environment variable.");
  return secret;
}

export function hashPortalPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPortalPassword(password, stored) {
  if (!stored) return false;
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const hashBuffer = Buffer.from(hash, "hex");
  const candidateBuffer = crypto.scryptSync(password, salt, 64);
  return hashBuffer.length === candidateBuffer.length && crypto.timingSafeEqual(hashBuffer, candidateBuffer);
}

// The session token is signed with both the client id and their current
// password hash, so changing a client's password automatically invalidates
// any existing session for it.
export function createPortalSessionToken(clientId, passwordHash) {
  const sig = crypto
    .createHmac("sha256", requiredSecret())
    .update(`${clientId}:${passwordHash}`)
    .digest("hex");
  return `${clientId}.${sig}`;
}

export function isValidPortalSession(token, clientId, passwordHash) {
  if (!token || !passwordHash) return false;
  const [id, sig] = token.split(".");
  if (id !== clientId || !sig) return false;
  const expected = crypto
    .createHmac("sha256", requiredSecret())
    .update(`${clientId}:${passwordHash}`)
    .digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

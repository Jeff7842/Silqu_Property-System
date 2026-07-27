import bcrypt from "bcryptjs";
import crypto from "node:crypto";

const HASH_ROUNDS = 12;

export function hashPassword(plain: string) {
  return bcrypt.hash(plain, HASH_ROUNDS);
}

export function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

/** For staff onboarding: a one-time password emailed to a new user, forced to change on first login. */
export function generateTempPassword() {
  return crypto.randomBytes(9).toString("base64url");
}

/** For password-reset and invitation links: raw token goes in the email, only the hash is stored. */
export function generateToken() {
  const raw = crypto.randomBytes(32).toString("base64url");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
}

export function hashToken(raw: string) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

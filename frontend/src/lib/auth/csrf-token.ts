import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { parseEncryptionKey } from "../session/crypto.ts";

const VERSION = "v1";
const TOKEN_TTL_SECONDS = 30 * 60;

/** Derives a dedicated HMAC key from the existing session secret. */
export function loadAuthCsrfSecret(
  env: NodeJS.ProcessEnv = process.env,
): Buffer {
  const value = env.SESSION_ENCRYPTION_KEY?.trim();
  if (!value) throw new Error("Missing auth configuration: SESSION_ENCRYPTION_KEY");
  return createHmac("sha256", parseEncryptionKey(value))
    .update("auth-csrf:v1")
    .digest();
}

function sign(payload: string, secret: Buffer): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createAuthCsrfToken(
  secret: Buffer,
  now = Math.floor(Date.now() / 1000),
): string {
  const payload = `${VERSION}.${now + TOKEN_TTL_SECONDS}.${randomBytes(16).toString("base64url")}`;
  return `${payload}.${sign(payload, secret)}`;
}

export function verifyAuthCsrfToken(
  secret: Buffer,
  token: unknown,
  now = Math.floor(Date.now() / 1000),
): boolean {
  if (typeof token !== "string") return false;
  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== VERSION) return false;
  const expires = Number(parts[1]);
  if (!Number.isInteger(expires) || expires <= now) return false;
  if (expires > now + TOKEN_TTL_SECONDS + 60) return false;

  const expected = Buffer.from(sign(parts.slice(0, 3).join("."), secret));
  const provided = Buffer.from(parts[3]);
  return (
    expected.length === provided.length &&
    timingSafeEqual(expected, provided)
  );
}

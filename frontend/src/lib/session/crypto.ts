import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { SessionConfigError } from "./errors.ts";
import type { SessionRecord } from "./types.ts";

const IV_BYTES = 12;
const VERSION = "v1";

export function createSessionId(): string {
  return randomBytes(32).toString("base64url");
}

export function createCsrfToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Only the hash of the browser session ID is used as the Redis key. */
export function hashSessionId(sessionId: string): string {
  return createHash("sha256").update(sessionId, "utf8").digest("hex");
}

export function isSessionId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{43,64}$/.test(value);
}

export function parseEncryptionKey(value: string): Buffer {
  const trimmed = value.trim();
  const key = /^[0-9a-fA-F]{64}$/.test(trimmed)
    ? Buffer.from(trimmed, "hex")
    : Buffer.from(trimmed, "base64url");
  if (key.length !== 32)
    throw new SessionConfigError(
      "Invalid session configuration: SESSION_ENCRYPTION_KEY",
    );
  return key;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyText(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isExpiry(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function assertRecord(value: unknown): asserts value is SessionRecord {
  if (
    !isRecord(value) ||
    !isNonEmptyText(value.accessToken) ||
    !isNonEmptyText(value.refreshToken) ||
    !isNonEmptyText(value.csrfToken) ||
    !isExpiry(value.accessExpiresAt) ||
    !isExpiry(value.refreshExpiresAt)
  )
    throw new SessionConfigError("Invalid session data.");
}

export function encryptSession(record: SessionRecord, key: Buffer): string {
  assertRecord(record);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const plaintext = Buffer.from(JSON.stringify(record), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    VERSION,
    iv.toString("base64url"),
    tag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

export function decryptSession(value: string, key: Buffer): SessionRecord {
  const parts = value.split(".");
  if (parts.length !== 4 || parts[0] !== VERSION)
    throw new SessionConfigError("Invalid session data.");
  try {
    const iv = Buffer.from(parts[1], "base64url");
    const tag = Buffer.from(parts[2], "base64url");
    const ciphertext = Buffer.from(parts[3], "base64url");
    if (iv.length !== IV_BYTES || tag.length !== 16)
      throw new SessionConfigError("Invalid session data.");
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString("utf8");
    const record: unknown = JSON.parse(plaintext);
    assertRecord(record);
    return record;
  } catch {
    throw new SessionConfigError("Invalid session data.");
  }
}

/** Read (not verify) a JWT expiry; the token itself came from Nest over TLS. */
export function decodeJwtExpiry(token: string): number | null {
  if (typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload: unknown = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8"),
    );
    if (!isRecord(payload) || !isExpiry(payload.exp)) return null;
    return payload.exp;
  } catch {
    return null;
  }
}

export function timingSafeTextEqual(left: string, right: string): boolean {
  const a = Buffer.from(left, "utf8");
  const b = Buffer.from(right, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

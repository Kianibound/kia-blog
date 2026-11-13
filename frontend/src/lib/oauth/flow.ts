import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

/** Server-side OAuth browser-flow state; Nest owns state/PKCE generation. */

export type OAuthProvider = "google" | "github";

export type OAuthFlowReason =
  | "state"
  | "denied"
  | "provider"
  | "conflict"
  | "unavailable"
  | "unexpected";

export type OAuthFlowRecord = {
  provider: OAuthProvider;
  flowVerifier: string;
  expiresAt: number;
};

export const FLOW_TTL_SECONDS = 600;
const FLOW_VERSION = "o1";
const IV_BYTES = 12;
const VERIFIER = /^[A-Za-z0-9_-]{43}$/;
const FLOW_ID = /^[A-Za-z0-9_-]{43}$/;

const PROVIDER_HOSTS: Record<OAuthProvider, string> = {
  google: "accounts.google.com",
  github: "github.com",
};

export function isOAuthProvider(value: unknown): value is OAuthProvider {
  return value === "google" || value === "github";
}

export function createFlowId(): string {
  return randomBytes(32).toString("base64url");
}

export function isFlowId(value: unknown): value is string {
  return typeof value === "string" && FLOW_ID.test(value);
}

export function isFlowVerifier(value: unknown): value is string {
  return typeof value === "string" && VERIFIER.test(value);
}

export function flowStoreKey(flowId: string): string {
  return `oauth_flow:${createHash("sha256").update(flowId, "utf8").digest("hex")}`;
}

export function flowCookieName(secure: boolean): string {
  return secure ? "__Host-kia_oauth_flow" : "kia_oauth_flow";
}

export function callbackPath(provider: OAuthProvider): string {
  return `/auth/${provider}/callback`;
}

/** The callback never accepts a caller-supplied redirect target. */
export function loginErrorPath(reason: OAuthFlowReason): string {
  return `/login?error=oauth&reason=${reason}`;
}

export function isOAuthReason(value: unknown): value is OAuthFlowReason {
  return (
    value === "state" ||
    value === "denied" ||
    value === "provider" ||
    value === "conflict" ||
    value === "unavailable" ||
    value === "unexpected"
  );
}

/**
 * Only the provider's own HTTPS origin may receive the browser. Local HTTP is
 * permitted solely under the existing test-mode flag for the fixture host.
 */
export function isTrustedAuthorizationUrl(
  value: unknown,
  provider: OAuthProvider,
  allowTestHost = false,
): value is string {
  if (typeof value !== "string" || value.length > 2048) return false;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.username || url.password || url.hash) return false;
  if (url.protocol === "https:") return url.hostname === PROVIDER_HOSTS[provider];
  return (
    allowTestHost &&
    url.protocol === "http:" &&
    url.hostname === "127.0.0.1"
  );
}

export function parseAuthorizationResponse(
  provider: OAuthProvider,
  payload: unknown,
  allowTestHost = false,
): { authorizationUrl: string; flowVerifier: string; ttlSeconds: number } | null {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload))
    return null;
  const { authorizationUrl, flowVerifier, expiresIn } = payload as Record<
    string,
    unknown
  >;
  if (!isTrustedAuthorizationUrl(authorizationUrl, provider, allowTestHost))
    return null;
  if (!isFlowVerifier(flowVerifier)) return null;
  if (
    typeof expiresIn !== "number" ||
    !Number.isFinite(expiresIn) ||
    expiresIn < 60 ||
    expiresIn > 900
  )
    return null;
  return {
    authorizationUrl,
    flowVerifier,
    ttlSeconds: Math.min(FLOW_TTL_SECONDS, Math.floor(expiresIn)),
  };
}

/** Nest 401 is a provider denial or identity failure; 409 is an email collision. */
export function nestOAuthFailure(status: number): OAuthFlowReason {
  if (status === 409) return "conflict";
  if (status === 401) return "provider";
  if (status === 503) return "unavailable";
  return "unexpected";
}

export function parseFlowRecord(value: unknown): OAuthFlowRecord | null {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return null;
  const record = value as Record<string, unknown>;
  if (!isOAuthProvider(record.provider) || !isFlowVerifier(record.flowVerifier))
    return null;
  if (
    typeof record.expiresAt !== "number" ||
    !Number.isFinite(record.expiresAt) ||
    record.expiresAt <= 0
  )
    return null;
  return {
    provider: record.provider,
    flowVerifier: record.flowVerifier,
    expiresAt: record.expiresAt,
  };
}

/** Flow records are encrypted at rest in the shared server-side store. */
export function encryptFlow(record: OAuthFlowRecord, key: Buffer): string {
  const parsed = parseFlowRecord(record);
  if (!parsed || key.length !== 32) throw new Error("Invalid OAuth flow");
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(parsed), "utf8"),
    cipher.final(),
  ]);
  return [
    FLOW_VERSION,
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

export function decryptFlow(value: string, key: Buffer): OAuthFlowRecord {
  const parts = value.split(".");
  if (parts.length !== 4 || parts[0] !== FLOW_VERSION)
    throw new Error("Invalid OAuth flow");
  try {
    const iv = Buffer.from(parts[1], "base64url");
    const tag = Buffer.from(parts[2], "base64url");
    const ciphertext = Buffer.from(parts[3], "base64url");
    if (iv.length !== IV_BYTES || tag.length !== 16 || key.length !== 32)
      throw new Error("Invalid OAuth flow");
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString("utf8");
    const record = parseFlowRecord(JSON.parse(plaintext));
    if (!record) throw new Error("Invalid OAuth flow");
    return record;
  } catch {
    throw new Error("Invalid OAuth flow");
  }
}

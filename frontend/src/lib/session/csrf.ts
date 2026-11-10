import { CsrfError } from "./errors.ts";
import { timingSafeTextEqual } from "./crypto.ts";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function isSafeMethod(method: string | undefined | null): boolean {
  return SAFE_METHODS.has((method ?? "GET").toUpperCase());
}

/**
 * State-changing requests must carry an Origin header that matches the app's
 * own origin. Missing or foreign origins are rejected (fail closed).
 */
export function assertSameOrigin(
  origin: string | null | undefined,
  expectedOrigin: string,
): void {
  if (!origin || origin !== expectedOrigin) throw new CsrfError();
}

export function assertSafeMutation(
  method: string | undefined | null,
  origin: string | null | undefined,
  expectedOrigin: string,
): void {
  if (isSafeMethod(method)) return;
  assertSameOrigin(origin, expectedOrigin);
}

export function assertCsrfToken(
  expected: string | null | undefined,
  provided: string | null | undefined,
): void {
  if (!expected || !provided || !timingSafeTextEqual(expected, provided))
    throw new CsrfError();
}

/**
 * Only same-origin absolute paths are accepted as post-login redirect targets.
 * Protocol-relative, backslash and encoded-slash tricks are rejected.
 */
export function safeRedirectPath(
  value: unknown,
  fallback = "/",
): string {
  if (typeof value !== "string" || value.length === 0) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  if (value.includes("\\") || /[\u0000-\u001f\u007f]/.test(value)) return fallback;
  if (/%2f|%5c/i.test(value)) return fallback;
  if (value.startsWith("/%09") || value.startsWith("/%0d") || value.startsWith("/%0a"))
    return fallback;
  return value;
}

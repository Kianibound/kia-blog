import { isSessionId } from "./crypto.ts";

export type SessionCookieOptions = {
  name: string;
  value: string;
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
  maxAge: number;
};

function assertCookieName(name: string): void {
  if (!/^[A-Za-z0-9_-]+$/.test(name)) throw new Error("Invalid session cookie name");
  if (name.startsWith("__Host-") && !name.startsWith("__Host-kia_"))
    throw new Error("Invalid session cookie name");
}

export function sessionCookieOptions(
  name: string,
  sessionId: string,
  maxAgeSeconds: number,
  secure: boolean,
): SessionCookieOptions {
  assertCookieName(name);
  // The raw ID is opaque base64url; anything else never reaches the browser.
  if (!isSessionId(sessionId)) throw new Error("Invalid session identifier");
  return {
    name,
    value: sessionId,
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: Math.max(1, Math.floor(maxAgeSeconds)),
  };
}

export function clearedSessionCookieOptions(
  name: string,
  secure: boolean,
): SessionCookieOptions {
  assertCookieName(name);
  return {
    name,
    value: "",
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  };
}

export function serializeSessionCookie(options: SessionCookieOptions): string {
  const parts = [
    `${options.name}=${options.value}`,
    `Max-Age=${options.maxAge}`,
    "Path=/",
  ];
  if (options.secure) parts.push("Secure");
  parts.push("HttpOnly", "SameSite=Lax");
  return parts.join("; ");
}

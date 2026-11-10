import type { FetchLike } from "../session/types.ts";

export type AuthenticatedUser = {
  id: string;
  email: string;
  username: string;
  name: string | null;
  role: "USER" | "AUTHOR" | "ADMIN";
};

export type LoginResult = {
  accessToken: string;
  refreshToken: string;
  user: AuthenticatedUser;
};

export type RegisterResult = {
  user: AuthenticatedUser;
};

export type AuthFailureKind =
  | "invalid-credentials"
  | "duplicate-email"
  | "rate-limit"
  | "validation"
  | "unavailable"
  | "uncertain"
  | "protocol";

/** Errors never carry credentials, tokens or upstream response bodies. */
export class AuthRequestError extends Error {
  readonly kind: AuthFailureKind;

  constructor(kind: AuthFailureKind) {
    super(kind);
    this.name = "AuthRequestError";
    this.kind = kind;
  }
}

export type AuthClientOptions = {
  apiBaseUrl: string;
  fetchImpl?: FetchLike;
  timeoutMs?: number;
};

const ROLES = new Set(["USER", "AUTHOR", "ADMIN"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

/** Role is always the server-provided role; callers never choose it. */
export function parseAuthenticatedUser(
  value: unknown,
): AuthenticatedUser | null {
  if (!isRecord(value) || !isRecord(value.role)) return null;
  if (
    !nonEmpty(value.id) ||
    !nonEmpty(value.email) ||
    !nonEmpty(value.username) ||
    !nonEmpty(value.role.name) ||
    !ROLES.has(value.role.name) ||
    !(value.name === null || typeof value.name === "string")
  )
    return null;
  return {
    id: value.id,
    email: value.email,
    username: value.username,
    name: value.name,
    role: value.role.name as AuthenticatedUser["role"],
  };
}

export async function loginWithNest(
  credentials: { email: string; password: string },
  options: AuthClientOptions,
): Promise<LoginResult> {
  const payload = await postAuth(
    options,
    "/auth/login",
    { email: credentials.email, password: credentials.password },
  );
  const user = parseAuthenticatedUser(payload.user);
  if (
    !user ||
    !nonEmpty(payload.accessToken) ||
    !nonEmpty(payload.refreshToken)
  )
    throw new AuthRequestError("protocol");
  return {
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
    user,
  };
}

export async function registerWithNest(
  credentials: {
    email: string;
    password: string;
    confirmPassword: string;
  },
  options: AuthClientOptions,
): Promise<RegisterResult> {
  // USER-only: no role, username or name is sent from the browser.
  const payload = await postAuth(options, "/auth/register", {
    email: credentials.email,
    password: credentials.password,
    confirmPassword: credentials.confirmPassword,
  });
  const user = parseAuthenticatedUser(payload.user);
  if (!user || user.role !== "USER")
    throw new AuthRequestError("protocol");
  return { user };
}

function failureForStatus(status: number): AuthFailureKind {
  if (status === 401 || status === 403) return "invalid-credentials";
  if (status === 409) return "duplicate-email";
  if (status === 429) return "rate-limit";
  if (status === 400 || status === 422) return "validation";
  if (status >= 500) return "unavailable";
  return "protocol";
}

async function postAuth(
  options: AuthClientOptions,
  path: string,
  body: Record<string, string>,
): Promise<Record<string, unknown>> {
  const fetchImpl =
    options.fetchImpl ?? ((input: string | URL, init?: RequestInit) =>
      fetch(input, init));
  let response: Response;
  try {
    response = await fetchImpl(new URL(path, options.apiBaseUrl), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(options.timeoutMs ?? 10_000),
    });
  } catch {
    // The request may or may not have reached Nest; callers must not retry
    // blindly (registration) or claim success (login).
    throw new AuthRequestError("uncertain");
  }

  if (!response.ok) throw new AuthRequestError(failureForStatus(response.status));

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new AuthRequestError("protocol");
  }
  if (!isRecord(payload)) throw new AuthRequestError("protocol");
  return payload;
}

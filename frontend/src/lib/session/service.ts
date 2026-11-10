import {
  createCsrfToken,
  createSessionId,
  decodeJwtExpiry,
  decryptSession,
  encryptSession,
  hashSessionId,
  isSessionId,
  timingSafeTextEqual,
} from "./crypto.ts";
import {
  AuthenticationUnavailableError,
  CsrfError,
  SessionStoreUnavailableError,
  UnauthenticatedError,
} from "./errors.ts";
import { assertSafeMutation, isSafeMethod } from "./csrf.ts";
import type { FetchLike, SessionRecord, SessionStore } from "./types.ts";

const KEY_PREFIX = "session:";
/** Refresh an access token slightly before Nest rejects it. */
export const ACCESS_REFRESH_SKEW_SECONDS = 60;
export const DEFAULT_ACCESS_TTL_SECONDS = 15 * 60;
export const DEFAULT_REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;
const CREATE_ATTEMPTS = 3;

export type SessionCredentials = {
  accessToken: string;
  refreshToken: string;
};

export type CreatedSession = {
  sessionId: string;
  csrfToken: string;
  maxAge: number;
};

export type SessionServiceOptions = {
  store: SessionStore;
  /** 32-byte AES key; see `parseEncryptionKey`. */
  encryptionKey: Buffer;
  apiBaseUrl: string;
  /** Exact trusted browser origin for mutation checks. */
  appOrigin: string;
  fetchImpl?: FetchLike;
  /** Epoch seconds; injectable for deterministic tests. */
  now?: () => number;
  timeoutMs?: number;
};

export type MutationRequestInit = RequestInit & {
  origin?: string | null;
  csrfToken?: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readAccessToken(payload: unknown): string | null {
  if (!isRecord(payload)) return null;
  const token = payload.accessToken;
  return typeof token === "string" && token.length > 0 ? token : null;
}

/**
 * Server-only session service. Browser state is just an opaque session ID;
 * tokens, CSRF secrets and expiries live encrypted in the session store.
 */
export class SessionService {
  private readonly store: SessionStore;
  private readonly encryptionKey: Buffer;
  private readonly apiBaseUrl: string;
  private readonly appOrigin: string;
  private readonly fetchImpl: FetchLike;
  private readonly now: () => number;
  private readonly timeoutMs: number;
  private readonly inFlight = new Map<string, Promise<string>>();

  constructor(options: SessionServiceOptions) {
    if (options.encryptionKey.length !== 32)
      throw new Error("Invalid session encryption key");
    this.store = options.store;
    this.encryptionKey = options.encryptionKey;
    this.apiBaseUrl = options.apiBaseUrl;
    this.appOrigin = options.appOrigin;
    this.fetchImpl = options.fetchImpl ?? ((input, init) => fetch(input, init));
    this.now = options.now ?? (() => Math.floor(Date.now() / 1000));
    this.timeoutMs = options.timeoutMs ?? 5000;
  }

  private key(sessionId: string): string {
    return `${KEY_PREFIX}${hashSessionId(sessionId)}`;
  }

  private ttl(record: SessionRecord): number {
    return record.refreshExpiresAt - this.now();
  }

  /** Conditional write: never recreate a session deleted by logout. */
  private async saveIfPresent(
    sessionId: string,
    record: SessionRecord,
  ): Promise<boolean> {
    const ttl = this.ttl(record);
    if (ttl <= 0) return false;
    return this.store.setIfPresent(
      this.key(sessionId),
      encryptSession(record, this.encryptionKey),
      ttl,
    );
  }

  async createSession(credentials: SessionCredentials): Promise<CreatedSession> {
    if (
      typeof credentials.accessToken !== "string" ||
      credentials.accessToken.length === 0 ||
      typeof credentials.refreshToken !== "string" ||
      credentials.refreshToken.length === 0
    )
      throw new UnauthenticatedError();

    const now = this.now();
    const accessExpiresAt =
      decodeJwtExpiry(credentials.accessToken) ?? now + DEFAULT_ACCESS_TTL_SECONDS;
    const refreshExpiresAt =
      decodeJwtExpiry(credentials.refreshToken) ??
      now + DEFAULT_REFRESH_TTL_SECONDS;
    if (refreshExpiresAt <= now) throw new UnauthenticatedError();

    const record: SessionRecord = {
      accessToken: credentials.accessToken,
      refreshToken: credentials.refreshToken,
      csrfToken: createCsrfToken(),
      accessExpiresAt,
      refreshExpiresAt,
    };
    const payload = encryptSession(record, this.encryptionKey);
    const ttl = this.ttl(record);

    for (let attempt = 0; attempt < CREATE_ATTEMPTS; attempt += 1) {
      const sessionId = createSessionId();
      // Atomic SET NX prevents reusing an existing session key.
      if (await this.store.setIfAbsent(this.key(sessionId), payload, ttl))
        return { sessionId, csrfToken: record.csrfToken, maxAge: ttl };
    }
    throw new SessionStoreUnavailableError();
  }

  async loadSession(sessionId: unknown): Promise<SessionRecord | null> {
    if (!isSessionId(sessionId)) return null;
    const raw = await this.store.get(this.key(sessionId));
    if (raw === null) return null;
    let record: SessionRecord;
    try {
      record = decryptSession(raw, this.encryptionKey);
    } catch {
      // Corrupt or foreign data must never be trusted; drop it.
      await this.invalidate(sessionId);
      return null;
    }
    if (record.refreshExpiresAt <= this.now()) {
      await this.invalidate(sessionId);
      return null;
    }
    return record;
  }

  async getCsrfToken(sessionId: unknown): Promise<string> {
    const record = await this.loadSession(sessionId);
    if (!record || !isSessionId(sessionId)) throw new UnauthenticatedError();
    return record.csrfToken;
  }

  async assertCsrf(sessionId: unknown, token: unknown): Promise<void> {
    if (typeof token !== "string" || token.length === 0) throw new CsrfError();
    const record = await this.loadSession(sessionId);
    if (!record) throw new UnauthenticatedError();
    if (!timingSafeTextEqual(record.csrfToken, token)) throw new CsrfError();
  }

  async getAccessToken(sessionId: unknown): Promise<string> {
    const record = await this.loadSession(sessionId);
    if (!record || !isSessionId(sessionId)) throw new UnauthenticatedError();
    if (record.accessExpiresAt - this.now() > ACCESS_REFRESH_SKEW_SECONDS)
      return record.accessToken;
    return this.refreshAccessToken(sessionId);
  }

  /**
   * Nest reissues access tokens only; the refresh token is reused. Concurrent
   * callers within one server instance share a single refresh request.
   */
  async refreshAccessToken(sessionId: unknown): Promise<string> {
    if (!isSessionId(sessionId)) throw new UnauthenticatedError();
    const existing = this.inFlight.get(sessionId);
    if (existing) return existing;

    const pending = this.performRefresh(sessionId).finally(() => {
      this.inFlight.delete(sessionId);
    });
    this.inFlight.set(sessionId, pending);
    return pending;
  }

  private async performRefresh(sessionId: string): Promise<string> {
    const record = await this.loadSession(sessionId);
    if (!record) throw new UnauthenticatedError();
    if (record.refreshExpiresAt <= this.now()) {
      await this.invalidate(sessionId);
      throw new UnauthenticatedError();
    }

    let response: Response;
    try {
      response = await this.fetchImpl(`${this.apiBaseUrl}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ refreshToken: record.refreshToken }),
        cache: "no-store",
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch {
      throw new AuthenticationUnavailableError();
    }

    if (response.status === 401 || response.status === 403) {
      await this.invalidate(sessionId);
      throw new UnauthenticatedError();
    }
    if (!response.ok) throw new AuthenticationUnavailableError();

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new AuthenticationUnavailableError();
    }
    const accessToken = readAccessToken(payload);
    if (!accessToken) throw new AuthenticationUnavailableError();

    const refreshed: SessionRecord = {
      ...record,
      accessToken,
      accessExpiresAt:
        decodeJwtExpiry(accessToken) ?? this.now() + DEFAULT_ACCESS_TTL_SECONDS,
    };
    const saved = await this.saveIfPresent(sessionId, refreshed);
    if (!saved) {
      // Logout/invalidation won the race. Never recreate the session.
      throw new UnauthenticatedError();
    }
    return accessToken;
  }

  async invalidate(sessionId: unknown): Promise<void> {
    if (!isSessionId(sessionId)) return;
    await this.store.delete(this.key(sessionId));
  }

  /** Revoke the Nest refresh session, then always drop the browser session. */
  async logout(sessionId: unknown): Promise<void> {
    if (!isSessionId(sessionId)) return;
    const record = await this.loadSession(sessionId);
    if (record) {
      try {
        await this.fetchImpl(`${this.apiBaseUrl}/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ refreshToken: record.refreshToken }),
          cache: "no-store",
          signal: AbortSignal.timeout(this.timeoutMs),
        });
      } catch {
        // The local session is still removed below; backend revocation is
        // best-effort because Nest will reject it once it expires anyway.
      }
    }
    await this.invalidate(sessionId);
  }

  apiUrl(path: string): string {
    if (
      typeof path !== "string" ||
      !path.startsWith("/") ||
      path.startsWith("//") ||
      path.includes("\\")
    )
      throw new Error("Invalid API path");
    return new URL(path, this.apiBaseUrl).toString();
  }

  /**
   * Server-only authenticated Nest read. Unsafe methods are rejected so they
   * must go through the Origin/CSRF-checked mutation entry point.
   */
  async authedFetch(
    sessionId: unknown,
    path: string,
    init: RequestInit = {},
  ): Promise<Response> {
    if (!isSessionId(sessionId)) throw new UnauthenticatedError();
    if (!isSafeMethod(init.method ?? "GET")) throw new CsrfError();
    return this.sendAuthed(sessionId, path, init);
  }

  /**
   * Authenticated mutation helper. It always requires both the request Origin
   * and the per-session CSRF token; there is no token-only bypass.
   */
  async authorizedMutation(
    sessionId: unknown,
    path: string,
    init: MutationRequestInit,
  ): Promise<Response> {
    if (!isSessionId(sessionId)) throw new UnauthenticatedError();
    const { origin, csrfToken, ...requestInit } = init;
    const method = (requestInit.method ?? "POST").toUpperCase();
    if (isSafeMethod(method)) throw new CsrfError();
    assertSafeMutation(method, origin, this.appOrigin);
    await this.assertCsrf(sessionId, csrfToken);
    return this.sendAuthed(sessionId, path, { ...requestInit, method });
  }

  private async sendAuthed(
    sessionId: string,
    path: string,
    requestInit: RequestInit,
  ): Promise<Response> {
    const send = async (token: string) => {
      const headers = new Headers(requestInit.headers);
      headers.set("Authorization", `Bearer ${token}`);
      return this.fetchImpl(this.apiUrl(path), {
        ...requestInit,
        headers,
        cache: "no-store",
        signal: requestInit.signal ?? AbortSignal.timeout(this.timeoutMs),
      });
    };

    const token = await this.getAccessToken(sessionId);
    const response = await send(token);
    if (response.status !== 401) return response;

    const refreshed = await this.refreshAccessToken(sessionId);
    const retried = await send(refreshed);
    if (retried.status === 401) {
      await this.invalidate(sessionId);
      throw new UnauthenticatedError();
    }
    return retried;
  }
}

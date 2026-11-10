import "server-only";
import { cookies } from "next/headers";
import { loadSessionConfig, type SessionConfig } from "./config.ts";
import { clearedSessionCookieOptions, sessionCookieOptions } from "./cookie.ts";
import { parseEncryptionKey } from "./crypto.ts";
import {
  handleMutationRequest,
  type AuthorizedMutationContext,
} from "./mutation-handler.ts";
import { SessionService } from "./service.ts";
import { UpstashSessionStore } from "./store.ts";
import type { SessionCredentials } from "./service.ts";

let cachedConfig: SessionConfig | null = null;
let cachedService: SessionService | null = null;

export function getSessionConfig(): SessionConfig {
  cachedConfig ??= loadSessionConfig();
  return cachedConfig;
}

/** Lazily built so an unconfigured deployment fails closed at use time. */
export function getSessionService(): SessionService {
  if (cachedService) return cachedService;
  const config = getSessionConfig();
  cachedService = new SessionService({
    store: new UpstashSessionStore({
      url: config.redisUrl,
      token: config.redisToken,
    }),
    encryptionKey: parseEncryptionKey(config.encryptionKey),
    apiBaseUrl: config.apiBaseUrl,
    appOrigin: config.appOrigin,
    // Refresh concurrently arrives at most once per session per instance.
  });
  return cachedService;
}

export async function readBrowserSessionId(): Promise<string | null> {
  const value = (await cookies()).get(getSessionConfig().cookieName)?.value;
  return value && value.length > 0 ? value : null;
}

export async function createBrowserSession(
  credentials: SessionCredentials,
): Promise<{ csrfToken: string }> {
  const config = getSessionConfig();
  const created = await getSessionService().createSession(credentials);
  (await cookies()).set(
    sessionCookieOptions(
      config.cookieName,
      created.sessionId,
      created.maxAge,
      config.secureCookies,
    ),
  );
  return { csrfToken: created.csrfToken };
}

/** Shared server-only entry point for authenticated state-changing handlers. */
export async function handleAuthenticatedMutation(
  request: Request,
  perform: (context: AuthorizedMutationContext) => Promise<Response>,
): Promise<Response> {
  return handleMutationRequest(
    request,
    {
      expectedOrigin: getSessionConfig().appOrigin,
      readSessionId: readBrowserSessionId,
      service: getSessionService(),
      clearCookie: clearBrowserSession,
    },
    perform,
  );
}

/** Logout uses the same Origin and CSRF checks as every other mutation. */
export async function handleLogoutMutation(
  request: Request,
): Promise<Response> {
  return handleAuthenticatedMutation(request, async ({ sessionId }) => {
    try {
      await getSessionService().logout(sessionId);
    } finally {
      await clearBrowserSession();
    }
    return new Response(null, { status: 204 });
  });
}

export async function clearBrowserSession(): Promise<void> {
  const config = getSessionConfig();
  (await cookies()).set(
    clearedSessionCookieOptions(config.cookieName, config.secureCookies),
  );
}

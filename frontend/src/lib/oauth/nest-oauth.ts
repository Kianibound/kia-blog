import {
  parseAuthenticatedUser,
  type AuthenticatedUser,
} from "../auth/nest-auth.ts";
import type { FetchLike } from "../session/types.ts";
import {
  createFlowId,
  decryptFlow,
  encryptFlow,
  flowStoreKey,
  isFlowId,
  nestOAuthFailure,
  parseAuthorizationResponse,
  type OAuthFlowReason,
  type OAuthProvider,
} from "./flow.ts";

/** Minimal server-side store; the Upstash session store satisfies it. */
export type OAuthFlowStore = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  delete(key: string): Promise<void>;
};

export type OAuthTokens = { accessToken: string; refreshToken: string };

export type BeginOAuthResult =
  | {
      status: "ok";
      authorizationUrl: string;
      flowId: string;
      ttlSeconds: number;
    }
  | { status: "failed"; reason: OAuthFlowReason };

export type CompleteOAuthResult =
  | { status: "success"; tokens: OAuthTokens; user: AuthenticatedUser }
  | { status: "failed"; reason: OAuthFlowReason };

export type OAuthFlowDeps = {
  provider: OAuthProvider;
  apiBaseUrl: string;
  fetchImpl: FetchLike;
  store: OAuthFlowStore;
  encryptionKey: Buffer;
  allowTestHost?: boolean;
  timeoutMs?: number;
  now?: number;
};

const STATE = /^[A-Za-z0-9_-]{43}$/;

async function postJson(
  deps: OAuthFlowDeps,
  path: string,
  body: Record<string, string> | undefined,
): Promise<Response> {
  return deps.fetchImpl(new URL(path, deps.apiBaseUrl), {
    method: "POST",
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: "no-store",
    signal: AbortSignal.timeout(deps.timeoutMs ?? 10_000),
  });
}

/**
 * Nest generates state + PKCE verifier. The verifier is encrypted into the
 * shared server-only store and bound to the browser by an opaque flow cookie.
 */
export async function beginOAuthFlow(
  deps: OAuthFlowDeps,
): Promise<BeginOAuthResult> {
  let response: Response;
  try {
    response = await postJson(deps, `/auth/${deps.provider}`, undefined);
  } catch {
    return { status: "failed", reason: "unavailable" };
  }
  if (!response.ok) return { status: "failed", reason: nestOAuthFailure(response.status) };
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return { status: "failed", reason: "unexpected" };
  }
  const parsed = parseAuthorizationResponse(
    deps.provider,
    payload,
    deps.allowTestHost,
  );
  if (!parsed) return { status: "failed", reason: "unexpected" };

  const now = deps.now ?? Date.now();
  const flowId = createFlowId();
  try {
    await deps.store.set(
      flowStoreKey(flowId),
      encryptFlow(
        {
          provider: deps.provider,
          flowVerifier: parsed.flowVerifier,
          expiresAt: now + parsed.ttlSeconds * 1000,
        },
        deps.encryptionKey,
      ),
      parsed.ttlSeconds,
    );
  } catch {
    return { status: "failed", reason: "unavailable" };
  }
  return {
    status: "ok",
    authorizationUrl: parsed.authorizationUrl,
    flowId,
    ttlSeconds: parsed.ttlSeconds,
  };
}

/**
 * Single-use completion: the flow record is deleted before the Nest exchange,
 * so a replayed callback can never re-use the stored verifier.
 */
export async function completeOAuthFlow(
  deps: OAuthFlowDeps,
  input: {
    flowId: unknown;
    state: unknown;
    code: unknown;
    error: unknown;
  },
): Promise<CompleteOAuthResult> {
  const now = deps.now ?? Date.now();
  if (!isFlowId(input.flowId)) return { status: "failed", reason: "state" };
  const key = flowStoreKey(input.flowId);
  let raw: string | null;
  try {
    raw = await deps.store.get(key);
  } catch {
    return { status: "failed", reason: "unavailable" };
  }
  if (!raw) return { status: "failed", reason: "state" };
  try {
    await deps.store.delete(key);
  } catch {
    // The record still expires; Nest state consumption guards the exchange.
  }
  let record;
  try {
    record = decryptFlow(raw, deps.encryptionKey);
  } catch {
    return { status: "failed", reason: "state" };
  }
  if (record.provider !== deps.provider || record.expiresAt <= now)
    return { status: "failed", reason: "state" };
  if (typeof input.state !== "string" || !STATE.test(input.state))
    return { status: "failed", reason: "state" };

  const denied = input.error !== undefined && input.error !== null;
  if (denied) {
    if (typeof input.error !== "string" || !input.error || input.error.length > 256)
      return { status: "failed", reason: "provider" };
  } else if (
    typeof input.code !== "string" ||
    !input.code ||
    input.code.length > 4096
  )
    return { status: "failed", reason: "provider" };

  const body: Record<string, string> = denied
    ? { error: input.error as string, state: input.state, flowVerifier: record.flowVerifier }
    : { code: input.code as string, state: input.state, flowVerifier: record.flowVerifier };

  let response: Response;
  try {
    response = await postJson(deps, `/auth/${deps.provider}/callback`, body);
  } catch {
    return { status: "failed", reason: "unavailable" };
  }
  if (!response.ok)
    return {
      status: "failed",
      reason: denied ? "denied" : nestOAuthFailure(response.status),
    };
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return { status: "failed", reason: "unexpected" };
  }
  if (typeof payload !== "object" || payload === null || Array.isArray(payload))
    return { status: "failed", reason: "unexpected" };
  const { accessToken, refreshToken, user } = payload as Record<string, unknown>;
  const parsedUser = parseAuthenticatedUser(user);
  if (
    typeof accessToken !== "string" ||
    !accessToken ||
    typeof refreshToken !== "string" ||
    !refreshToken ||
    !parsedUser
  )
    return { status: "failed", reason: "unexpected" };
  return {
    status: "success",
    tokens: { accessToken, refreshToken },
    user: parsedUser,
  };
}

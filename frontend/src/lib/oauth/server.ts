import "server-only";
import {
  loadCookiePolicy,
  loadSessionConfig,
} from "../session/config.ts";
import { parseEncryptionKey } from "../session/crypto.ts";
import { UpstashSessionStore } from "../session/store.ts";
import {
  beginOAuthFlow,
  completeOAuthFlow,
  type BeginOAuthResult,
  type CompleteOAuthResult,
} from "./nest-oauth.ts";
import {
  FLOW_TTL_SECONDS,
  flowCookieName,
  isOAuthProvider,
  type OAuthProvider,
} from "./flow.ts";

export type OAuthCookie = {
  name: string;
  value: string;
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
  maxAge: number;
};

function deps(provider: OAuthProvider) {
  const config = loadSessionConfig();
  return {
    provider,
    apiBaseUrl: config.apiBaseUrl,
    fetchImpl: (input: string | URL, init?: RequestInit) => fetch(input, init),
    store: new UpstashSessionStore({
      url: config.redisUrl,
      token: config.redisToken,
    }),
    encryptionKey: parseEncryptionKey(config.encryptionKey),
    allowTestHost: process.env.AUTH_TEST_MODE === "1",
  } as const;
}

export async function beginOAuth(
  provider: string,
): Promise<BeginOAuthResult> {
  if (!isOAuthProvider(provider))
    return { status: "failed", reason: "unexpected" };
  try {
    return await beginOAuthFlow(deps(provider));
  } catch {
    return { status: "failed", reason: "unavailable" };
  }
}

export async function completeOAuth(
  provider: string,
  input: { flowId: unknown; state: unknown; code: unknown; error: unknown },
): Promise<CompleteOAuthResult> {
  if (!isOAuthProvider(provider))
    return { status: "failed", reason: "unexpected" };
  try {
    return await completeOAuthFlow(deps(provider), input);
  } catch {
    return { status: "failed", reason: "unavailable" };
  }
}

/** Opaque single-use flow ID; the verifier itself never reaches the browser. */
export function oauthFlowCookie(flowId: string): OAuthCookie {
  const { secureCookies } = loadCookiePolicy();
  return {
    name: flowCookieName(secureCookies),
    value: flowId,
    httpOnly: true,
    secure: secureCookies,
    sameSite: "lax",
    path: "/",
    maxAge: FLOW_TTL_SECONDS,
  };
}

export function clearedOAuthFlowCookie(): OAuthCookie {
  return { ...oauthFlowCookie(""), maxAge: 0 };
}

export function oauthFlowCookieName(): string {
  return flowCookieName(loadCookiePolicy().secureCookies);
}

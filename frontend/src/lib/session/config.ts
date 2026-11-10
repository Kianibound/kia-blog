import { SessionConfigError } from "./errors.ts";

export type SessionConfig = {
  redisUrl: string;
  redisToken: string;
  encryptionKey: string;
  appOrigin: string;
  apiBaseUrl: string;
  secureCookies: boolean;
  cookieName: string;
};

function required(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name]?.trim();
  if (!value) throw new SessionConfigError(`Missing session configuration: ${name}`);
  return value;
}

function httpOrigin(env: NodeJS.ProcessEnv, name: string): string {
  const value = required(env, name);
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new SessionConfigError(`Invalid session configuration: ${name}`);
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new SessionConfigError(`Invalid session configuration: ${name}`);
  return url.origin;
}

export type CookiePolicy = {
  secureCookies: boolean;
  cookieName: string;
};

/** Cookie naming/security can be resolved without Redis or encryption secrets. */
export function loadCookiePolicy(
  env: NodeJS.ProcessEnv = process.env,
): CookiePolicy {
  const secureCookies = env.NODE_ENV === "production";
  return {
    secureCookies,
    // __Host- requires Secure, Path=/ and no Domain; only usable over HTTPS.
    cookieName: secureCookies ? "__Host-kia_session" : "kia_session",
  };
}

export function loadAppOrigin(env: NodeJS.ProcessEnv = process.env): string {
  return httpOrigin(env, "APP_ORIGIN");
}

export function loadApiBaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  return httpOrigin(env, "API_BASE_URL");
}

/** Validated lazily; a missing secret fails closed instead of degrading. */
export function loadSessionConfig(
  env: NodeJS.ProcessEnv = process.env,
): SessionConfig {
  const redisUrl = required(env, "UPSTASH_REDIS_REST_URL");
  let parsedRedis: URL;
  try {
    parsedRedis = new URL(redisUrl);
  } catch {
    throw new SessionConfigError(
      "Invalid session configuration: UPSTASH_REDIS_REST_URL",
    );
  }
  if (
    parsedRedis.protocol !== "https:" ||
    parsedRedis.username ||
    parsedRedis.password
  )
    throw new SessionConfigError(
      "Invalid session configuration: UPSTASH_REDIS_REST_URL",
    );

  const cookie = loadCookiePolicy(env);
  return {
    redisUrl,
    redisToken: required(env, "UPSTASH_REDIS_REST_TOKEN"),
    encryptionKey: required(env, "SESSION_ENCRYPTION_KEY"),
    appOrigin: loadAppOrigin(env),
    apiBaseUrl: loadApiBaseUrl(env),
    ...cookie,
  };
}

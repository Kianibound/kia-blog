import assert from "node:assert/strict";
import test from "node:test";
import {
  createSessionId,
  decryptSession,
  decodeJwtExpiry,
  encryptSession,
  hashSessionId,
  isSessionId,
  parseEncryptionKey,
  timingSafeTextEqual,
} from "../src/lib/session/crypto.ts";
import { loadSessionConfig } from "../src/lib/session/config.ts";
import {
  clearedSessionCookieOptions,
  serializeSessionCookie,
  sessionCookieOptions,
} from "../src/lib/session/cookie.ts";
import {
  assertCsrfToken,
  assertSameOrigin,
  assertSafeMutation,
  safeRedirectPath,
} from "../src/lib/session/csrf.ts";
import { SessionService } from "../src/lib/session/service.ts";
import { UpstashSessionStore } from "../src/lib/session/store.ts";
import { handleMutationRequest } from "../src/lib/session/mutation-handler.ts";
import {
  CsrfError,
  SessionStoreUnavailableError,
  UnauthenticatedError,
} from "../src/lib/session/errors.ts";

const KEY = Buffer.alloc(32, 7);
const NOW = 1_700_000_000;

function jwt(exp) {
  const payload = Buffer.from(JSON.stringify({ exp }), "utf8").toString("base64url");
  return `header.${payload}.signature`;
}

class FakeStore {
  constructor() {
    this.values = new Map();
    this.ttls = new Map();
    this.deleted = [];
    this.setIfPresentCalls = 0;
    this.failSetIfPresent = false;
    this.forceSetIfPresentFalse = false;
    this.failDelete = false;
  }
  async get(key) {
    return this.values.get(key) ?? null;
  }
  async set(key, value, ttl) {
    this.values.set(key, value);
    this.ttls.set(key, ttl);
  }
  async setIfAbsent(key, value, ttl) {
    if (this.values.has(key)) return false;
    this.values.set(key, value);
    this.ttls.set(key, ttl);
    return true;
  }
  async setIfPresent(key, value, ttl) {
    this.setIfPresentCalls += 1;
    if (this.failSetIfPresent) throw new SessionStoreUnavailableError();
    if (this.forceSetIfPresentFalse) return false;
    if (!this.values.has(key)) return false;
    this.values.set(key, value);
    this.ttls.set(key, ttl);
    return true;
  }
  async delete(key) {
    if (this.failDelete) throw new SessionStoreUnavailableError();
    this.deleted.push(key);
    this.values.delete(key);
    this.ttls.delete(key);
  }
}

function serviceWith(store, fetchImpl = async () => new Response(null, { status: 204 }), now = () => NOW) {
  return new SessionService({
    store,
    encryptionKey: KEY,
    apiBaseUrl: "https://api.test",
    appOrigin: "https://app.test",
    fetchImpl,
    now,
  });
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

test("session identifiers are random and only their hash is stored", async () => {
  const first = createSessionId();
  const second = createSessionId();
  assert.ok(isSessionId(first));
  assert.notEqual(first, second);
  assert.ok(/^[a-f0-9]{64}$/.test(hashSessionId(first)));
  assert.notEqual(hashSessionId(first), first);
  assert.equal(isSessionId("short"), false);
  assert.equal(isSessionId("../escape"), false);
});

test("tokens are encrypted at rest with authenticated encryption", () => {
  const record = {
    accessToken: "access-secret",
    refreshToken: "refresh-secret",
    csrfToken: "csrf-secret",
    accessExpiresAt: NOW + 60,
    refreshExpiresAt: NOW + 600,
  };
  const encrypted = encryptSession(record, KEY);
  assert.ok(!encrypted.includes("access-secret"));
  assert.ok(!encrypted.includes("refresh-secret"));
  assert.deepEqual(decryptSession(encrypted, KEY), record);

  const tampered = `${encrypted.slice(0, -2)}aa`;
  assert.throws(() => decryptSession(tampered, KEY));
  assert.throws(() => decryptSession(encrypted, Buffer.alloc(32, 9)));
  assert.throws(() =>
    encryptSession({ ...record, accessToken: "" }, KEY),
  );
});

test("timing-safe comparison and JWT expiry decoding", () => {
  assert.equal(timingSafeTextEqual("abc", "abc"), true);
  assert.equal(timingSafeTextEqual("abc", "abd"), false);
  assert.equal(timingSafeTextEqual("abc", "abcd"), false);
  assert.equal(decodeJwtExpiry(jwt(NOW + 10)), NOW + 10);
  assert.equal(decodeJwtExpiry("not-a-jwt"), null);
  assert.equal(decodeJwtExpiry("a.!!!.c"), null);
});

test("configuration fails closed and selects a production-safe cookie", () => {
  const base = {
    UPSTASH_REDIS_REST_URL: "https://redis.example.test",
    UPSTASH_REDIS_REST_TOKEN: "token",
    SESSION_ENCRYPTION_KEY: KEY.toString("base64url"),
    APP_ORIGIN: "https://kia.example.test",
    API_BASE_URL: "https://api.example.test",
  };
  for (const name of Object.keys(base)) {
    const missing = { ...base };
    delete missing[name];
    assert.throws(() => loadSessionConfig(missing), /Missing session configuration/);
  }
  const dev = loadSessionConfig({ ...base, NODE_ENV: "development" });
  assert.equal(dev.cookieName, "kia_session");
  assert.equal(dev.secureCookies, false);
  const prod = loadSessionConfig({ ...base, NODE_ENV: "production" });
  assert.equal(prod.cookieName, "__Host-kia_session");
  assert.equal(prod.secureCookies, true);

  assert.throws(() =>
    loadSessionConfig({ ...base, APP_ORIGIN: "https://kia.example.test/login" }),
  );
  assert.throws(() =>
    loadSessionConfig({ ...base, APP_ORIGIN: "javascript:alert(1)" }),
  );
  assert.throws(() =>
    loadSessionConfig({ ...base, UPSTASH_REDIS_REST_URL: "http://redis.test" }),
  );
  assert.throws(() => parseEncryptionKey("too-short"));
  assert.equal(parseEncryptionKey(KEY.toString("hex")).length, 32);
});

test("cookies are HttpOnly, SameSite=Lax and Secure in production only", () => {
  const id = createSessionId();
  const dev = serializeSessionCookie(
    sessionCookieOptions("kia_session", id, 600, false),
  );
  assert.match(dev, /HttpOnly/);
  assert.match(dev, /SameSite=Lax/);
  assert.match(dev, /Path=\//);
  assert.match(dev, /Max-Age=600/);
  assert.doesNotMatch(dev, /Secure/);

  const prod = serializeSessionCookie(
    sessionCookieOptions("__Host-kia_session", id, 600, true),
  );
  assert.match(prod, /Secure/);
  assert.match(prod, /^__Host-kia_session=/);

  const cleared = serializeSessionCookie(
    clearedSessionCookieOptions("__Host-kia_session", true),
  );
  assert.match(cleared, /Max-Age=0/);
  assert.throws(() => sessionCookieOptions("kia_session", "bad id", 600, false));
  assert.throws(() => sessionCookieOptions("bad name", id, 600, false));
});

test("session creation stores only the hashed key and honours token expiry", async () => {
  const store = new FakeStore();
  const service = serviceWith(store);
  const accessToken = jwt(NOW + 900);
  const refreshToken = jwt(NOW + 7200);
  const created = await service.createSession({ accessToken, refreshToken });

  const key = [...store.values.keys()][0];
  assert.equal(key, `session:${hashSessionId(created.sessionId)}`);
  assert.equal(store.ttls.get(key), 7200);
  assert.ok(!store.values.get(key).includes(accessToken));
  assert.ok(!store.values.get(key).includes(refreshToken));

  const loaded = await service.loadSession(created.sessionId);
  assert.equal(loaded.accessToken, accessToken);
  assert.equal(loaded.csrfToken, created.csrfToken);
  assert.equal(await service.getCsrfToken(created.sessionId), created.csrfToken);
  assert.equal(await service.loadSession("not-a-session"), null);
  assert.equal(await service.loadSession(createSessionId()), null);
});

test("expired and corrupt records are removed instead of being trusted", async () => {
  const store = new FakeStore();
  const service = serviceWith(store);
  const created = await service.createSession({
    accessToken: jwt(NOW + 10),
    refreshToken: jwt(NOW + 20),
  });
  const key = `session:${hashSessionId(created.sessionId)}`;

  store.values.set(key, "not-decryptable");
  assert.equal(await service.loadSession(created.sessionId), null);
  assert.equal(store.values.has(key), false);

  const expired = await service.createSession({
    accessToken: jwt(NOW + 10),
    refreshToken: jwt(NOW + 20),
  });
  const laterService = serviceWith(store, undefined, () => NOW + 30);
  assert.equal(await laterService.loadSession(expired.sessionId), null);
  assert.equal(store.values.size, 0);
});

test("getAccessToken refreshes once near expiry using Nest's existing contract", async () => {
  const store = new FakeStore();
  const calls = [];
  const service = serviceWith(store, async (url, init) => {
    calls.push({ url, body: JSON.parse(init.body) });
    return jsonResponse({ accessToken: jwt(NOW + 900) });
  });
  const refreshToken = jwt(NOW + 7200);
  const created = await service.createSession({
    accessToken: jwt(NOW + 10),
    refreshToken,
  });

  const token = await service.getAccessToken(created.sessionId);
  assert.equal(token, jwt(NOW + 900));
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://api.test/auth/refresh");
  assert.deepEqual(calls[0].body, { refreshToken });

  const stored = await service.loadSession(created.sessionId);
  assert.equal(stored.accessToken, token);
  assert.equal(stored.refreshToken, refreshToken);
});

test("concurrent refreshes in one instance share a single request", async () => {
  const store = new FakeStore();
  let calls = 0;
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const service = serviceWith(store, async () => {
    calls += 1;
    await gate;
    return jsonResponse({ accessToken: jwt(NOW + 900) });
  });
  const created = await service.createSession({
    accessToken: jwt(NOW + 5),
    refreshToken: jwt(NOW + 7200),
  });

  const pending = Promise.all([
    service.getAccessToken(created.sessionId),
    service.getAccessToken(created.sessionId),
  ]);
  release();
  const [a, b] = await pending;
  assert.equal(a, b);
  assert.equal(calls, 1);
});

test("authedFetch attaches a Bearer token and retries once after a 401", async () => {
  const store = new FakeStore();
  const seen = [];
  let postRefresh = false;
  const service = serviceWith(store, async (url, init) => {
    if (url.endsWith("/auth/refresh")) {
      postRefresh = true;
      return jsonResponse({ accessToken: jwt(NOW + 900) });
    }
    seen.push(new Headers(init.headers).get("Authorization"));
    return postRefresh
      ? jsonResponse({ ok: true })
      : jsonResponse({ message: "expired" }, 401);
  });
  const created = await service.createSession({
    accessToken: jwt(NOW + 900),
    refreshToken: jwt(NOW + 7200),
  });

  const response = await service.authedFetch(created.sessionId, "/auth/me");
  assert.equal(response.status, 200);
  assert.equal(seen.length, 2);
  assert.equal(seen[0], `Bearer ${jwt(NOW + 900)}`);
  assert.equal(seen[1], `Bearer ${jwt(NOW + 900)}`);
  assert.equal(postRefresh, true);
});

test("rejected refresh and revoked access invalidate the browser session", async () => {
  const store = new FakeStore();
  const service = serviceWith(store, async (url, init) => {
    if (url.endsWith("/auth/refresh"))
      return jsonResponse({ message: "revoked" }, 401);
    const auth = new Headers(init.headers).get("Authorization");
    return auth ? jsonResponse({}, 401) : jsonResponse({}, 200);
  });
  const created = await service.createSession({
    accessToken: jwt(NOW + 900),
    refreshToken: jwt(NOW + 7200),
  });
  await assert.rejects(
    () => service.authedFetch(created.sessionId, "/auth/me"),
    UnauthenticatedError,
  );
  assert.equal(store.values.size, 0);
  assert.equal(await service.loadSession(created.sessionId), null);
});

test("authedFetch rejects unsafe methods so mutations cannot bypass the guard", async () => {
  const store = new FakeStore();
  let calls = 0;
  const service = serviceWith(store, async () => {
    calls += 1;
    return jsonResponse({});
  });
  const created = await service.createSession({
    accessToken: jwt(NOW + 900),
    refreshToken: jwt(NOW + 7200),
  });

  await assert.rejects(
    () => service.authedFetch(created.sessionId, "/posts", { method: "POST" }),
    CsrfError,
  );
  assert.equal(calls, 0);
});

test("authorizedMutation requires both trusted Origin and CSRF token", async () => {
  const store = new FakeStore();
  const seen = [];
  const service = serviceWith(store, async (url, init) => {
    seen.push({
      url,
      body: init.body,
      authorization: new Headers(init.headers).get("Authorization"),
    });
    return jsonResponse({ ok: true });
  });
  const created = await service.createSession({
    accessToken: jwt(NOW + 900),
    refreshToken: jwt(NOW + 7200),
  });

  await assert.rejects(
    () =>
      service.authorizedMutation(created.sessionId, "/posts", {
        method: "POST",
        body: "{}",
        csrfToken: created.csrfToken,
      }),
    CsrfError,
  );
  await assert.rejects(
    () =>
      service.authorizedMutation(created.sessionId, "/posts", {
        method: "POST",
        body: "{}",
        origin: "https://evil.test",
        csrfToken: created.csrfToken,
      }),
    CsrfError,
  );
  await assert.rejects(
    () =>
      service.authorizedMutation(created.sessionId, "/posts", {
        method: "POST",
        body: "{}",
        origin: "https://app.test",
      }),
    CsrfError,
  );
  await assert.rejects(
    () =>
      service.authorizedMutation(created.sessionId, "/posts", {
        method: "POST",
        body: "{}",
        origin: "https://app.test",
        csrfToken: "wrong",
      }),
    CsrfError,
  );
  await assert.rejects(
    () =>
      service.authorizedMutation(created.sessionId, "/posts", {
        method: "GET",
        origin: "https://app.test",
        csrfToken: created.csrfToken,
      }),
    CsrfError,
  );
  assert.equal(seen.length, 0);

  const ok = await service.authorizedMutation(created.sessionId, "/posts", {
    method: "POST",
    body: "{}",
    origin: "https://app.test",
    csrfToken: created.csrfToken,
  });
  assert.equal(ok.status, 200);
  assert.equal(seen.length, 1);
  assert.equal(seen[0].body, "{}");
  assert.equal(seen[0].authorization, `Bearer ${jwt(NOW + 900)}`);
});

test("logout revokes remotely even if Nest fails, and always deletes locally", async () => {
  const store = new FakeStore();
  const bodies = [];
  const service = serviceWith(store, async (url, init) => {
    bodies.push({ url, body: JSON.parse(init.body) });
    throw new Error("network down");
  });
  const refreshToken = jwt(NOW + 7200);
  const created = await service.createSession({
    accessToken: jwt(NOW + 900),
    refreshToken,
  });
  await service.logout(created.sessionId);
  assert.equal(bodies.length, 1);
  assert.equal(bodies[0].url, "https://api.test/auth/logout");
  assert.deepEqual(bodies[0].body, { refreshToken });
  assert.equal(store.values.size, 0);
});

test("refresh racing logout cannot resurrect the session", async () => {
  const store = new FakeStore();
  let startRefresh;
  let releaseRefresh;
  const refreshStarted = new Promise((resolve) => {
    startRefresh = resolve;
  });
  const refreshGate = new Promise((resolve) => {
    releaseRefresh = resolve;
  });
  const service = serviceWith(store, async (url) => {
    if (url.endsWith("/auth/refresh")) {
      startRefresh();
      await refreshGate;
      return jsonResponse({ accessToken: jwt(NOW + 900) });
    }
    return new Response(null, { status: 204 });
  });
  const created = await service.createSession({
    accessToken: jwt(NOW + 5),
    refreshToken: jwt(NOW + 7200),
  });

  const pending = service.getAccessToken(created.sessionId);
  await refreshStarted;
  await service.logout(created.sessionId);
  releaseRefresh();

  await assert.rejects(() => pending, UnauthenticatedError);
  assert.equal(store.values.size, 0);
  assert.equal(await service.loadSession(created.sessionId), null);
});

test("refresh racing explicit invalidation cannot resurrect the session", async () => {
  const store = new FakeStore();
  let startRefresh;
  let releaseRefresh;
  const refreshStarted = new Promise((resolve) => {
    startRefresh = resolve;
  });
  const refreshGate = new Promise((resolve) => {
    releaseRefresh = resolve;
  });
  const service = serviceWith(store, async () => {
    startRefresh();
    await refreshGate;
    return jsonResponse({ accessToken: jwt(NOW + 900) });
  });
  const created = await service.createSession({
    accessToken: jwt(NOW + 5),
    refreshToken: jwt(NOW + 7200),
  });

  const pending = service.getAccessToken(created.sessionId);
  await refreshStarted;
  await service.invalidate(created.sessionId);
  releaseRefresh();

  await assert.rejects(() => pending, UnauthenticatedError);
  assert.equal(store.values.size, 0);
});

test("a failed conditional write terminates refresh without recreating the session", async () => {
  const store = new FakeStore();
  const service = serviceWith(store, async () =>
    jsonResponse({ accessToken: jwt(NOW + 900) }),
  );
  const created = await service.createSession({
    accessToken: jwt(NOW + 5),
    refreshToken: jwt(NOW + 7200),
  });
  const key = `session:${hashSessionId(created.sessionId)}`;
  const before = store.values.get(key);

  store.forceSetIfPresentFalse = true;
  await assert.rejects(
    () => service.getAccessToken(created.sessionId),
    UnauthenticatedError,
  );
  assert.equal(store.values.get(key), before);
  assert.equal(store.setIfPresentCalls, 1);
});

test("Redis failure during refresh propagates and preserves the old record", async () => {
  const store = new FakeStore();
  const service = serviceWith(store, async () =>
    jsonResponse({ accessToken: jwt(NOW + 900) }),
  );
  const created = await service.createSession({
    accessToken: jwt(NOW + 5),
    refreshToken: jwt(NOW + 7200),
  });
  const key = `session:${hashSessionId(created.sessionId)}`;
  const before = store.values.get(key);

  store.failSetIfPresent = true;
  await assert.rejects(
    () => service.getAccessToken(created.sessionId),
    SessionStoreUnavailableError,
  );
  assert.equal(store.values.get(key), before);
});

test("refresh preserves the absolute expiry deadline without extending TTL", async () => {
  const store = new FakeStore();
  let current = NOW;
  const service = serviceWith(
    store,
    async () => jsonResponse({ accessToken: jwt(NOW + 900) }),
    () => current,
  );
  const created = await service.createSession({
    accessToken: jwt(NOW + 5),
    refreshToken: jwt(NOW + 7200),
  });
  const key = `session:${hashSessionId(created.sessionId)}`;
  assert.equal(store.ttls.get(key), 7200);

  current += 1000;
  await service.getAccessToken(created.sessionId);
  assert.equal(store.ttls.get(key), 6200);
  const stored = await service.loadSession(created.sessionId);
  assert.equal(stored.refreshExpiresAt, NOW + 7200);
});

test("logout fails closed when Redis cannot delete the session", async () => {
  const store = new FakeStore();
  const service = serviceWith(store, async () => new Response(null, { status: 204 }));
  const created = await service.createSession({
    accessToken: jwt(NOW + 900),
    refreshToken: jwt(NOW + 7200),
  });

  store.failDelete = true;
  await assert.rejects(
    () => service.logout(created.sessionId),
    SessionStoreUnavailableError,
  );
  assert.equal(store.values.size, 1);
});

test("shared mutation handler enforces Origin and CSRF before any work", async () => {
  const store = new FakeStore();
  const service = serviceWith(store, async () => jsonResponse({ ok: true }));
  const created = await service.createSession({
    accessToken: jwt(NOW + 900),
    refreshToken: jwt(NOW + 7200),
  });
  let performed = 0;
  let cleared = 0;
  const deps = {
    expectedOrigin: "https://app.test",
    readSessionId: async () => created.sessionId,
    service,
    clearCookie: async () => {
      cleared += 1;
    },
  };
  const request = (method, origin, csrfToken) => ({
    method,
    headers: {
      get(name) {
        if (name.toLowerCase() === "origin") return origin;
        if (name.toLowerCase() === "x-csrf-token") return csrfToken;
        return null;
      },
    },
  });
  const work = async () => {
    performed += 1;
    return new Response(null, { status: 204 });
  };

  for (const [method, origin, csrfToken] of [
    ["GET", "https://app.test", created.csrfToken],
    ["POST", null, created.csrfToken],
    ["POST", "https://evil.test", created.csrfToken],
    ["POST", "https://app.test", null],
    ["POST", "https://app.test", "wrong"],
  ]) {
    await assert.rejects(
      () => handleMutationRequest(request(method, origin, csrfToken), deps, work),
      CsrfError,
    );
  }
  assert.equal(performed, 0);
  assert.equal(cleared, 0);

  const response = await handleMutationRequest(
    request("POST", "https://app.test", created.csrfToken),
    deps,
    ({ sessionId, mutate }) => {
      performed += 1;
      assert.equal(sessionId, created.sessionId);
      return mutate("/posts", { method: "POST", body: "{}" });
    },
  );
  assert.equal(response.status, 200);
  assert.equal(performed, 1);
});

test("terminal authentication failure clears the browser cookie", async () => {
  const store = new FakeStore();
  const service = serviceWith(store, async () => jsonResponse({}));
  const created = await service.createSession({
    accessToken: jwt(NOW + 900),
    refreshToken: jwt(NOW + 7200),
  });
  let cleared = 0;
  const deps = {
    expectedOrigin: "https://app.test",
    readSessionId: async () => created.sessionId,
    service,
    clearCookie: async () => {
      cleared += 1;
    },
  };
  const request = {
    method: "POST",
    headers: {
      get: (name) =>
        name.toLowerCase() === "origin"
          ? "https://app.test"
          : name.toLowerCase() === "x-csrf-token"
            ? created.csrfToken
            : null,
    },
  };

  await assert.rejects(
    () =>
      handleMutationRequest(request, deps, async () => {
        throw new UnauthenticatedError();
      }),
    UnauthenticatedError,
  );
  assert.equal(cleared, 1);

  await service.invalidate(created.sessionId);
  await assert.rejects(
    () => handleMutationRequest(request, deps, async () => new Response()),
    UnauthenticatedError,
  );
  assert.equal(cleared, 2);
});

test("CSRF origin checks fail closed and safe redirects stay same-origin", () => {
  assert.throws(() => assertSameOrigin(undefined, "https://kia.test"), CsrfError);
  assert.throws(() => assertSameOrigin("https://evil.test", "https://kia.test"), CsrfError);
  assert.throws(
    () => assertSafeMutation("POST", null, "https://kia.test"),
    CsrfError,
  );
  assert.doesNotThrow(() =>
    assertSafeMutation("POST", "https://kia.test", "https://kia.test"),
  );
  assert.doesNotThrow(() =>
    assertSafeMutation("GET", "https://evil.test", "https://kia.test"),
  );
  assert.throws(() => assertCsrfToken("expected", "provided"), CsrfError);
  assert.doesNotThrow(() => assertCsrfToken("same", "same"));

  assert.equal(safeRedirectPath("/dashboard"), "/dashboard");
  assert.equal(safeRedirectPath("/posts?page=2"), "/posts?page=2");
  for (const unsafe of [
    "https://evil.test",
    "//evil.test",
    "/\\evil.test",
    "/%2f%2fevil.test",
    "/%5cevil.test",
    "/%0d%0aLocation:%20https://evil.test",
    "\r\n/evil",
    null,
    undefined,
  ]) {
    assert.equal(safeRedirectPath(unsafe), "/");
  }
  assert.equal(safeRedirectPath("bad", "/dashboard"), "/dashboard");
});

test("Upstash store issues atomic command shapes and never leaks credentials", async () => {
  const calls = [];
  const store = new UpstashSessionStore({
    url: "https://redis.example.test",
    token: "super-secret-token",
    fetchImpl: async (url, init) => {
      calls.push({ url, auth: init.headers.Authorization, body: JSON.parse(init.body) });
      return jsonResponse({ result: "OK" });
    },
  });
  await store.set("session:key", "ciphertext", 120.2);
  assert.deepEqual(calls[0].body, ["SET", "session:key", "ciphertext", "EX", 121]);
  await store.setIfAbsent("session:key", "value", 60);
  assert.deepEqual(calls[1].body, ["SET", "session:key", "value", "EX", 60, "NX"]);
  await store.setIfPresent("session:key", "next", 30);
  assert.deepEqual(calls[2].body, ["SET", "session:key", "next", "EX", 30, "XX"]);
  await store.delete("session:key");
  assert.deepEqual(calls[3].body, ["DEL", "session:key"]);
  assert.equal(calls[0].auth, "Bearer super-secret-token");

  const failing = new UpstashSessionStore({
    url: "https://redis.example.test",
    token: "super-secret-token",
    fetchImpl: async () => jsonResponse({ error: "boom" }, 500),
  });
  await assert.rejects(
    () => failing.get("session:key"),
    (error) => {
      assert.ok(error instanceof SessionStoreUnavailableError);
      assert.ok(!String(error.message).includes("super-secret-token"));
      return true;
    },
  );
});

test("API paths are constrained to the configured Nest origin", () => {
  const service = serviceWith(new FakeStore());
  assert.equal(service.apiUrl("/auth/me"), "https://api.test/auth/me");
  for (const path of ["//evil.test/auth", "https://evil.test/auth", "auth/me", "/\\evil"]) {
    assert.throws(() => service.apiUrl(path), /Invalid API path/);
  }
});

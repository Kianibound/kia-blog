import assert from "node:assert/strict";
import test from "node:test";
import {
  AuthRequestError,
  loginWithNest,
  parseAuthenticatedUser,
  registerWithNest,
} from "../src/lib/auth/nest-auth.ts";
import {
  createAuthCsrfToken,
  loadAuthCsrfSecret,
  verifyAuthCsrfToken,
} from "../src/lib/auth/csrf-token.ts";
import {
  authFailureMessage,
  validateEmailValue,
} from "../src/lib/auth/form-state.ts";
import {
  assertTrustedMutation,
} from "../src/lib/auth/action-guard.ts";
import {
  executeLogin,
  executeRegister,
} from "../src/lib/auth/action-flow.ts";
import { SessionService } from "../src/lib/session/service.ts";
import {
  clearedSessionCookieOptions,
  serializeSessionCookie,
  sessionCookieOptions,
} from "../src/lib/session/cookie.ts";
import { CsrfError } from "../src/lib/session/errors.ts";

const USER = {
  id: "user-1",
  email: "user@example.test",
  username: "user_hash",
  name: "کاربر",
  role: { name: "USER" },
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function client(fetchImpl) {
  return { apiBaseUrl: "https://api.test", fetchImpl };
}

test("login parses the server-provided identity and sends no role", async () => {
  let request;
  const result = await loginWithNest(
    { email: "user@example.test", password: "Secret1!" },
    client(async (url, init) => {
      request = { url, body: JSON.parse(init.body) };
      return jsonResponse({
        accessToken: "access-token",
        refreshToken: "refresh-token",
        user: { ...USER, role: { name: "ADMIN" } },
      });
    }),
  );

  assert.equal(String(request.url), "https://api.test/auth/login");
  assert.deepEqual(request.body, {
    email: "user@example.test",
    password: "Secret1!",
  });
  assert.equal(result.user.role, "ADMIN");
  assert.equal(result.accessToken, "access-token");
});

test("registration sends USER-only fields and rejects a non-USER response", async () => {
  let request;
  const result = await registerWithNest(
    {
      email: "new@example.test",
      password: "Secret1!",
      confirmPassword: "Secret1!",
    },
    client(async (url, init) => {
      request = { url, body: JSON.parse(init.body) };
      return jsonResponse({ message: "ok", user: USER }, 201);
    }),
  );
  assert.equal(String(request.url), "https://api.test/auth/register");
  assert.deepEqual(request.body, {
    email: "new@example.test",
    password: "Secret1!",
    confirmPassword: "Secret1!",
  });
  assert.equal("role" in request.body, false);
  assert.equal("username" in request.body, false);
  assert.equal(result.user.role, "USER");

  await assert.rejects(
    () =>
      registerWithNest(
        {
          email: "new@example.test",
          password: "Secret1!",
          confirmPassword: "Secret1!",
        },
        client(async () =>
          jsonResponse({ message: "ok", user: { ...USER, role: { name: "AUTHOR" } } }, 201),
        ),
      ),
    (error) => error instanceof AuthRequestError && error.kind === "protocol",
  );
});

test("malformed login responses never yield a usable session", async () => {
  const invalidPayloads = [
    { accessToken: "a", refreshToken: "r" },
    { accessToken: "", refreshToken: "r", user: USER },
    { accessToken: "a", refreshToken: "", user: USER },
    { accessToken: "a", refreshToken: "r", user: { ...USER, role: null } },
    { accessToken: "a", refreshToken: "r", user: { ...USER, role: { name: "SUPER" } } },
  ];
  for (const payload of invalidPayloads) {
    await assert.rejects(
      () =>
        loginWithNest(
          { email: "user@example.test", password: "Secret1!" },
          client(async () => jsonResponse(payload)),
        ),
      (error) => error instanceof AuthRequestError && error.kind === "protocol",
    );
  }
  assert.equal(parseAuthenticatedUser(null), null);
});

test("Nest failures map to safe kinds without response bodies", async () => {
  const cases = [
    [400, "validation"],
    [401, "invalid-credentials"],
    [403, "invalid-credentials"],
    [409, "duplicate-email"],
    [422, "validation"],
    [429, "rate-limit"],
    [500, "unavailable"],
    [503, "unavailable"],
    [418, "protocol"],
  ];
  for (const [status, kind] of cases) {
    await assert.rejects(
      () =>
        loginWithNest(
          { email: "user@example.test", password: "Secret1!" },
          client(async () => jsonResponse({ message: "upstream detail" }, status)),
        ),
      (error) => {
        assert.ok(error instanceof AuthRequestError);
        assert.equal(error.kind, kind);
        assert.ok(!error.message.includes("upstream detail"));
        return true;
      },
    );
  }
});

test("network and timeout failures are uncertain, never successful", async () => {
  for (const failure of [
    new TypeError("fetch failed"),
    new DOMException("timed out", "TimeoutError"),
  ]) {
    await assert.rejects(
      () =>
        loginWithNest(
          { email: "user@example.test", password: "Secret1!" },
          client(async () => {
            throw failure;
          }),
        ),
      (error) => error instanceof AuthRequestError && error.kind === "uncertain",
    );
  }
});

test("auth CSRF tokens are signed, bounded and tamper-evident", () => {
  const env = {
    SESSION_ENCRYPTION_KEY: Buffer.alloc(32, 4).toString("base64url"),
  };
  const secret = loadAuthCsrfSecret(env);
  const token = createAuthCsrfToken(secret, 1000);
  assert.equal(verifyAuthCsrfToken(secret, token, 1000), true);
  assert.equal(verifyAuthCsrfToken(secret, token, 1000 + 30 * 60), false);
  assert.equal(verifyAuthCsrfToken(secret, token, 2000), true);
  assert.equal(verifyAuthCsrfToken(secret, `${token}x`, 1000), false);
  assert.equal(verifyAuthCsrfToken(secret, token.replace(/^v1\./, "v2."), 1000), false);
  assert.equal(verifyAuthCsrfToken(secret, null, 1000), false);
  assert.throws(() => loadAuthCsrfSecret({}));
  assert.throws(() =>
    loadAuthCsrfSecret({ SESSION_ENCRYPTION_KEY: "too-short" }),
  );
});

test("Persian validation and failure messages stay safe and specific", () => {
  assert.notEqual(validateEmailValue("bad"), "");
  assert.equal(validateEmailValue("user@example.test"), "");
  assert.match(authFailureMessage("invalid-credentials", "login"), /نادرست/);
  assert.match(authFailureMessage("duplicate-email", "register"), /وجود دارد/);
  assert.match(authFailureMessage("rate-limit", "login"), /بیش از حد/);
  assert.match(authFailureMessage("uncertain", "register"), /مشخص نیست/);
  assert.match(authFailureMessage("unavailable", "login"), /در دسترس نیست/);
});

class FakeSessionStore {
  constructor() {
    this.values = new Map();
    this.ttls = new Map();
  }
  async get(key) { return this.values.get(key) ?? null; }
  async set(key, value, ttl) { this.values.set(key, value); this.ttls.set(key, ttl); }
  async setIfAbsent(key, value, ttl) {
    if (this.values.has(key)) return false;
    this.values.set(key, value);
    this.ttls.set(key, ttl);
    return true;
  }
  async setIfPresent(key, value, ttl) {
    if (!this.values.has(key)) return false;
    this.values.set(key, value);
    this.ttls.set(key, ttl);
    return true;
  }
  async delete(key) { this.values.delete(key); this.ttls.delete(key); }
}

function sessionJwt(exp) {
  return `h.${Buffer.from(JSON.stringify({ exp })).toString("base64url")}.s`;
}

function sessionService(store, now = 1000) {
  return new SessionService({
    store,
    encryptionKey: Buffer.alloc(32, 3),
    apiBaseUrl: "https://api.test",
    appOrigin: "https://app.test",
    now: () => now,
    fetchImpl: async () => new Response(null, { status: 204 }),
  });
}

test("successful login creates an isolated session, secure cookie and logout cleanup", async () => {
  const now = 1000;
  const secret = loadAuthCsrfSecret({
    SESSION_ENCRYPTION_KEY: Buffer.alloc(32, 3).toString("base64url"),
  });
  const csrfToken = createAuthCsrfToken(secret, now);
  const store = new FakeSessionStore();
  const service = sessionService(store, now);
  let cookie;
  let loginBody;
  let createdSessionId;

  const result = await executeLogin(
    {
      email: "author@example.test",
      password: "Secret1!",
      next: "/dashboard?tab=1",
      csrfToken,
      origin: "https://app.test",
      role: "ADMIN",
    },
    {
      expectedOrigin: "https://app.test",
      csrfSecret: secret,
      now,
      loginNest: async (credentials) => {
        loginBody = credentials;
        return {
          accessToken: sessionJwt(now + 900),
          refreshToken: sessionJwt(now + 7200),
          user: { ...USER, role: "AUTHOR" },
        };
      },
      createSession: async (tokens) => {
        const created = await service.createSession(tokens);
        createdSessionId = created.sessionId;
        cookie = sessionCookieOptions(
          "__Host-kia_session",
          created.sessionId,
          created.maxAge,
          true,
        );
      },
    },
  );

  assert.equal(result.status, "success");
  assert.equal(result.user.role, "AUTHOR");
  assert.equal(result.redirectTo, "/dashboard?tab=1");
  assert.deepEqual(Object.keys(loginBody).sort(), ["email", "password"]);
  assert.equal(store.values.size, 1);
  assert.ok(serializeSessionCookie(cookie).includes("Secure"));
  assert.ok(serializeSessionCookie(cookie).includes("HttpOnly"));
  assert.ok(serializeSessionCookie(cookie).includes("SameSite=Lax"));

  assert.ok(await service.loadSession(createdSessionId));
  await service.logout(createdSessionId);
  assert.equal(store.values.size, 0);
  assert.equal(await service.loadSession(createdSessionId), null);
  const cleared = serializeSessionCookie(clearedSessionCookieOptions("__Host-kia_session", true));
  assert.match(cleared, /Max-Age=0/);
});

test("session-store failure after Nest success is uncertain, never a login failure", async () => {
  const now = 1000;
  const secret = Buffer.alloc(32, 5);
  const csrfToken = createAuthCsrfToken(secret, now);
  const result = await executeLogin(
    { email: "user@example.test", password: "Secret1!", next: "/", csrfToken, origin: "https://app.test" },
    {
      expectedOrigin: "https://app.test",
      csrfSecret: secret,
      now,
      loginNest: async () => ({
        accessToken: sessionJwt(now + 900),
        refreshToken: sessionJwt(now + 7200),
        user: USER,
      }),
      createSession: async () => {
        throw new Error("store unavailable");
      },
    },
  );
  assert.equal(result.status, "error");
  assert.match(result.message, /مشخص نیست/);
});

test("login and registration reject missing, invalid, tampered and expired CSRF/origin", async () => {
  const now = 1000;
  const secret = Buffer.alloc(32, 6);
  const token = createAuthCsrfToken(secret, now);
  assert.throws(() => assertTrustedMutation({ origin: null, expectedOrigin: "https://app.test", csrfToken: token, csrfSecret: secret, now }), CsrfError);
  assert.throws(() => assertTrustedMutation({ origin: "https://evil.test", expectedOrigin: "https://app.test", csrfToken: token, csrfSecret: secret, now }), CsrfError);
  assert.throws(() => assertTrustedMutation({ origin: "https://app.test", expectedOrigin: "https://app.test", csrfToken: null, csrfSecret: secret, now }), CsrfError);
  assert.throws(() => assertTrustedMutation({ origin: "https://app.test", expectedOrigin: "https://app.test", csrfToken: `${token}x`, csrfSecret: secret, now }), CsrfError);
  assert.throws(() => assertTrustedMutation({ origin: "https://app.test", expectedOrigin: "https://app.test", csrfToken: token, csrfSecret: secret, now: now + 30 * 60 }), CsrfError);
  assert.doesNotThrow(() => assertTrustedMutation({ origin: "https://app.test", expectedOrigin: "https://app.test", csrfToken: token, csrfSecret: secret, now }));

  const deps = {
    expectedOrigin: "https://app.test",
    csrfSecret: secret,
    now,
    loginNest: async () => ({ accessToken: sessionJwt(1), refreshToken: sessionJwt(2), user: USER }),
    createSession: async () => undefined,
  };
  for (const input of [
    { origin: null, csrfToken: token },
    { origin: "https://evil.test", csrfToken: token },
    { origin: "https://app.test", csrfToken: `${token}x` },
    { origin: "https://app.test", csrfToken: token, password: "" },
  ]) {
    const result = await executeLogin(
      { email: "user@example.test", password: "Secret1!", next: "/", ...input },
      deps,
    );
    assert.equal(result.status, "error");
  }

  const forged = await executeRegister(
    { email: "new@example.test", password: "Secret1!", confirmPassword: "Secret1!", csrfToken: token, origin: "https://app.test", role: "ADMIN" },
    {
      expectedOrigin: "https://app.test",
      csrfSecret: secret,
      now,
      registerNest: async () => ({ user: { ...USER, role: { name: "AUTHOR" } } }),
    },
  );
  assert.equal(forged.status, "error");
  assert.match(forged.message, /نامعتبر/);
});

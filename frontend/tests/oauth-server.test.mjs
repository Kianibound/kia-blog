import assert from "node:assert/strict";
import test from "node:test";
import {
  encryptFlow,
  flowStoreKey,
} from "../src/lib/oauth/flow.ts";
import {
  beginOAuthFlow,
  completeOAuthFlow,
} from "../src/lib/oauth/nest-oauth.ts";

const key = Buffer.alloc(32, 3);
const verifier = "B".repeat(43);
const state = "C".repeat(43);
const flowId = "D".repeat(43);
const user = {
  id: "u-1",
  email: "reader@example.test",
  username: "reader",
  name: null,
  role: { name: "USER" },
};

function response(status, body) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function memoryStore(initial = new Map()) {
  const values = initial;
  return {
    values,
    async get(k) {
      return values.get(k) ?? null;
    },
    async set(k, v) {
      values.set(k, v);
    },
    async delete(k) {
      values.delete(k);
    },
  };
}

function deps(overrides = {}) {
  return {
    provider: "google",
    apiBaseUrl: "https://api.example.test/",
    store: memoryStore(),
    encryptionKey: key,
    fetchImpl: async () => response(500),
    now: 1_000_000,
    ...overrides,
  };
}

function seeded(record = { provider: "google", flowVerifier: verifier, expiresAt: 1_100_000 }) {
  const store = memoryStore(
    new Map([[flowStoreKey(flowId), encryptFlow(record, key)]]),
  );
  return store;
}

test("begin stores an encrypted verifier and never returns it to the browser", async () => {
  const store = memoryStore();
  let seen;
  const result = await beginOAuthFlow(
    deps({
      store,
      fetchImpl: async (url, init) => {
        seen = { url: String(url), init };
        return response(200, {
          authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth?state=x",
          flowVerifier: verifier,
          expiresIn: 600,
        });
      },
    }),
  );
  assert.equal(result.status, "ok");
  assert.equal(result.flowId.length, 43);
  assert.ok(!String(seen.url).includes(result.flowId));
  const stored = [...store.values.values()];
  assert.equal(stored.length, 1);
  assert.ok(!stored[0].includes(verifier));
});

test("begin fails closed on configuration, transport and untrusted redirects", async () => {
  assert.equal(
    (await beginOAuthFlow(deps({ fetchImpl: async () => response(503, {}) }))).status,
    "failed",
  );
  assert.equal(
    (await beginOAuthFlow(deps({ fetchImpl: async () => { throw new Error("down"); } }))).reason,
    "unavailable",
  );
  assert.deepEqual(
    await beginOAuthFlow(
      deps({
        fetchImpl: async () =>
          response(200, {
            authorizationUrl: "https://evil.test/auth",
            flowVerifier: verifier,
            expiresIn: 600,
          }),
      }),
    ),
    { status: "failed", reason: "unexpected" },
  );
});

test("complete exchanges the code with the private verifier and returns tokens only to the server", async () => {
  const store = seeded();
  let body;
  const result = await completeOAuthFlow(
    deps({
      store,
      fetchImpl: async (url, init) => {
        assert.equal(String(url), "https://api.example.test/auth/google/callback");
        body = JSON.parse(init.body);
        return response(200, {
          accessToken: "access-token",
          refreshToken: "refresh-token",
          user,
        });
      },
    }),
    { flowId, state, code: "code-1", error: null },
  );
  assert.deepEqual(body, { code: "code-1", state, flowVerifier: verifier });
  assert.equal(result.status, "success");
  assert.equal(result.tokens.accessToken, "access-token");
  assert.equal(JSON.stringify(result).includes("evil"), false);
  assert.equal(store.values.size, 0);
});

test("the flow is single-use: a replayed callback cannot reuse the verifier", async () => {
  const store = seeded();
  const fetchImpl = async () =>
    response(200, { accessToken: "a", refreshToken: "r", user });
  const first = await completeOAuthFlow(deps({ store, fetchImpl }), {
    flowId, state, code: "code-1", error: null,
  });
  assert.equal(first.status, "success");
  const replay = await completeOAuthFlow(deps({ store, fetchImpl }), {
    flowId, state, code: "code-1", error: null,
  });
  assert.deepEqual(replay, { status: "failed", reason: "state" });
});

test("expired, mismatched and missing flows fail without calling Nest", async () => {
  let called = 0;
  const fetchImpl = async () => { called += 1; return response(200, {}); };
  const expired = seeded({ provider: "google", flowVerifier: verifier, expiresAt: 999_999 });
  assert.deepEqual(
    await completeOAuthFlow(deps({ store: expired, fetchImpl }), {
      flowId, state, code: "c", error: null,
    }),
    { status: "failed", reason: "state" },
  );
  const otherProvider = seeded({ provider: "github", flowVerifier: verifier, expiresAt: 1_100_000 });
  assert.deepEqual(
    await completeOAuthFlow(deps({ store: otherProvider, fetchImpl }), {
      flowId, state, code: "c", error: null,
    }),
    { status: "failed", reason: "state" },
  );
  assert.deepEqual(
    await completeOAuthFlow(deps({ store: memoryStore(), fetchImpl }), {
      flowId, state, code: "c", error: null,
    }),
    { status: "failed", reason: "state" },
  );
  assert.equal(called, 0);
});

test("provider denial and Nest failures map to distinct Persian-facing reasons", async () => {
  const denied = await completeOAuthFlow(
    deps({
      store: seeded(),
      fetchImpl: async () => response(401, { message: "denied" }),
    }),
    { flowId, state, code: null, error: "access_denied" },
  );
  assert.deepEqual(denied, { status: "failed", reason: "denied" });

  const conflict = await completeOAuthFlow(
    deps({
      store: seeded(),
      fetchImpl: async () => response(409, { message: "collision" }),
    }),
    { flowId, state, code: "c", error: null },
  );
  assert.deepEqual(conflict, { status: "failed", reason: "conflict" });

  const unavailable = await completeOAuthFlow(
    deps({
      store: seeded(),
      fetchImpl: async () => { throw new Error("network"); },
    }),
    { flowId, state, code: "c", error: null },
  );
  assert.deepEqual(unavailable, { status: "failed", reason: "unavailable" });
});

test("malformed Nest success bodies are never turned into a session", async () => {
  for (const payload of [
    { accessToken: "a", refreshToken: "r" },
    { accessToken: "a", refreshToken: "r", user: { ...user, role: { name: "ROOT" } } },
    { accessToken: "", refreshToken: "r", user },
  ]) {
    const result = await completeOAuthFlow(
      deps({ store: seeded(), fetchImpl: async () => response(200, payload) }),
      { flowId, state, code: "c", error: null },
    );
    assert.deepEqual(result, { status: "failed", reason: "unexpected" });
  }
});

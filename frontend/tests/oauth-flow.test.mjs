import assert from "node:assert/strict";
import test from "node:test";
import {
  FLOW_TTL_SECONDS,
  callbackPath,
  decryptFlow,
  encryptFlow,
  flowCookieName,
  flowStoreKey,
  isFlowId,
  isOAuthReason,
  isTrustedAuthorizationUrl,
  loginErrorPath,
  nestOAuthFailure,
  parseAuthorizationResponse,
} from "../src/lib/oauth/flow.ts";

const key = Buffer.alloc(32, 7);
const verifier = "A".repeat(43);
const record = { provider: "google", flowVerifier: verifier, expiresAt: 1_800_000_000_000 };

test("only the provider's own HTTPS origin (or the flagged test host) is trusted", () => {
  assert.equal(
    isTrustedAuthorizationUrl("https://accounts.google.com/o/oauth2/v2/auth?x=1", "google"),
    true,
  );
  assert.equal(isTrustedAuthorizationUrl("https://github.com/login/oauth/authorize", "github"), true);
  assert.equal(isTrustedAuthorizationUrl("https://evil.test/authorize", "google"), false);
  assert.equal(isTrustedAuthorizationUrl("http://127.0.0.1:4101/oauth", "google"), false);
  assert.equal(isTrustedAuthorizationUrl("http://127.0.0.1:4101/oauth", "google", true), true);
  // A provider URL can never carry credentials or a fragment.
  assert.equal(isTrustedAuthorizationUrl("https://user:pass@github.com/x", "github"), false);
  assert.equal(isTrustedAuthorizationUrl("https://github.com/x#y", "github"), false);
});

test("Nest authorization payloads are validated before any redirect", () => {
  const valid = {
    authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth?x=1",
    flowVerifier: verifier,
    expiresIn: 600,
  };
  assert.deepEqual(parseAuthorizationResponse("google", valid), {
    authorizationUrl: valid.authorizationUrl,
    flowVerifier: verifier,
    ttlSeconds: FLOW_TTL_SECONDS,
  });
  assert.equal(parseAuthorizationResponse("google", { ...valid, flowVerifier: "short" }), null);
  assert.equal(parseAuthorizationResponse("google", { ...valid, expiresIn: 5 }), null);
  assert.equal(parseAuthorizationResponse("google", { ...valid, expiresIn: 9000 }), null);
  assert.equal(
    parseAuthorizationResponse("google", { ...valid, authorizationUrl: "https://evil.test/" }),
    null,
  );
});

test("flow records are encrypted, authenticated and never stored raw", () => {
  const sealed = encryptFlow(record, key);
  assert.ok(!sealed.includes(verifier));
  assert.deepEqual(decryptFlow(sealed, key), record);
  assert.throws(() => decryptFlow(`${sealed.slice(0, -2)}xx`, key));
  assert.throws(() => decryptFlow(sealed, Buffer.alloc(32, 9)));
  assert.throws(() => encryptFlow({ ...record, flowVerifier: "bad" }, key));
});

test("flow IDs, store keys and cookie names are opaque and environment-aware", () => {
  assert.equal(isFlowId("A".repeat(43)), true);
  assert.equal(isFlowId("A".repeat(42)), false);
  assert.match(flowStoreKey("A".repeat(43)), /^oauth_flow:[0-9a-f]{64}$/);
  assert.notEqual(flowStoreKey("A".repeat(43)), flowStoreKey("B".repeat(43)));
  assert.equal(flowCookieName(true), "__Host-kia_oauth_flow");
  assert.equal(flowCookieName(false), "kia_oauth_flow");
  assert.equal(callbackPath("github"), "/auth/github/callback");
  assert.equal(loginErrorPath("conflict"), "/login?error=oauth&reason=conflict");
  assert.equal(isOAuthReason("state"), true);
  assert.equal(isOAuthReason("nope"), false);
});

test("Nest OAuth error statuses never collapse into a generic success path", () => {
  assert.equal(nestOAuthFailure(409), "conflict");
  assert.equal(nestOAuthFailure(401), "provider");
  assert.equal(nestOAuthFailure(503), "unavailable");
  assert.equal(nestOAuthFailure(400), "unexpected");
  assert.equal(nestOAuthFailure(500), "unexpected");
  assert.equal(FLOW_TTL_SECONDS, 600);
});

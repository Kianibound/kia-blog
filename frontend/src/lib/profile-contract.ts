import { isSafeCloudinaryUrl } from "./posts-contract.ts";

/** Consumed projection of the live Nest avatar endpoints (#52). */

export type Profile = {
  id: string;
  email: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
};

export type ProfileFailure =
  | "unauthorized"
  | "not-found"
  | "conflict"
  | "too-large"
  | "invalid"
  | "unavailable"
  | "protocol";

export type ProfileOutcome =
  | { state: "success"; profile: Profile }
  | { state: "failure"; reason: ProfileFailure }
  | { state: "csrf" }
  | { state: "uncertain" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * GET /auth/me and the avatar endpoints return the safe user projection.
 * Only a resolved HTTPS delivery URL is accepted; anything else is rejected.
 */
export function parseProfile(value: unknown): Profile | null {
  if (!isRecord(value)) return null;
  if (!isText(value.id) || !isText(value.email) || !isText(value.username))
    return null;
  if (!(value.name === null || typeof value.name === "string")) return null;
  if (
    !(
      value.avatarUrl === null ||
      (typeof value.avatarUrl === "string" && isSafeCloudinaryUrl(value.avatarUrl))
    )
  )
    return null;
  return {
    id: value.id,
    email: value.email,
    username: value.username,
    name: value.name,
    avatarUrl: value.avatarUrl,
  };
}

/** 409 is a concurrent avatar change; 404 is the idempotent-remove contract. */
export function profileFailure(status: number): ProfileFailure {
  if (status === 401) return "unauthorized";
  if (status === 404) return "not-found";
  if (status === 409) return "conflict";
  if (status === 413) return "too-large";
  if (status === 400 || status === 422) return "invalid";
  if (status >= 500) return "unavailable";
  return "protocol";
}

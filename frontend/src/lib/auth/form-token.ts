import {
  createAuthCsrfToken,
  loadAuthCsrfSecret,
} from "./csrf-token.ts";

/** Returns null instead of crashing the public auth page when unconfigured. */
export function getAuthFormToken(): string | null {
  try {
    return createAuthCsrfToken(loadAuthCsrfSecret());
  } catch {
    return null;
  }
}

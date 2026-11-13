import "server-only";
import { parseProfile, type Profile } from "../profile-contract";
import { UnauthenticatedError } from "../session/errors";
import { readAuthenticated } from "../session/server";

export type ProfileResult =
  | { status: "success"; profile: Profile }
  | { status: "unauthenticated" }
  | { status: "unavailable" };

/** GET /auth/me is the only endpoint exposing the current user's avatarUrl. */
export async function loadProfile(): Promise<ProfileResult> {
  try {
    const result = await readAuthenticated(async ({ read }) => {
      const response = await read("/auth/me");
      if (!response.ok) return { status: "unavailable" } as const;
      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        return { status: "unavailable" } as const;
      }
      const profile = parseProfile(payload);
      return profile
        ? ({ status: "success", profile } as const)
        : ({ status: "unavailable" } as const);
    });
    return result ?? { status: "unauthenticated" };
  } catch (error) {
    return error instanceof UnauthenticatedError
      ? { status: "unauthenticated" }
      : { status: "unavailable" };
  }
}

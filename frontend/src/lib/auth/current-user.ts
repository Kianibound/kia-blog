import "server-only";
import { parseAuthenticatedUser } from "./nest-auth.ts";
import type { AuthenticatedUser } from "./nest-auth.ts";
import { UnauthenticatedError } from "../session/errors.ts";
import { readAuthenticated } from "../session/server.ts";

export type PublicAccount = {
  user: AuthenticatedUser;
  csrfToken: string;
};

export type AccountLookup =
  | { status: "authenticated"; account: PublicAccount }
  | { status: "unauthenticated" }
  | { status: "unavailable" };

/**
 * Distinguishes a terminal invalid session from a temporary Nest/store
 * failure. Only the terminal case clears the cookie (inside readAuthenticated).
 */
export async function lookupPublicAccount(): Promise<AccountLookup> {
  try {
    const result = await readAuthenticated(async ({ read, getCsrfToken }) => {
      const response = await read("/auth/me");
      if (!response.ok) return { status: "unavailable" } as const;
      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        return { status: "unavailable" } as const;
      }
      const user = parseAuthenticatedUser(payload);
      if (!user) return { status: "unavailable" } as const;
      return {
        status: "authenticated",
        account: { user, csrfToken: await getCsrfToken() },
      } as const;
    });
    return result ?? { status: "unauthenticated" };
  } catch (error) {
    return error instanceof UnauthenticatedError
      ? { status: "unauthenticated" }
      : { status: "unavailable" };
  }
}

/** Public header identity; temporary failures are not treated as logout. */
export async function getPublicAccount(): Promise<PublicAccount | null> {
  const result = await lookupPublicAccount();
  return result.status === "authenticated" ? result.account : null;
}

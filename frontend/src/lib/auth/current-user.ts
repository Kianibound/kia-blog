import "server-only";
import { parseAuthenticatedUser } from "./nest-auth.ts";
import type { AuthenticatedUser } from "./nest-auth.ts";
import { readAuthenticated } from "../session/server.ts";

export type PublicAccount = {
  user: AuthenticatedUser;
  csrfToken: string;
};

/** Reads the current Nest identity, clearing a terminal invalid session. */
export async function getPublicAccount(): Promise<PublicAccount | null> {
  try {
    return await readAuthenticated(async ({ read, getCsrfToken }) => {
      const response = await read("/auth/me");
      if (!response.ok) return null;
      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        return null;
      }
      const user = parseAuthenticatedUser(payload);
      if (!user) return null;
      return { user, csrfToken: await getCsrfToken() };
    });
  } catch {
    return null;
  }
}

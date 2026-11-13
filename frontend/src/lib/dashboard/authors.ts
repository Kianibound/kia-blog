import "server-only";
import type { PublicAccount } from "../auth/current-user";
import {
  parseAdminAuthorList,
  type AdminAuthorRecord,
} from "../admin-authors-contract";
import { UnauthenticatedError } from "../session/errors";
import { readAuthenticated } from "../session/server";

export type AdminAuthorsResult =
  | { status: "success"; authors: AdminAuthorRecord[] }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "unavailable" };

/**
 * Nest exposes ADMIN author rows through GET /admin/users (there is no
 * dedicated authors list endpoint); USER and ADMIN rows are filtered out.
 */
export async function loadAdminAuthors(
  account: PublicAccount,
): Promise<AdminAuthorsResult> {
  if (account.user.role !== "ADMIN") return { status: "forbidden" };
  try {
    const result = await readAuthenticated(async ({ read }) => {
      const response = await read("/admin/users");
      if (response.status === 401) return { status: "unauthenticated" } as const;
      if (response.status === 403) return { status: "forbidden" } as const;
      if (!response.ok) return { status: "unavailable" } as const;
      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        return { status: "unavailable" } as const;
      }
      const authors = parseAdminAuthorList(payload);
      return authors
        ? ({ status: "success", authors } as const)
        : ({ status: "unavailable" } as const);
    });
    return result ?? { status: "unauthenticated" };
  } catch (error) {
    return error instanceof UnauthenticatedError
      ? { status: "unauthenticated" }
      : { status: "unavailable" };
  }
}

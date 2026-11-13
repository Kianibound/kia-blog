/** Pure contract helpers for the live Nest ADMIN author endpoints. */

export type AdminAuthorRecord = {
  id: string;
  name: string | null;
  email: string;
  username: string;
  disabledAt: string | null;
};

export type AuthorFailureReason =
  | "duplicate"
  | "validation"
  | "unauthorized"
  | "forbidden"
  | "not-found"
  | "conflict"
  | "unavailable"
  | "protocol";

export type AuthorMutationOutcome =
  | { state: "success"; author: AdminAuthorRecord }
  | { state: "failure"; reason: AuthorFailureReason }
  | { state: "csrf" }
  | { state: "uncertain" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

/** ADMIN list entries are only trusted when they are AUTHOR accounts. */
export function parseAdminAuthor(value: unknown): AdminAuthorRecord | null {
  if (!isRecord(value) || !isRecord(value.role)) return null;
  if (!nonEmpty(value.id) || !nonEmpty(value.email) || !nonEmpty(value.username))
    return null;
  if (!(value.name === null || typeof value.name === "string")) return null;
  if (!(value.disabledAt === null || typeof value.disabledAt === "string"))
    return null;
  if (value.role.name !== "AUTHOR") return null;
  return {
    id: value.id,
    name: value.name,
    email: value.email,
    username: value.username,
    disabledAt: value.disabledAt,
  };
}

/**
 * GET /admin/users also returns USER and ADMIN accounts; only AUTHOR rows are
 * exposed by this module. Any malformed AUTHOR row rejects the whole payload.
 */
export function parseAdminAuthorList(value: unknown): AdminAuthorRecord[] | null {
  if (!Array.isArray(value)) return null;
  const authors: AdminAuthorRecord[] = [];
  for (const item of value) {
    if (!isRecord(item) || !isRecord(item.role)) return null;
    if (item.role.name !== "AUTHOR") continue;
    const author = parseAdminAuthor(item);
    if (!author) return null;
    authors.push(author);
  }
  return authors;
}

/** POST /admin/authors status mapping; 409 is a duplicate email or username. */
export function createAuthorFailure(status: number): AuthorFailureReason {
  if (status === 409) return "duplicate";
  if (status === 400 || status === 422) return "validation";
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "not-found";
  if (status >= 500) return "unavailable";
  return "protocol";
}

/** PATCH /admin/authors/:id/deactivate status mapping. */
export function deactivateAuthorFailure(status: number): AuthorFailureReason {
  if (status === 404) return "not-found";
  if (status === 409) return "conflict";
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 400 || status === 422) return "validation";
  if (status >= 500) return "unavailable";
  return "protocol";
}

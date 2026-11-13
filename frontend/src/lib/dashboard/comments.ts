import "server-only";
import { readAuthenticated } from "../session/server";
import { UnauthenticatedError } from "../session/errors";
import {
  parseAdminCommentPage,
  parseOwnCommentPage,
  type AdminComment,
  type CommentPage,
  type OwnComment,
} from "../comments-contract";

const PAGE_SIZE = 10;

export type CommentPageResult<T> =
  | { status: "success"; page: CommentPage<T> }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "unavailable" };

async function loadCommentPage<T>(
  path: string,
  parse: (payload: unknown) => CommentPage<T> | null,
): Promise<CommentPageResult<T>> {
  try {
    const result = await readAuthenticated(async ({ read }) => {
      const response = await read(path);
      if (response.status === 403) return { status: "forbidden" } as const;
      if (!response.ok) return { status: "unavailable" } as const;
      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        return { status: "unavailable" } as const;
      }
      const page = parse(payload);
      return page
        ? ({ status: "success", page } as const)
        : ({ status: "unavailable" } as const);
    });
    return result ?? { status: "unauthenticated" };
  } catch (error) {
    return error instanceof UnauthenticatedError
      ? { status: "unauthenticated" }
      : { status: "unavailable" };
  }
}

/** The signed-in user's own comments in every status, newest first. */
export function loadMyComments(page: number) {
  return loadCommentPage<OwnComment>(
    `/comments/mine?${new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })}`,
    (payload) => parseOwnCommentPage(payload, page, PAGE_SIZE),
  );
}

/** ADMIN moderation inventory across all posts; the server enforces ADMIN. */
export function loadAdminComments(page: number) {
  return loadCommentPage<AdminComment>(
    `/admin/comments?${new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })}`,
    (payload) => parseAdminCommentPage(payload, page, PAGE_SIZE),
  );
}

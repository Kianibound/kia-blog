"use server";

import { headers } from "next/headers";
import {
  bookmarkFailure,
  type BookmarkOutcome,
} from "@/lib/bookmarks-contract";
import {
  CsrfError,
  UnauthenticatedError,
  handleAuthenticatedMutation,
} from "@/lib/session/server";

/**
 * POST creates (idempotently) and DELETE removes (idempotently) the current
 * user's bookmark. Nest derives ownership from the session; no userId is sent.
 */
export async function setBookmarkAction(
  postId: string,
  saved: boolean,
  csrfToken: string,
): Promise<BookmarkOutcome> {
  if (typeof postId !== "string" || !postId.trim() || typeof saved !== "boolean")
    return { state: "failure", reason: "validation" };
  try {
    const requestHeaders = await headers();
    const request = new Request("http://session.internal/bookmark", {
      method: "POST",
      headers: {
        origin: requestHeaders.get("origin") ?? "",
        "x-csrf-token": csrfToken,
      },
    });
    const response = await handleAuthenticatedMutation(request, ({ mutate }) =>
      mutate(`/posts/${encodeURIComponent(postId)}/bookmark`, {
        method: saved ? "POST" : "DELETE",
      }),
    );
    if (response.status >= 500) return { state: "uncertain" };
    if (!response.ok)
      return { state: "failure", reason: bookmarkFailure(response.status) };
    return { state: "success" };
  } catch (error) {
    if (error instanceof CsrfError) return { state: "csrf" };
    if (error instanceof UnauthenticatedError)
      return { state: "failure", reason: "unauthorized" };
    return { state: "uncertain" };
  }
}

import "server-only";
import { parseBookmarks, type SavedBookmark } from "../bookmarks-contract";
import { UnauthenticatedError } from "../session/errors";
import { readAuthenticated } from "../session/server";

export type SavedBookmarksResult =
  | { status: "success"; bookmarks: SavedBookmark[] }
  | { status: "unauthenticated" }
  | { status: "unavailable" };

/**
 * GET /bookmarks is already scoped to the authenticated user by Nest, is
 * PUBLISHED-only and unpaginated. The browser never sends a userId.
 */
export async function loadSavedBookmarks(): Promise<SavedBookmarksResult> {
  try {
    const result = await readAuthenticated(async ({ read }) => {
      const response = await read("/bookmarks");
      if (!response.ok) return { status: "unavailable" } as const;
      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        return { status: "unavailable" } as const;
      }
      const bookmarks = parseBookmarks(payload);
      return bookmarks
        ? ({ status: "success", bookmarks } as const)
        : ({ status: "unavailable" } as const);
    });
    return result ?? { status: "unauthenticated" };
  } catch (error) {
    return error instanceof UnauthenticatedError
      ? { status: "unauthenticated" }
      : { status: "unavailable" };
  }
}

/** null means the saved state could not be verified; the toggle is then hidden. */
export async function loadBookmarkState(postId: string): Promise<boolean | null> {
  const result = await loadSavedBookmarks();
  if (result.status !== "success") return null;
  return result.bookmarks.some((bookmark) => bookmark.postId === postId);
}

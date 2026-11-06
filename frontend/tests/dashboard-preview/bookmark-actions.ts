"use server";
import { readFixtureIdentity } from "./identity";
import type { BookmarkWriteResult } from "@/lib/posts-contract";

// Test-only ownership check; this header is not a production authentication mechanism.
export async function changeFixtureBookmark(userId: string, slug: string, saved: boolean): Promise<BookmarkWriteResult> {
  if (typeof userId !== "string" || !userId || typeof slug !== "string" || !slug || typeof saved !== "boolean") return "error";
  const identity = await readFixtureIdentity();
  if (identity?.role !== "USER" || identity.id !== userId) return "error";
  try {
    const response = await fetch(`http://127.0.0.1:4101/article-bookmarks/${encodeURIComponent(slug)}`, {
      method: saved ? "PUT" : "DELETE", headers: { "X-Fixture-User": userId }, cache: "no-store", signal: AbortSignal.timeout(2500),
    });
    if (response.status === 204) return "saved";
    return response.status >= 400 && response.status < 500 ? "error" : "uncertain";
  } catch { return "uncertain"; }
}

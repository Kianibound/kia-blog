"use server";
import { readFixtureIdentity } from "./identity";
import { validateArticleCommentText, type CommentModerationResult } from "@/lib/comment-moderation-contract";

// Fixture-only writes; no production account or comment endpoint is activated.
async function write(id: string, text?: string): Promise<CommentModerationResult> {
  if ((await readFixtureIdentity())?.role !== "USER" || typeof id !== "string" || !id.trim() || (text !== undefined && validateArticleCommentText(text))) return "error";
  try {
    const response = await fetch(`http://127.0.0.1:4101/dashboard-my-comments/${encodeURIComponent(id)}`, {
      method: text === undefined ? "DELETE" : "PATCH",
      ...(text === undefined ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: text.trim() }) }),
      cache: "no-store", signal: AbortSignal.timeout(2500),
    });
    if (response.status === 204) return "saved";
    return response.status >= 400 && response.status < 500 ? "error" : "uncertain";
  } catch { return "uncertain"; }
}

export async function saveOwnFixtureComment(id: string, text: string): Promise<CommentModerationResult> {
  if (validateArticleCommentText(text)) return "error";
  return write(id, text);
}

export async function deleteOwnFixtureComment(id: string): Promise<CommentModerationResult> {
  return write(id);
}

"use server";

import { parseModerationComments, validateArticleCommentText, type ArticleCommentSubmissionResult } from "@/lib/comment-moderation-contract";
import { readFixtureIdentity } from "./identity";

// Test-only adapter. Identity, article association and PENDING status come from the fixture.
export async function submitFixtureArticleComment(slug: string, text: string): Promise<ArticleCommentSubmissionResult> {
  if (typeof slug !== "string" || !slug || validateArticleCommentText(text) || (await readFixtureIdentity())?.role !== "USER") return "error";
  try {
    const response = await fetch(`http://127.0.0.1:4101/article-comments/${encodeURIComponent(slug)}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: text.trim() }),
      cache: "no-store", signal: AbortSignal.timeout(2500),
    });
    if (response.status >= 400 && response.status < 500) return "error";
    if (response.status !== 201) return "uncertain";
    const comment = parseModerationComments([await response.json()])[0];
    return comment.status === "PENDING" && comment.text === text.trim() ? "pending" : "uncertain";
  } catch { return "uncertain"; }
}

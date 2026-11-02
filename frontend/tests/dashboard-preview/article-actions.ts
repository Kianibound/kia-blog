"use server";

import { parseArticleWrite, type ArticleInput, type ArticleSaveResult } from "@/lib/article-form-contract";
import { readFixtureIdentity } from "./identity";

// Test-only HTTP adapter. No production API, credentials or auth policy.
export async function saveFixtureArticle(id: string | undefined, input: ArticleInput): Promise<ArticleSaveResult> {
  const identity = await readFixtureIdentity();
  if (identity?.role !== "AUTHOR") return { state: "error" };
  try {
    const response = await fetch(`http://127.0.0.1:4101/dashboard-posts${id ? `/${encodeURIComponent(id)}` : ""}`, {
      method: id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input), cache: "no-store", signal: AbortSignal.timeout(2500),
    });
    if (response.status >= 400 && response.status < 500) return { state: "error" };
    if (!response.ok) return { state: "uncertain" };
    const post = parseArticleWrite(await response.json());
    if (post.authorId !== identity.id || (id && post.id !== id)) return { state: "uncertain" };
    return { state: "saved", post };
  } catch { return { state: "uncertain" }; }
}

"use server";

import { parseArticleDetail, parseArticleWrite, type ArticleInput, type ArticleSaveResult } from "@/lib/article-form-contract";
import { readFixtureIdentity } from "./identity";
import type { PreviewDocument } from "./editor-document";

// Test-only HTTP adapter. No production API, credentials or auth policy.
async function writeFixtureArticle(id: string | undefined, body: ArticleInput | { status: "DRAFT" | "PUBLISHED" } | (ArticleInput & { previewDocument: PreviewDocument })): Promise<ArticleSaveResult> {
  const identity = await readFixtureIdentity();
  if (!identity || (identity.role !== "AUTHOR" && identity.role !== "ADMIN") || (identity.role === "ADMIN" && !id)) return { state: "error" };
  try {
    let ownerId = identity.id;
    if (identity.role === "ADMIN") {
      const current = await fetch(`http://127.0.0.1:4101/dashboard-posts/${encodeURIComponent(id!)}`, { cache: "no-store", signal: AbortSignal.timeout(2500) });
      if (!current.ok) return { state: "error" };
      ownerId = parseArticleDetail(await current.json()).authorId;
    }
    const response = await fetch(`http://127.0.0.1:4101/dashboard-posts${id ? `/${encodeURIComponent(id)}` : ""}`, {
      method: id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store", signal: AbortSignal.timeout(2500),
    });
    if (response.status >= 400 && response.status < 500) return { state: "error" };
    if (!response.ok) return { state: "uncertain" };
    const post = parseArticleWrite(await response.json());
    if (post.authorId !== ownerId || (id && post.id !== id)) return { state: "uncertain" };
    return { state: "saved", post };
  } catch { return { state: "uncertain" }; }
}

export async function saveFixtureArticle(id: string | undefined, input: ArticleInput, previewDocument?: PreviewDocument): Promise<ArticleSaveResult> {
  return writeFixtureArticle(id, { ...input, ...(previewDocument ? { previewDocument } : {}) });
}

export async function changeFixturePublication(id: string, status: "DRAFT" | "PUBLISHED"): Promise<ArticleSaveResult> {
  if (status !== "DRAFT" && status !== "PUBLISHED") return { state: "error" };
  const result = await writeFixtureArticle(id, { status });
  if (result.state === "saved" && (result.post.status !== status || (status === "DRAFT" && result.post.publishedAt !== null) || (status === "PUBLISHED" && result.post.publishedAt === null))) return { state: "uncertain" };
  return result;
}

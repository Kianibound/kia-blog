import { parseOwnPosts, type OwnPost } from "./own-posts-contract.ts";
import { parseContentMedia, parseCoverImage, type ContentMedia, type CoverImage } from "./posts-contract.ts";
import type { EditorDocument } from "@/components/editor/types";

export type ArticleTaxonomy = { id: string; name: string; slug: string };
export type ArticleInput = { title: string; content?: string; contentDocument?: EditorDocument; categoryIds: string[]; tagIds: string[]; coverImage?: CoverImage | null };
export type ArticleRecord = OwnPost & { contentDocument?: EditorDocument | null; contentMedia?: ContentMedia[]; categories: ArticleTaxonomy[]; tags: ArticleTaxonomy[]; coverImage?: CoverImage | null };
export type ArticleSaveResult = { state: "saved"; post: ArticleRecord } | { state: "error"; message?: string } | { state: "uncertain"; message?: string };

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseArticleTaxonomy(value: unknown): ArticleTaxonomy[] {
  if (!Array.isArray(value)) throw new Error("Invalid article taxonomy");
  const rows = value.map(item => {
    if (!record(item) || typeof item.id !== "string" || !item.id.trim() || typeof item.name !== "string" || !item.name.trim() || typeof item.slug !== "string") throw new Error("Invalid article taxonomy");
    return { id: item.id, name: item.name, slug: item.slug };
  });
  if (new Set(rows.map(item => item.id)).size !== rows.length) throw new Error("Duplicate article taxonomy");
  return rows;
}

/** The consumed shared projection; detail and write envelopes are checked separately. */
function parseArticle(value: unknown): ArticleRecord {
  if (!record(value)) throw new Error("Invalid article");
  const post = parseOwnPosts({ data: [value], meta: { page: 1, limit: 1, total: 1, totalPages: 1 } }, 1, 1).data[0];
  const contentDocument = value.contentDocument;
  if (contentDocument !== undefined && contentDocument !== null && !record(contentDocument)) throw new Error("Invalid article document");
  const contentMedia = value.contentMedia === undefined ? [] : parseContentMedia(value.contentMedia);
  return { ...post, contentDocument: contentDocument === undefined ? null : (contentDocument as EditorDocument | null), contentMedia, coverImage: parseCoverImage(value.coverImage), categories: parseArticleTaxonomy(value.categories), tags: parseArticleTaxonomy(value.tags) };
}

export function parseArticleDetail(value: unknown): ArticleRecord {
  const post = parseArticle(value);
  if (!record(value) || !record(value.author) || value.author.id !== post.authorId || typeof value.author.username !== "string") throw new Error("Invalid article detail author");
  return post;
}

export function parseArticleWrite(value: unknown): ArticleRecord {
  const post = parseArticle(value);
  // PostWriteResponseDto has full taxonomy timestamps and no required author relation.
  if (!record(value)) throw new Error("Invalid article write");
  for (const key of ["categories", "tags"]) {
    const rows = value[key] as Record<string, unknown>[];
    if (rows.some(item => [item.createdAt, item.updatedAt].some(date => typeof date !== "string" || !/(?:Z|[+-]\d{2}:\d{2})$/.test(date) || !Number.isFinite(Date.parse(date))))) throw new Error("Invalid article write taxonomy");
  }
  return post;
}

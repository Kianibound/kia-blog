import type { EditorDocument } from "@/components/editor/types";
import type { ArticleTaxonomy } from "./article-form-contract";
import { CsrfError } from "./session/errors.ts";

export type ArticleWritePayload = {
  title: string;
  content?: string;
  contentDocument?: EditorDocument;
  categoryIds: string[];
  tagIds: string[];
};

export class UnsupportedArticleImageError extends Error {
  constructor() {
    super("Unsupported article image");
    this.name = "UnsupportedArticleImageError";
  }
}

const MEDIA_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function canonicalDocument(value: unknown): EditorDocument {
  if (!isRecord(value) || value.type !== "doc" || !Array.isArray(value.content))
    throw new Error("Invalid article document");
  return walk(value) as EditorDocument;
}

function walk(value: unknown): unknown {
  if (!isRecord(value)) return value;
  if (value.type === "image") {
    const attrs = value.attrs;
    if (
      !isRecord(attrs) ||
      typeof attrs.mediaId !== "string" ||
      !MEDIA_ID.test(attrs.mediaId) ||
      typeof attrs.alt !== "string" ||
      !attrs.alt.trim()
    )
      throw new UnsupportedArticleImageError();
    return {
      type: "image",
      attrs: {
        mediaId: attrs.mediaId,
        alt: attrs.alt,
        ...(typeof attrs.title === "string" ? { title: attrs.title } : {}),
      },
    };
  }
  return {
    ...value,
    ...(Array.isArray(value.content)
      ? { content: value.content.map((child) => walk(child)) }
      : {}),
  };
}

export type ArticleStatusPayload = { status: "DRAFT" | "PUBLISHED" };

function doc(value: unknown): value is EditorDocument {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    (value as { type?: unknown }).type === "doc" &&
    Array.isArray((value as { content?: unknown }).content)
  );
}

/** Create/update requests are canonical and never mix legacy content. */
export function buildArticleWritePayload(input: {
  title: string;
  document?: unknown;
  content?: string;
  categoryIds: string[];
  tagIds: string[];
}): ArticleWritePayload {
  if (!input.title.trim()) throw new Error("Invalid article title");
  const hasDocument = input.document !== undefined;
  const hasContent = input.content !== undefined;
  if (hasDocument === hasContent)
    throw new Error("Supply exactly one content source");
  if (hasContent && !input.content?.trim())
    throw new Error("Invalid article content");
  if (new Set(input.categoryIds).size !== input.categoryIds.length) throw new Error("Duplicate category");
  if (new Set(input.tagIds).size !== input.tagIds.length) throw new Error("Duplicate tag");
  return {
    title: input.title.trim(),
    ...(hasDocument
      ? { contentDocument: canonicalDocument(input.document) }
      : { content: input.content }),
    categoryIds: input.categoryIds,
    tagIds: input.tagIds,
  };
}

export function articleWritePath(id?: string): string {
  return id ? `/posts/${encodeURIComponent(id)}` : "/posts";
}

export function articleWriteMethod(id?: string): "POST" | "PATCH" {
  return id ? "PATCH" : "POST";
}

export function buildStatusPayload(status: "DRAFT" | "PUBLISHED"): ArticleStatusPayload {
  return { status };
}

export function taxonomyIds(items: ArticleTaxonomy[]): string[] {
  return items.map((item) => item.id);
}

/** CSRF rejection is definite; other thrown write errors remain uncertain. */
export function mutationErrorResult(
  error: unknown,
  csrfMessage: string,
): { state: "error"; message: string } | { state: "uncertain" } {
  return error instanceof CsrfError
    ? { state: "error", message: csrfMessage }
    : { state: "uncertain" };
}

/** Only definite server-provided messages override generic publication copy. */
export function publicationFailureMessage(
  result: { state: "saved" | "error" | "uncertain"; message?: string },
  fallback: string,
): string {
  return result.state === "error" && result.message ? result.message : fallback;
}

export function articleDocument(record: {
  content?: string;
  contentDocument?: EditorDocument | null;
}): EditorDocument {
  const document = record.contentDocument;
  if (doc(document)) return document;
  return {
    type: "doc",
    content: (record.content ?? "").split("\n").map((line) => ({
      type: "paragraph",
      ...(line ? { content: [{ type: "text", text: line }] } : {}),
    })),
  };
}

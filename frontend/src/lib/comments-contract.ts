/** Consumed projections of the live Nest comment endpoints (#54–#56). */

export type CommentStatus = "PENDING" | "APPROVED";

export type CommentPageMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type CommentPage<T> = { data: T[]; meta: CommentPageMeta };

/** Approved public replies carry no status-specific fields beyond display data. */
export type PublicReply = {
  id: string;
  content: string;
  authorName: string;
  createdAt: string;
};

export type PublicComment = PublicReply & { replies: PublicReply[] };

export type OwnComment = {
  id: string;
  postId: string;
  content: string;
  status: CommentStatus;
  version: number;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminComment = {
  id: string;
  content: string;
  status: CommentStatus;
  version: number;
  authorName: string;
  createdAt: string;
  updatedAt: string;
};

export type CommentFailureReason =
  | "validation"
  | "unauthorized"
  | "forbidden"
  | "not-found"
  | "conflict"
  | "unavailable"
  | "protocol";

export type CommentMutationOutcome<T = never> =
  | { state: "success"; value?: T }
  | { state: "failure"; reason: CommentFailureReason }
  | { state: "csrf" }
  | { state: "uncertain" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseAuthorName(value: unknown): string | null {
  if (!isRecord(value) || !nonEmpty(value.username)) return null;
  if (!(value.name === null || typeof value.name === "string")) return null;
  return value.name?.trim() || value.username;
}

function parseStatus(value: unknown): CommentStatus | null {
  return value === "PENDING" || value === "APPROVED" ? value : null;
}

function parsePublicReply(value: unknown): PublicReply | null {
  if (!isRecord(value) || value.status !== "APPROVED") return null;
  if (!nonEmpty(value.id) || !nonEmpty(value.content) || !nonEmpty(value.createdAt)) return null;
  const authorName = parseAuthorName(value.author);
  if (!authorName) return null;
  return { id: value.id, content: value.content, authorName, createdAt: value.createdAt };
}

/**
 * Public reads expose only APPROVED roots and their APPROVED direct replies.
 * Any PENDING row invalidates the payload so hidden text can never render.
 */
export function parsePublicComments(value: unknown): PublicComment[] | null {
  if (!Array.isArray(value)) return null;
  const comments: PublicComment[] = [];
  for (const item of value) {
    const root = parsePublicReply(item);
    if (!root || !isRecord(item) || !Array.isArray(item.replies)) return null;
    const replies: PublicReply[] = [];
    for (const reply of item.replies) {
      const parsed = parsePublicReply(reply);
      if (!parsed) return null;
      replies.push(parsed);
    }
    comments.push({ ...root, replies });
  }
  return comments;
}

export function parseOwnComment(value: unknown): OwnComment | null {
  if (!isRecord(value)) return null;
  const status = parseStatus(value.status);
  if (
    !status ||
    !nonEmpty(value.id) ||
    !nonEmpty(value.postId) ||
    !nonEmpty(value.content) ||
    !nonEmpty(value.createdAt) ||
    !nonEmpty(value.updatedAt) ||
    typeof value.version !== "number" ||
    !Number.isSafeInteger(value.version) ||
    value.version < 1 ||
    !(value.parentId === null || nonEmpty(value.parentId))
  )
    return null;
  return {
    id: value.id,
    postId: value.postId,
    content: value.content,
    status,
    version: value.version,
    parentId: value.parentId,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

export function parseAdminComment(value: unknown): AdminComment | null {
  if (!isRecord(value)) return null;
  const status = parseStatus(value.status);
  const authorName = parseAuthorName(value.author);
  if (
    !status ||
    !authorName ||
    !nonEmpty(value.id) ||
    !nonEmpty(value.content) ||
    !nonEmpty(value.createdAt) ||
    !nonEmpty(value.updatedAt) ||
    typeof value.version !== "number" ||
    !Number.isSafeInteger(value.version) ||
    value.version < 1
  )
    return null;
  return {
    id: value.id,
    content: value.content,
    status,
    version: value.version,
    authorName,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

function parsePage<T>(
  value: unknown,
  page: number,
  limit: number,
  parseItem: (item: unknown) => T | null,
): CommentPage<T> | null {
  if (!isRecord(value) || !Array.isArray(value.data) || !isRecord(value.meta)) return null;
  const meta = value.meta;
  if (
    meta.page !== page ||
    meta.limit !== limit ||
    typeof meta.total !== "number" ||
    !Number.isSafeInteger(meta.total) ||
    meta.total < 0 ||
    meta.totalPages !== Math.ceil(meta.total / limit) ||
    value.data.length > limit
  )
    return null;
  const data: T[] = [];
  for (const item of value.data) {
    const parsed = parseItem(item);
    if (!parsed) return null;
    data.push(parsed);
  }
  return { data, meta: { page, limit, total: meta.total, totalPages: meta.totalPages } };
}

export function parseOwnCommentPage(value: unknown, page: number, limit: number) {
  return parsePage(value, page, limit, parseOwnComment);
}

export function parseAdminCommentPage(value: unknown, page: number, limit: number) {
  return parsePage(value, page, limit, parseAdminComment);
}

/** Nest trims content; the browser trims too so blank text never leaves the page. */
export function validateCommentText(value: unknown): "required" | null {
  return typeof value === "string" && value.trim().length > 0 ? null : "required";
}

export function approveVersionIsValid(version: unknown): version is number {
  return typeof version === "number" && Number.isSafeInteger(version) && version >= 1;
}

/**
 * One mapping for every comment write. 409 is a stale approval, a PENDING-only
 * violation, or a concurrent change; the approve UI never retries it silently.
 */
export function commentFailure(status: number): CommentFailureReason {
  if (status === 400 || status === 422) return "validation";
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "not-found";
  if (status === 409) return "conflict";
  if (status >= 500) return "unavailable";
  return "protocol";
}

// Consumed projection of Nest's PostFeedResponseDto. Unused fields are ignored.
type PostFeedResponse = {
  data: {
    id: string;
    title: string;
    slug: string;
    status: "PUBLISHED";
    coverImage?: CoverImage | null;
    publishedAt: string | null;
    author: { username: string; name: string | null };
    categories: { id: string; name: string }[];
  }[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

export type PostSummary = {
  coverImage?: CoverImage | null;
  id: string;
  title: string;
  slug: string;
  publishedAt: string | null;
  authorName: string;
  categories: { id: string; name: string }[];
};

// Test-preview bookmark projections only; not a production bookmark API contract.
export type BookmarkWriteResult = "saved" | "error" | "uncertain";
export function parseBookmarkState(value: unknown, userId: string, slug: string): boolean {
  if (!isRecord(value) || !isText(userId) || value.userId !== userId || value.slug !== slug || typeof value.saved !== "boolean") throw new Error("Invalid fixture bookmark state");
  return value.saved;
}

export function parseBookmarkedPosts(value: unknown, userId: string): PostDetail[] {
  if (!isRecord(value) || !isText(userId) || value.userId !== userId || !Array.isArray(value.data)) throw new Error("Invalid fixture bookmark ownership");
  const posts = value.data.map(parsePublishedPost);
  if (new Set(posts.map(post => post.id)).size !== posts.length || new Set(posts.map(post => post.slug)).size !== posts.length) throw new Error("Duplicate fixture bookmarks");
  return posts;
}

// Normalized presentation cover. Accepts Nest's `{ id, url, width, height, alt }`
// and the existing test-preview `{ src, alt }` shape.
export type CoverImage = {
  src: string;
  alt: string;
  width: number | null;
  height: number | null;
};
export function parseCoverImage(value: unknown): CoverImage | null {
  if (value === undefined || value === null) return null;
  if (!isRecord(value)) throw new Error("Invalid cover image");
  if (typeof value.src === "string") {
    if (!/^\/fixture-images\/[a-f0-9-]+$/.test(value.src) || !isText(value.alt))
      throw new Error("Invalid cover image");
    return { src: value.src, alt: value.alt, width: null, height: null };
  }
  if (
    !isText(value.id) ||
    !isSafeCloudinaryUrl(value.url) ||
    !isText(value.alt) ||
    !(value.width === null || isInteger(value.width, 1)) ||
    !(value.height === null || isInteger(value.height, 1))
  )
    throw new Error("Invalid cover image");
  return {
    src: value.url,
    alt: value.alt,
    width: value.width,
    height: value.height,
  };
}

type Taxonomy = { id: string; name: string; slug: string };
export type PostDetail = PostSummary & {
  content: string;
  contentDocument: RichDocument | null;
  contentMedia: ContentMedia[];
  categories: Taxonomy[];
  tags: Taxonomy[];
};

function isTaxonomy(value: unknown): value is Taxonomy {
  return isRecord(value) && isText(value.id) && isText(value.name) && typeof value.slug === "string";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isInteger(value: unknown, minimum: number): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= minimum;
}

function isPost(value: unknown): value is PostFeedResponse["data"][number] {
  return (
    isRecord(value) &&
    isText(value.id) &&
    isText(value.title) &&
    typeof value.slug === "string" &&
    value.status === "PUBLISHED" &&
    (value.publishedAt === null ||
      (typeof value.publishedAt === "string" &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value.publishedAt) &&
        Number.isFinite(Date.parse(value.publishedAt)))) &&
    isRecord(value.author) &&
    isText(value.author.username) &&
    (value.author.name === null || typeof value.author.name === "string") &&
    Array.isArray(value.categories) &&
    value.categories.every((category: unknown) =>
      isRecord(category) && isText(category.id) && isText(category.name))
  );
}

function isPostFeed(value: unknown): value is PostFeedResponse {
  return (
    isRecord(value) &&
    Array.isArray(value.data) &&
    value.data.every(isPost) &&
    isRecord(value.meta) &&
    isInteger(value.meta.page, 1) &&
    isInteger(value.meta.limit, 1) && value.meta.limit <= 50 &&
    isInteger(value.meta.total, 0) &&
    isInteger(value.meta.totalPages, 0) &&
    value.data.length <= value.meta.limit
  );
}

/** Validate the HTTP response before exposing only feed-safe presentation data. */
export function parsePublishedPosts(payload: unknown): { data: PostSummary[]; meta: PostFeedResponse["meta"] } {
  if (!isPostFeed(payload)) throw new Error("Invalid public posts response");

  return {
    data: payload.data.map((post) => ({
      id: post.id,
      coverImage: parseCoverImage(post.coverImage),
      title: post.title,
      slug: post.slug,
      publishedAt: post.publishedAt,
      authorName: post.author.name?.trim() || post.author.username,
      categories: post.categories.map(({ id, name }) => ({ id, name })),
    })),
    meta: { ...payload.meta },
  };
}

/** Consumed projection of the single-object PostDetailResponseDto. */
export function parsePublishedPost(payload: unknown): PostDetail {
  if (!isRecord(payload)) throw new Error("Invalid public post response");
  const { content, tags, contentDocument, contentMedia } = payload;
  if (!isPost(payload) || !isText(content) ||
    !payload.categories.every(isTaxonomy) || !Array.isArray(tags) || !tags.every(isTaxonomy)) {
    throw new Error("Invalid public post response");
  }
  return {
    id: payload.id,
    coverImage: parseCoverImage(payload.coverImage),
    title: payload.title,
    slug: payload.slug,
    content,
    contentDocument: parseRichDocument(contentDocument),
    contentMedia: parseContentMedia(contentMedia),
    publishedAt: payload.publishedAt,
    authorName: payload.author.name?.trim() || payload.author.username,
    categories: payload.categories.map(({ id, name, slug }) => ({ id, name, slug })),
    tags: tags.map(({ id, name, slug }) => ({ id, name, slug })),
  };
}
/**
 * Safe read-side contract for canonical Nest Tiptap documents (#47Ã¢â‚¬â€œ#49) and the
 * server-resolved `contentMedia` projection. Rendering never uses raw HTML or a
 * client-supplied image URL: images resolve only through `contentMedia`.
 */

export type TextDirection = "rtl" | "ltr" | "auto";
export type OrderedListType = "1" | "a" | "A" | "i" | "I";

export type ContentMedia = {
  id: string;
  url: string;
  width: number | null;
  height: number | null;
};

type Mark =
  | { type: "bold" | "italic" | "code" }
  | { type: "link"; href: string; target: "_blank" | "_self" | null };

export type RichNode =
  | { type: "text"; text: string; marks: Mark[] }
  | { type: "hardBreak" }
  | { type: "image"; mediaId: string; alt: string; title?: string }
  | {
      type:
        | "paragraph"
        | "heading"
        | "bulletList"
        | "orderedList"
        | "listItem"
        | "blockquote"
        | "codeBlock";
      dir?: TextDirection;
      level?: 2 | 3 | 4;
      start?: number;
      listType?: OrderedListType;
      language?: string;
      content: RichNode[];
    };

export type RichDocument = {
  type: "doc";
  dir?: TextDirection;
  content: RichNode[];
};

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_DEPTH = 32;

function safeUrl(value: unknown, protocols: string[]): value is string {
  if (!isText(value)) return false;
  try {
    const url = new URL(value);
    return protocols.includes(url.protocol) && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function isSafeCloudinaryUrl(value: unknown): value is string {
  if (!isText(value)) return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname === "res.cloudinary.com" &&
      !url.username &&
      !url.password &&
      !url.port &&
      !url.search &&
      !url.hash &&
      /^\/[^/]+\/image\/upload\//.test(url.pathname)
    );
  } catch {
    return false;
  }
}

function isSafeLinkHref(value: unknown): value is string {
  return safeUrl(value, ["http:", "https:"]);
}

function direction(value: unknown): TextDirection | undefined {
  return value === "rtl" || value === "ltr" || value === "auto" ? value : undefined;
}

/** Server-resolved media only; unsafe or duplicate entries invalidate the response. */
export function parseContentMedia(value: unknown): ContentMedia[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error("Invalid content media");
  const seen = new Set<string>();
  return value.map((item) => {
    if (
      !isRecord(item) ||
      !isText(item.id) ||
      !isSafeCloudinaryUrl(item.url) ||
      !(item.width === null || isInteger(item.width, 1)) ||
      !(item.height === null || isInteger(item.height, 1)) ||
      seen.has(item.id)
    )
      throw new Error("Invalid content media");
    seen.add(item.id);
    return { id: item.id, url: item.url, width: item.width, height: item.height };
  });
}

function parseMarks(value: unknown): Mark[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error("Invalid content document");
  const names = new Set<string>();
  return value.map((input) => {
    if (!isRecord(input) || typeof input.type !== "string" || names.has(input.type))
      throw new Error("Invalid content document");
    names.add(input.type);
    if (input.type === "link") {
      if (!isRecord(input.attrs) || !isSafeLinkHref(input.attrs.href))
        throw new Error("Invalid content document");
      const target = input.attrs.target;
      return {
        type: "link" as const,
        href: input.attrs.href,
        target: target === "_blank" || target === "_self" ? target : null,
      };
    }
    if (input.type !== "bold" && input.type !== "italic" && input.type !== "code")
      throw new Error("Invalid content document");
    return { type: input.type };
  });
}

function parseChildren(value: unknown, depth: number, parent: string): RichNode[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error("Invalid content document");
  return value.map((child) => parseNode(child, depth + 1, parent));
}

function parseNode(input: unknown, depth: number, parent: string): RichNode {
  if (!isRecord(input) || typeof input.type !== "string" || depth > MAX_DEPTH)
    throw new Error("Invalid content document");
  const type = input.type;

  if (type === "text") {
    if (parent !== "paragraph" && parent !== "heading" && parent !== "codeBlock")
      throw new Error("Invalid content document");
    // Match the backend: any non-empty string is valid, whitespace included.
    if (typeof input.text !== "string" || input.text.length === 0)
      throw new Error("Invalid content document");
    return { type: "text", text: input.text, marks: parseMarks(input.marks) };
  }

  if (type === "hardBreak") {
    if (parent !== "paragraph" && parent !== "heading")
      throw new Error("Invalid content document");
    return { type: "hardBreak" };
  }

  if (type === "image") {
    // Images are block leaves, never inline inside paragraphs, headings or code.
    if (parent !== "doc" && parent !== "blockquote" && parent !== "listItem")
      throw new Error("Invalid content document");
    if (!isRecord(input.attrs) || input.content !== undefined)
      throw new Error("Invalid content document");
    const { mediaId, alt, title } = input.attrs;
    if (
      typeof mediaId !== "string" ||
      !UUID_V4.test(mediaId) ||
      !isText(alt) ||
      alt.length > 500 ||
      (title !== undefined && (typeof title !== "string" || title.length > 256))
    )
      throw new Error("Invalid content document");
    return {
      type: "image",
      mediaId,
      alt,
      ...(typeof title === "string" ? { title } : {}),
    };
  }

  const dir = isRecord(input.attrs) ? direction(input.attrs.dir) : undefined;

  if (type === "paragraph") {
    if (parent !== "doc" && parent !== "listItem" && parent !== "blockquote")
      throw new Error("Invalid content document");
    return { type, ...(dir ? { dir } : {}), content: parseChildren(input.content, depth, type) };
  }

  if (type === "heading") {
    if (parent !== "doc" && parent !== "listItem" && parent !== "blockquote")
      throw new Error("Invalid content document");
    const level = isRecord(input.attrs) ? input.attrs.level : undefined;
    if (level !== 2 && level !== 3 && level !== 4)
      throw new Error("Invalid content document");
    return {
      type,
      level,
      ...(dir ? { dir } : {}),
      content: parseChildren(input.content, depth, type),
    };
  }

  if (type === "bulletList" || type === "orderedList") {
    if (parent !== "doc" && parent !== "listItem" && parent !== "blockquote")
      throw new Error("Invalid content document");
    const attrs = isRecord(input.attrs) ? input.attrs : {};
    const start = type === "orderedList" ? attrs.start : undefined;
    if (start !== undefined && !isInteger(start, 1)) throw new Error("Invalid content document");
    const listType = type === "orderedList" ? attrs.type : undefined;
    if (
      listType !== undefined &&
      listType !== null &&
      (typeof listType !== "string" || !["1", "a", "A", "i", "I"].includes(listType))
    )
      throw new Error("Invalid content document");
    return {
      type,
      ...(dir ? { dir } : {}),
      ...(start !== undefined ? { start: start as number } : {}),
      ...(typeof listType === "string" ? { listType: listType as OrderedListType } : {}),
      content: parseChildren(input.content, depth, type),
    };
  }

  if (type === "listItem") {
    if (parent !== "bulletList" && parent !== "orderedList")
      throw new Error("Invalid content document");
    return { type, ...(dir ? { dir } : {}), content: parseChildren(input.content, depth, type) };
  }

  if (type === "blockquote") {
    if (parent !== "doc" && parent !== "listItem" && parent !== "blockquote")
      throw new Error("Invalid content document");
    return { type, ...(dir ? { dir } : {}), content: parseChildren(input.content, depth, type) };
  }

  if (type === "codeBlock") {
    if (parent !== "doc" && parent !== "listItem" && parent !== "blockquote")
      throw new Error("Invalid content document");
    const language = isRecord(input.attrs) ? input.attrs.language : undefined;
    if (
      language !== undefined &&
      language !== null &&
      (typeof language !== "string" || !/^[A-Za-z0-9_+.#-]*$/.test(language))
    )
      throw new Error("Invalid content document");
    return {
      type,
      ...(dir ? { dir } : {}),
      ...(typeof language === "string" ? { language } : {}),
      content: parseChildren(input.content, depth, type),
    };
  }

  throw new Error("Invalid content document");
}

/** Validate and sanitize a canonical document; `null` means legacy plain text. */
export function parseRichDocument(value: unknown): RichDocument | null {
  if (value === undefined || value === null) return null;
  if (!isRecord(value) || value.type !== "doc" || !Array.isArray(value.content))
    throw new Error("Invalid content document");
  const dir = isRecord(value.attrs) ? direction(value.attrs.dir) : undefined;
  const content = value.content.map((child) => parseNode(child, 1, "doc"));
  return { type: "doc", ...(dir ? { dir } : {}), content };
}

export type InlineRun =
  | {
      kind: "text";
      text: string;
      bold?: boolean;
      italic?: boolean;
      code?: boolean;
      href?: string;
      target?: "_blank" | "_self";
    }
  | { kind: "break" };

export type RichBlock =
  | { kind: "paragraph"; dir?: TextDirection; runs: InlineRun[] }
  | { kind: "heading"; level: 2 | 3 | 4; dir?: TextDirection; runs: InlineRun[] }
  | { kind: "blockquote"; dir?: TextDirection; blocks: RichBlock[] }
  | {
      kind: "list";
      ordered: boolean;
      start?: number;
      listType?: OrderedListType;
      dir?: TextDirection;
      items: RichBlock[][];
    }
  | { kind: "codeBlock"; dir?: TextDirection; language?: string; text: string }
  | { kind: "image"; media: ContentMedia | null; alt: string; title?: string };

function runsOf(content: RichNode[]): InlineRun[] {
  return content.map((node) => {
    if (node.type === "hardBreak") return { kind: "break" } as const;
    if (node.type !== "text") return { kind: "break" } as const;
    const run: InlineRun = { kind: "text", text: node.text };
    for (const mark of node.marks) {
      if (mark.type === "link") {
        if (isSafeLinkHref(mark.href)) {
          run.href = mark.href;
          if (mark.target) run.target = mark.target;
        }
        continue;
      }
      if (mark.type === "bold") run.bold = true;
      else if (mark.type === "italic") run.italic = true;
      else if (mark.type === "code") run.code = true;
    }
    return run;
  });
}

function blocksOf(nodes: RichNode[], media: Map<string, ContentMedia>): RichBlock[] {
  return nodes.map((node) => {
    if (node.type === "paragraph")
      return { kind: "paragraph", ...(node.dir ? { dir: node.dir } : {}), runs: runsOf(node.content) };
    if (node.type === "heading")
      return {
        kind: "heading",
        level: node.level ?? 2,
        ...(node.dir ? { dir: node.dir } : {}),
        runs: runsOf(node.content),
      };
    if (node.type === "blockquote")
      return {
        kind: "blockquote",
        ...(node.dir ? { dir: node.dir } : {}),
        blocks: blocksOf(node.content, media),
      };
    if (node.type === "bulletList" || node.type === "orderedList")
      return {
        kind: "list",
        ordered: node.type === "orderedList",
        ...(node.start !== undefined ? { start: node.start } : {}),
        ...(node.listType ? { listType: node.listType } : {}),
        ...(node.dir ? { dir: node.dir } : {}),
        items: node.content.map((item) =>
          item.type === "listItem" ? blocksOf(item.content, media) : [],
        ),
      };
    if (node.type === "codeBlock")
      return {
        kind: "codeBlock",
        ...(node.dir ? { dir: node.dir } : {}),
        ...(node.language ? { language: node.language } : {}),
        text: node.content
          .map((child) => (child.type === "text" ? child.text : ""))
          .join(""),
      };
    if (node.type === "image") {
      const resolved = media.get(node.mediaId);
      return {
        kind: "image",
        // Only a server-provided, validated media entry may become an image src.
        media: resolved && isSafeCloudinaryUrl(resolved.url) ? resolved : null,
        alt: node.alt,
        ...(node.title ? { title: node.title } : {}),
      };
    }
    // listItem/hardBreak never appear at block level in a validated document.
    return { kind: "paragraph", runs: [] };
  });
}

/** Convert a validated document into an explicit, render-safe block model. */
export function buildRichBlocks(
  document: RichDocument,
  media: ContentMedia[],
): RichBlock[] {
  return blocksOf(document.content, new Map(media.map((item) => [item.id, item])));
}

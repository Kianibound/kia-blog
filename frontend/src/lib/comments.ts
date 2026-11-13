import "server-only";
import { loadApiBaseUrl } from "./session/config";
import { parsePublicComments, type PublicComment } from "./comments-contract";

export type ArticleCommentsResult =
  | { status: "success"; comments: PublicComment[] }
  | { status: "unavailable" };

/** Public, unauthenticated read of APPROVED comments for a published post. */
export async function loadArticleComments(
  postId: string,
): Promise<ArticleCommentsResult> {
  try {
    const response = await fetch(
      new URL(`/posts/${encodeURIComponent(postId)}/comments`, loadApiBaseUrl()),
      {
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!response.ok) return { status: "unavailable" };
    const comments = parsePublicComments(await response.json());
    return comments
      ? { status: "success", comments }
      : { status: "unavailable" };
  } catch {
    return { status: "unavailable" };
  }
}

import "server-only";
import type { ArticleRecord } from "../article-form-contract";
import { parseArticleDetail } from "../article-form-contract";
import type { PublicAccount } from "../auth/current-user";
import { UnauthenticatedError } from "../session/errors";
import { readAuthenticated } from "../session/server";
import { getEditorTaxonomy, type EditorTaxonomy } from "../taxonomy";

export type ArticleEditResult =
  | { status: "success"; article: ArticleRecord; taxonomy: EditorTaxonomy }
  | { status: "not-found" }
  | { status: "unauthenticated" }
  | { status: "unavailable" };

export async function loadArticleForEdit(
  account: PublicAccount,
  id: string,
): Promise<ArticleEditResult> {
  try {
    const result = await readAuthenticated(async ({ read }) => {
      const response = await read(`/posts/mine/${encodeURIComponent(id)}`);
      if (response.status === 404 || response.status === 403)
        return { status: "not-found" } as const;
      if (!response.ok) return { status: "unavailable" } as const;
      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        return { status: "unavailable" } as const;
      }
      try {
        const article = parseArticleDetail(payload);
        if (account.user.role !== "ADMIN" && article.authorId !== account.user.id)
          return { status: "not-found" } as const;
        return { status: "success", article } as const;
      } catch {
        return { status: "unavailable" } as const;
      }
    });
    if (!result || result.status !== "success")
      return result ?? { status: "unauthenticated" };
    const taxonomy = await getEditorTaxonomy();
    if (!taxonomy) return { status: "unavailable" };
    return { ...result, taxonomy };
  } catch (error) {
    return error instanceof UnauthenticatedError
      ? { status: "unauthenticated" }
      : { status: "unavailable" };
  }
}

export async function loadArticleTaxonomy(): Promise<EditorTaxonomy | null> {
  return getEditorTaxonomy();
}

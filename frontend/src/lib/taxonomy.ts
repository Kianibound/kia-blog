import "server-only";
import { cache } from "react";
import { getPublicCategories, type Category } from "./categories";
import { loadApiBaseUrl } from "./session/config";

export type EditorTaxonomy = {
  categories: Category[];
  tags: Category[];
};

async function getPublicTags(): Promise<Category[] | null> {
  try {
    const response = await fetch(new URL("/tags", loadApiBaseUrl()), {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
    });
    if (!response.ok) return null;
    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) return null;
    return payload.map((item: unknown) => {
      if (typeof item !== "object" || item === null || Array.isArray(item))
        throw new Error("Invalid tag");
      const tag = item as Record<string, unknown>;
      const { id, name, slug } = tag;
      if (
        typeof id !== "string" ||
        !id.trim() ||
        typeof name !== "string" ||
        !name.trim() ||
        typeof slug !== "string"
      )
        throw new Error("Invalid tag");
      return { id, name, slug };
    });
  } catch {
    return null;
  }
}

/** Deduplicated per request (metadata + page share one read). */
export const getEditorTaxonomy = cache(
  async (): Promise<EditorTaxonomy | null> => {
    const [categories, tags] = await Promise.all([
      getPublicCategories(),
      getPublicTags(),
    ]);
    if (!categories || !tags) return null;
    return { categories, tags };
  },
);

import Link from "next/link";
import { X } from "lucide-react";
import { messages } from "@/i18n/messages/fa";
import { postsHref, type PostsQuery } from "@/lib/posts-query";
import { getEditorTaxonomy } from "@/lib/taxonomy";
import { fa } from "@/lib/utils";

/**
 * Active category/tag filters as their own chips, each with its own clear
 * action. Selecting a category never activates search mode: the search
 * clear button only appears when a search query exists (see SearchForm).
 */
export async function ActiveFilters({ query }: { query: PostsQuery }) {
  if (!query.category && !query.tag) return null;

  const taxonomy = await getEditorTaxonomy();
  const categoryName =
    taxonomy?.categories.find((item) => item.slug === query.category)?.name ??
    query.category;
  const tagName =
    taxonomy?.tags.find((item) => item.slug === query.tag)?.name ?? query.tag;

  const chipClass =
    "inline-flex min-h-12 items-center gap-2 rounded-control border border-border bg-card px-4 font-semibold hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring";

  return (
    <ul aria-label={messages.search.form} className="flex flex-wrap items-center gap-4">
      {query.category && (
        <li>
          <Link
            href={postsHref({ ...query, category: undefined, page: 1 })}
            aria-label={messages.search.removeCategory}
            className={chipClass}
          >
            {fa(categoryName ?? "")}
            <X aria-hidden="true" className="size-4" strokeWidth={2} />
          </Link>
        </li>
      )}
      {query.tag && (
        <li>
          <Link
            href={postsHref({ ...query, tag: undefined, page: 1 })}
            aria-label={messages.search.removeTag}
            className={chipClass}
          >
            {fa(tagName ?? "")}
            <X aria-hidden="true" className="size-4" strokeWidth={2} />
          </Link>
        </li>
      )}
    </ul>
  );
}

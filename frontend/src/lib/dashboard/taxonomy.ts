import "server-only";
import type { PublicAccount } from "../auth/current-user";
import { getEditorTaxonomy } from "../taxonomy";
import {
  isTaxonomyKind,
  type TaxonomyKind,
  type TaxonomyRecord,
} from "../taxonomy-contract";

export type AdminTaxonomyResult =
  | { status: "success"; items: TaxonomyRecord[] }
  | { status: "forbidden" }
  | { status: "unavailable" };

/**
 * Taxonomy lists are public Nest reads (no session), already fetched with
 * `cache: "no-store"` so the article editor always sees fresh categories/tags.
 */
export async function loadAdminTaxonomy(
  kind: TaxonomyKind,
  account: PublicAccount,
): Promise<AdminTaxonomyResult> {
  if (account.user.role !== "ADMIN") return { status: "forbidden" };
  if (!isTaxonomyKind(kind)) return { status: "unavailable" };
  const taxonomy = await getEditorTaxonomy();
  if (!taxonomy) return { status: "unavailable" };
  const items =
    kind === "categories" ? taxonomy.categories : taxonomy.tags;
  return {
    status: "success",
    items: items.map(({ id, name, slug }) => ({ id, name, slug })),
  };
}

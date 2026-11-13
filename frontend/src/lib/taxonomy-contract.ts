/** Pure contract helpers for the live Nest category and tag endpoints. */

export type TaxonomyKind = "categories" | "tags";

export type TaxonomyRecord = { id: string; name: string; slug: string };

export type TaxonomyFailureReason =
  | "duplicate"
  | "in-use"
  | "validation"
  | "unauthorized"
  | "forbidden"
  | "not-found"
  | "unavailable"
  | "protocol";

export type TaxonomyMutationOutcome =
  | { state: "success"; item?: TaxonomyRecord }
  | { state: "failure"; reason: TaxonomyFailureReason }
  | { state: "csrf" }
  | { state: "uncertain" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isTaxonomyKind(value: unknown): value is TaxonomyKind {
  return value === "categories" || value === "tags";
}

/** Nest allows an empty generated slug for names without Latin characters. */
export function parseTaxonomyRecord(value: unknown): TaxonomyRecord | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== "string" ||
    !value.id.trim() ||
    typeof value.name !== "string" ||
    !value.name.trim() ||
    typeof value.slug !== "string"
  )
    return null;
  return { id: value.id, name: value.name, slug: value.slug };
}

export function parseTaxonomyList(value: unknown): TaxonomyRecord[] | null {
  if (!Array.isArray(value)) return null;
  const items: TaxonomyRecord[] = [];
  for (const entry of value) {
    const item = parseTaxonomyRecord(entry);
    if (!item) return null;
    items.push(item);
  }
  return items;
}

/** Nest trims surrounding whitespace and rejects a blank name. */
export function taxonomyNameError(name: unknown): "required" | null {
  if (typeof name !== "string" || !name.trim()) return "required";
  return null;
}

export function taxonomyPath(kind: TaxonomyKind): string {
  return kind === "categories" ? "/categories" : "/tags";
}

/** POST status mapping; 409 is a duplicate name or generated-slug collision. */
export function createTaxonomyFailure(status: number): TaxonomyFailureReason {
  if (status === 409) return "duplicate";
  if (status === 400 || status === 422) return "validation";
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "not-found";
  if (status >= 500) return "unavailable";
  return "protocol";
}

/** DELETE status mapping; 409 means referenced by a post or a retryable race. */
export function deleteTaxonomyFailure(status: number): TaxonomyFailureReason {
  if (status === 409) return "in-use";
  if (status === 404) return "not-found";
  if (status === 400 || status === 422) return "validation";
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status >= 500) return "unavailable";
  return "protocol";
}

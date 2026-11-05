"use server";

import { readFixtureIdentity } from "./identity";
import { parseArticleTaxonomy } from "@/lib/article-form-contract";
import type { TaxonomyKind, TaxonomyCreateResult, TaxonomyDeleteResult } from "@/components/dashboard/admin-taxonomy";

// Test-only taxonomy writes. No production API or deletion policy is defined here.
export async function createFixtureTaxonomy(kind: TaxonomyKind, name: string): Promise<TaxonomyCreateResult> {
  if ((await readFixtureIdentity())?.role !== "ADMIN" || (kind !== "categories" && kind !== "tags") || typeof name !== "string" || !name.trim()) return { state: "error" };
  try {
    const response = await fetch(`http://127.0.0.1:4101/dashboard-taxonomies/${kind}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim() }), cache: "no-store", signal: AbortSignal.timeout(2500) });
    if (response.status === 409) return { state: "duplicate" };
    if (response.status === 201) return { state: "created", item: parseArticleTaxonomy([await response.json()])[0] };
    return { state: response.status >= 400 && response.status < 500 ? "error" : "uncertain" };
  } catch { return { state: "uncertain" }; }
}

export async function deleteFixtureTaxonomy(kind: TaxonomyKind, id: string): Promise<TaxonomyDeleteResult> {
  if ((await readFixtureIdentity())?.role !== "ADMIN" || (kind !== "categories" && kind !== "tags") || typeof id !== "string" || !id.trim()) return "error";
  try {
    const response = await fetch(`http://127.0.0.1:4101/dashboard-taxonomies/${kind}/${encodeURIComponent(id)}`, { method: "DELETE", cache: "no-store", signal: AbortSignal.timeout(2500) });
    if (response.status === 204) return "deleted";
    if (response.status === 409) return "in-use";
    return response.status >= 400 && response.status < 500 ? "error" : "uncertain";
  } catch { return "uncertain"; }
}

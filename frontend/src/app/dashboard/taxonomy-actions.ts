"use server";

import { headers } from "next/headers";
import {
  createTaxonomyFailure,
  deleteTaxonomyFailure,
  isTaxonomyKind,
  parseTaxonomyRecord,
  taxonomyNameError,
  taxonomyPath,
  type TaxonomyKind,
  type TaxonomyMutationOutcome,
} from "@/lib/taxonomy-contract";
import { CsrfError, handleAuthenticatedMutation } from "@/lib/session/server";

async function mutationRequest(csrfToken: string): Promise<Request> {
  const requestHeaders = await headers();
  return new Request("http://session.internal/taxonomy", {
    method: "POST",
    headers: {
      origin: requestHeaders.get("origin") ?? "",
      "x-csrf-token": csrfToken,
    },
  });
}

function errorOutcome(error: unknown): TaxonomyMutationOutcome {
  return error instanceof CsrfError ? { state: "csrf" } : { state: "uncertain" };
}

/** ADMIN-only on Nest; the name is trimmed exactly like the backend does. */
export async function createTaxonomyAction(
  kind: TaxonomyKind,
  name: string,
  csrfToken: string,
): Promise<TaxonomyMutationOutcome> {
  if (!isTaxonomyKind(kind) || taxonomyNameError(name))
    return { state: "failure", reason: "validation" };
  try {
    const response = await handleAuthenticatedMutation(
      await mutationRequest(csrfToken),
      ({ mutate }) =>
        mutate(taxonomyPath(kind), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim() }),
        }),
    );
    if (response.status >= 500) return { state: "uncertain" };
    if (!response.ok)
      return {
        state: "failure",
        reason: createTaxonomyFailure(response.status),
      };
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      return { state: "uncertain" };
    }
    const item = parseTaxonomyRecord(payload);
    return item ? { state: "success", item } : { state: "uncertain" };
  } catch (error) {
    return errorOutcome(error);
  }
}

/** DELETE /categories/:id or /tags/:id; 409 means still referenced by posts. */
export async function deleteTaxonomyAction(
  kind: TaxonomyKind,
  id: string,
  csrfToken: string,
): Promise<TaxonomyMutationOutcome> {
  if (!isTaxonomyKind(kind) || typeof id !== "string" || !id.trim())
    return { state: "failure", reason: "validation" };
  try {
    const response = await handleAuthenticatedMutation(
      await mutationRequest(csrfToken),
      ({ mutate }) =>
        mutate(`${taxonomyPath(kind)}/${encodeURIComponent(id)}`, {
          method: "DELETE",
        }),
    );
    if (response.status >= 500) return { state: "uncertain" };
    if (!response.ok)
      return {
        state: "failure",
        reason: deleteTaxonomyFailure(response.status),
      };
    // Nest answers 200 with a message body; success is the status, not the body.
    return { state: "success" };
  } catch (error) {
    return errorOutcome(error);
  }
}

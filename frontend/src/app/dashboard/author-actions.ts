"use server";

import { headers } from "next/headers";
import {
  createAuthorFailure,
  deactivateAuthorFailure,
  parseAdminAuthor,
  type AuthorMutationOutcome,
} from "@/lib/admin-authors-contract";
import { validateAuthorCreateInput, type AuthorCreateInput } from "@/lib/author-form-contract";
import { CsrfError, handleAuthenticatedMutation } from "@/lib/session/server";

async function mutationRequest(csrfToken: string): Promise<Request> {
  const requestHeaders = await headers();
  return new Request("http://session.internal/admin-authors", {
    method: "POST",
    headers: {
      origin: requestHeaders.get("origin") ?? "",
      "x-csrf-token": csrfToken,
    },
  });
}

function errorOutcome(error: unknown): AuthorMutationOutcome {
  return error instanceof CsrfError
    ? { state: "csrf" }
    : { state: "uncertain" };
}

function successOutcome(
  payload: unknown,
  requireDisabled: boolean,
): AuthorMutationOutcome {
  const author = parseAdminAuthor(payload);
  if (!author || (requireDisabled && !author.disabledAt))
    return { state: "uncertain" };
  return { state: "success", author };
}

/** ADMIN-only on Nest; the initial password is sent once and never returned. */
export async function createAuthorAction(
  input: AuthorCreateInput,
  csrfToken: string,
): Promise<AuthorMutationOutcome> {
  if (Object.keys(validateAuthorCreateInput(input)).length > 0)
    return { state: "failure", reason: "validation" };
  try {
    const response = await handleAuthenticatedMutation(
      await mutationRequest(csrfToken),
      ({ mutate }) =>
        mutate("/admin/authors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: input.name.trim(),
            email: input.email.trim(),
            password: input.password,
          }),
        }),
    );
    if (response.status >= 500) return { state: "uncertain" };
    if (!response.ok)
      return { state: "failure", reason: createAuthorFailure(response.status) };
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      return { state: "uncertain" };
    }
    return successOutcome(payload, false);
  } catch (error) {
    return errorOutcome(error);
  }
}

/** PATCH /admin/authors/:id/deactivate; no content or account is deleted. */
export async function deactivateAuthorAction(
  id: string,
  csrfToken: string,
): Promise<AuthorMutationOutcome> {
  if (typeof id !== "string" || !id.trim())
    return { state: "failure", reason: "validation" };
  try {
    const response = await handleAuthenticatedMutation(
      await mutationRequest(csrfToken),
      ({ mutate }) =>
        mutate(`/admin/authors/${encodeURIComponent(id)}/deactivate`, {
          method: "PATCH",
        }),
    );
    if (response.status >= 500) return { state: "uncertain" };
    if (!response.ok)
      return {
        state: "failure",
        reason: deactivateAuthorFailure(response.status),
      };
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      return { state: "uncertain" };
    }
    return successOutcome(payload, true);
  } catch (error) {
    return errorOutcome(error);
  }
}

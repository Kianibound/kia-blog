"use server";

import { validateAuthorInput, type AuthorInput } from "@/lib/author-form-contract";
import type { AuthorCreateResult } from "@/components/dashboard/author-create-form";
import { readFixtureIdentity } from "./identity";

// Test-only account write. This path is not a production API contract.
export async function createFixtureAuthor(input: AuthorInput): Promise<AuthorCreateResult> {
  if ((await readFixtureIdentity())?.role !== "ADMIN") return "error";
  if (!input || typeof input.name !== "string" || typeof input.email !== "string" || Object.keys(validateAuthorInput(input)).length) return "error";
  try {
    const response = await fetch("http://127.0.0.1:4101/dashboard-authors", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: input.name.trim(), email: input.email.trim() }),
      cache: "no-store", signal: AbortSignal.timeout(2500),
    });
    if (response.status === 409) return "duplicate";
    if (response.status === 201) return "created";
    return response.status >= 400 && response.status < 500 ? "error" : "uncertain";
  } catch { return "uncertain"; }
}

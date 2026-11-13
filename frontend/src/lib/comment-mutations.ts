import "server-only";
import { headers } from "next/headers";
import {
  commentFailure,
  type CommentMutationOutcome,
} from "./comments-contract";
import { CsrfError, handleAuthenticatedMutation } from "./session/server";

type CommentMutationInput<T> = {
  csrfToken: string;
  method: "POST" | "PATCH" | "DELETE";
  path: string;
  body?: Record<string, unknown>;
  parse?: (payload: unknown) => T | null;
};

/**
 * Single CSRF/Origin-checked write path for comment actions. Any non-2xx
 * answer is classified; a thrown or unreadable answer is uncertain.
 */
export async function runCommentMutation<T = never>({
  csrfToken,
  method,
  path,
  body,
  parse,
}: CommentMutationInput<T>): Promise<CommentMutationOutcome<T>> {
  try {
    const requestHeaders = await headers();
    const request = new Request("http://session.internal/comments", {
      method: "POST",
      headers: {
        origin: requestHeaders.get("origin") ?? "",
        "x-csrf-token": csrfToken,
      },
    });
    const response = await handleAuthenticatedMutation(request, ({ mutate }) =>
      mutate(path, {
        method,
        ...(body === undefined
          ? {}
          : {
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            }),
      }),
    );
    if (response.status >= 500) return { state: "uncertain" };
    if (!response.ok)
      return { state: "failure", reason: commentFailure(response.status) };
    if (!parse) return { state: "success" };
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      return { state: "uncertain" };
    }
    const value = parse(payload);
    return value ? { state: "success", value } : { state: "uncertain" };
  } catch (error) {
    return error instanceof CsrfError ? { state: "csrf" } : { state: "uncertain" };
  }
}

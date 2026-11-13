import { assertSameOrigin, isSafeMethod } from "./csrf.ts";
import { CsrfError, UnauthenticatedError } from "./errors.ts";
import type { MutationRequestInit, SessionService } from "./service.ts";

export type MutationRequest = {
  method: string;
  headers: { get(name: string): string | null };
};

export type MutationGuardDeps = {
  expectedOrigin: string;
  readSessionId: () => Promise<string | null>;
  service: Pick<SessionService, "assertCsrf" | "authorizedMutation">;
  clearCookie: () => Promise<void>;
};

export type AuthorizedMutationContext = {
  sessionId: string;
  mutate(
    path: string,
    init?: Omit<MutationRequestInit, "origin" | "csrfToken">,
  ): Promise<Response>;
};

/**
 * The only supported path for cookie-authenticated mutations. Origin and the
 * per-session CSRF token are verified before the handler runs; safe methods are
 * rejected so callers cannot accidentally use this as a read helper.
 */
export async function handleMutationRequest(
  request: MutationRequest,
  deps: MutationGuardDeps,
  perform: (context: AuthorizedMutationContext) => Promise<Response>,
): Promise<Response> {
  try {
    if (isSafeMethod(request.method)) throw new CsrfError();
    const origin = request.headers.get("origin");
    assertSameOrigin(origin, deps.expectedOrigin);

    const sessionId = await deps.readSessionId();
    if (!sessionId) throw new UnauthenticatedError();
    const csrfToken = request.headers.get("x-csrf-token");
    await deps.service.assertCsrf(sessionId, csrfToken);

    const mutate = (
      path: string,
      init: Omit<MutationRequestInit, "origin" | "csrfToken"> = {},
    ) =>
      deps.service.authorizedMutation(sessionId, path, {
        ...init,
        origin,
        csrfToken,
      });

    return await perform({ sessionId, mutate });
  } catch (error) {
    // Terminal authentication failure must not leave the browser cookie behind.
    if (error instanceof UnauthenticatedError) {
      try {
        await deps.clearCookie();
      } catch {
        // Preserve the original terminal-authentication error.
      }
    }
    throw error;
  }
}

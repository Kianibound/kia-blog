import { UnauthenticatedError } from "./errors.ts";

export type AuthenticatedReadDeps = {
  readSessionId(): Promise<string | null>;
  authedFetch(sessionId: string, path: string, init?: RequestInit): Promise<Response>;
  getCsrfToken(sessionId: string): Promise<string>;
  clearCookie(): Promise<void>;
};

export type AuthorizedReadContext = {
  sessionId: string;
  read(path: string, init?: RequestInit): Promise<Response>;
  getCsrfToken(): Promise<string>;
};

/** Terminal authentication failures clear the cookie before surfacing. */
export async function handleReadRequest<T>(
  deps: AuthenticatedReadDeps,
  perform: (context: AuthorizedReadContext) => Promise<T>,
): Promise<T | null> {
  const sessionId = await deps.readSessionId();
  if (!sessionId) return null;
  try {
    return await perform({
      sessionId,
      read: (path, init) => deps.authedFetch(sessionId, path, init),
      getCsrfToken: () => deps.getCsrfToken(sessionId),
    });
  } catch (error) {
    if (error instanceof UnauthenticatedError) await deps.clearCookie();
    throw error;
  }
}

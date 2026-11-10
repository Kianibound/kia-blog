import "server-only";

/**
 * Server-only boundary for the session foundation. Route handlers and server
 * actions must import from here (or `request.ts`), never from the internal
 * modules directly.
 */
export {
  createBrowserSession,
  clearBrowserSession,
  getSessionConfig,
  handleAuthenticatedMutation,
  handleLogoutMutation,
  readBrowserSessionId,
} from "./request.ts";
export type { AuthorizedMutationContext } from "./mutation-handler.ts";
export type { MutationRequestInit } from "./service.ts";
export { CsrfError, UnauthenticatedError } from "./errors.ts";

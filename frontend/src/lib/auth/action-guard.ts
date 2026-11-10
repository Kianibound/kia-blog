import { assertSameOrigin } from "../session/csrf.ts";
import { CsrfError } from "../session/errors.ts";
import { verifyAuthCsrfToken } from "./csrf-token.ts";

export type TrustedMutationInput = {
  origin: string | null;
  expectedOrigin: string;
  csrfToken: unknown;
  csrfSecret: Buffer;
  now?: number;
};

/** Origin plus a signed, expiring CSRF token; both must pass. */
export function assertTrustedMutation(input: TrustedMutationInput): void {
  assertSameOrigin(input.origin, input.expectedOrigin);
  if (
    !verifyAuthCsrfToken(
      input.csrfSecret,
      input.csrfToken,
      input.now ?? Math.floor(Date.now() / 1000),
    )
  )
    throw new CsrfError();
}

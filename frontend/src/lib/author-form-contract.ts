import { validatePasswordStrength } from "./registration-validation.ts";

export type AuthorInput = { name: string; email: string };
export type AuthorInputErrors = { name?: "required"; email?: "required" | "format" };

export type AuthorCreateInput = { name: string; email: string; password: string };
export type AuthorCreateInputErrors = {
  name?: "required";
  email?: "required" | "format";
  password?: string;
};

const EMAIL = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;

export function validateAuthorInput(input: AuthorInput): AuthorInputErrors {
  const errors: AuthorInputErrors = {};
  if (!input.name.trim()) errors.name = "required";
  if (!input.email.trim()) errors.email = "required";
  else if (!EMAIL.test(input.email.trim())) errors.email = "format";
  return errors;
}

/** Initial-password form validation; the password is never stored or echoed. */
export function validateAuthorCreateInput(
  input: AuthorCreateInput,
): AuthorCreateInputErrors {
  const errors: AuthorCreateInputErrors = validateAuthorInput(input);
  const password = validatePasswordStrength(input.password);
  if (password) errors.password = password;
  return errors;
}

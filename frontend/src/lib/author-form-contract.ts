export type AuthorInput = { name: string; email: string };
export type AuthorInputErrors = { name?: "required"; email?: "required" | "format" };

export function validateAuthorInput(input: AuthorInput): AuthorInputErrors {
  const errors: AuthorInputErrors = {};
  if (!input.name.trim()) errors.name = "required";
  if (!input.email.trim()) errors.email = "required";
  else if (!/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(input.email.trim())) errors.email = "format";
  return errors;
}

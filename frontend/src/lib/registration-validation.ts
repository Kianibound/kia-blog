// Shared form/fixture validation only; this does not authenticate or store passwords.
export function validatePasswordCharacters(password: unknown): string {
  if (typeof password !== "string" || !password) return "گذرواژه را وارد کنید.";
  if (!/^[\x21-\x7e]+$/.test(password)) return "گذرواژه فقط می‌تواند شامل حروف انگلیسی، رقم و نمادهای انگلیسی باشد؛ فاصله و نویسه‌های فارسی یا غیرانگلیسی مجاز نیستند.";
  return "";
}

/** Mirrors the Nest registration password policy for every password write. */
export function validatePasswordStrength(password: unknown): string {
  const characters = validatePasswordCharacters(password);
  if (characters || typeof password !== "string") return characters;
  if (password.length < 8) return "گذرواژه باید دست‌کم ۸ نویسه داشته باشد.";
  if (!/[A-Za-z]/.test(password)) return "گذرواژه باید دست‌کم یک حرف انگلیسی داشته باشد.";
  if (!/[0-9]/.test(password)) return "گذرواژه باید دست‌کم یک رقم انگلیسی داشته باشد.";
  if (!/[^A-Za-z0-9]/.test(password)) return "گذرواژه باید دست‌کم یک نماد مانند ! یا @ داشته باشد.";
  return "";
}

export function validateRegistrationPasswords(password: unknown, confirmation: unknown) {
  const error = validatePasswordStrength(password);
  return {
    password: error,
    confirmPassword: typeof confirmation !== "string" || !confirmation ? "تکرار گذرواژه را وارد کنید." : confirmation !== password ? "تکرار گذرواژه باید دقیقاً با گذرواژه یکسان باشد." : "",
  };
}

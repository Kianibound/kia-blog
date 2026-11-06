// Shared form/fixture validation only; this does not authenticate or store passwords.
export function validatePasswordCharacters(password: unknown): string {
  if (typeof password !== "string" || !password) return "گذرواژه را وارد کنید.";
  if (!/^[\x21-\x7e]+$/.test(password)) return "گذرواژه فقط می‌تواند شامل حروف انگلیسی، رقم و نمادهای انگلیسی باشد؛ فاصله و نویسه‌های فارسی یا غیرانگلیسی مجاز نیستند.";
  return "";
}

export function validateRegistrationPasswords(password: unknown, confirmation: unknown) {
  let error = validatePasswordCharacters(password);
  if (!error && typeof password === "string") {
    if (password.length < 8) error = "گذرواژه باید دست‌کم ۸ نویسه داشته باشد.";
    else if (!/[A-Za-z]/.test(password)) error = "گذرواژه باید دست‌کم یک حرف انگلیسی داشته باشد.";
    else if (!/[0-9]/.test(password)) error = "گذرواژه باید دست‌کم یک رقم انگلیسی داشته باشد.";
    else if (!/[^A-Za-z0-9]/.test(password)) error = "گذرواژه باید دست‌کم یک نماد مانند ! یا @ داشته باشد.";
  }
  return {
    password: error,
    confirmPassword: typeof confirmation !== "string" || !confirmation ? "تکرار گذرواژه را وارد کنید." : confirmation !== password ? "تکرار گذرواژه باید دقیقاً با گذرواژه یکسان باشد." : "",
  };
}

export type AuthField = "email" | "password" | "confirmPassword";

export type AuthFormState = {
  status: "idle" | "error";
  message: string;
  field?: AuthField;
};

export const initialAuthFormState: AuthFormState = {
  status: "idle",
  message: "",
};

export function validateEmailValue(value: unknown): string {
  const email = typeof value === "string" ? value.trim() : "";
  if (!email) return "ایمیل را وارد کنید.";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ? ""
    : "یک ایمیل معتبر وارد کنید.";
}

export function authFailureMessage(
  kind:
    | "invalid-credentials"
    | "duplicate-email"
    | "rate-limit"
    | "validation"
    | "unavailable"
    | "uncertain"
    | "protocol",
  operation: "login" | "register",
): string {
  switch (kind) {
    case "invalid-credentials":
      return "ایمیل یا گذرواژه نادرست است.";
    case "duplicate-email":
      return "حسابی با این ایمیل از قبل وجود دارد. وارد شوید.";
    case "rate-limit":
      return "تلاش‌های بیش از حد. کمی بعد دوباره امتحان کنید.";
    case "validation":
      return "اطلاعات واردشده معتبر نیست. فیلدها را بازبینی کنید.";
    case "uncertain":
      return operation === "register"
        ? "نتیجهٔ ثبت‌نام مشخص نیست. پیش از تلاش دوباره، با ورود به حساب وضعیت را بررسی کنید."
        : "پاسخ سرور دریافت نشد. وضعیت ورود مشخص نیست؛ دوباره تلاش کنید.";
    case "unavailable":
      return "سرویس ورود در حال حاضر در دسترس نیست. دوباره تلاش کنید.";
    case "protocol":
      return "پاسخ نامعتبر از سرور دریافت شد. دوباره تلاش کنید.";
  }
}

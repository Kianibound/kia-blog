"use client";

import Link from "next/link";
import { useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { validatePasswordCharacters, validateRegistrationPasswords } from "@/lib/registration-validation";

export type AuthChoice = { operation: "login" | "register"; provider: "email" | "google" | "github"; role: "USER" | "AUTHOR"; password?: string; confirmPassword?: string };
export type SimulateAuth = (choice: AuthChoice) => Promise<boolean>;

export function AuthScreen({ registration = false, simulate }: { registration?: boolean; simulate?: SimulateAuth }) {
  const router = useRouter();
  // Native form submission must stay unavailable before the client handler exists.
  const hydrated = useSyncExternalStore(() => () => {}, () => true, () => false);
  const locked = useRef(false);
  const [role, setRole] = useState<"USER" | "AUTHOR">("USER");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({ email: "", password: "", confirmPassword: "" });
  const title = registration ? "ثبت‌نام" : "ورود";

  async function submit(provider: AuthChoice["provider"], passwords?: { password: string; confirmPassword: string }) {
    if (!simulate || locked.current) return;
    locked.current = true;
    setPending(true);
    setError("");
    try {
      const ok = await simulate({ operation: registration ? "register" : "login", provider, role: registration ? "USER" : role, ...(registration && provider === "email" ? passwords : {}) });
      if (ok) { router.push("/"); router.refresh(); }
      else setError("شبیه‌سازی انجام نشد. دوباره تلاش کنید.");
    } catch { setError("ارتباط با پیش‌نمایش برقرار نشد. دوباره تلاش کنید."); }
    finally { locked.current = false; setPending(false); }
  }

  return <Card className="mx-auto w-full max-w-md">
    <CardHeader><h1 className="text-2xl font-bold">{title}</h1></CardHeader>
    <CardContent className="space-y-6">
      <p>{simulate ? "این فرم فقط شبیه‌سازی آزمایشی است؛ از اطلاعات واقعی استفاده نکنید. ورود با گوگل و گیت‌هاب به سرویس خارجی متصل نمی‌شود." : "ورود و ثبت‌نام هنوز فعال نیست. اتصال امن حساب‌ها در مرحلهٔ بعد فراهم می‌شود."}</p>
      {registration ? <p>ثبت‌نام فقط برای حساب کاربر است.</p> : <p>انتخاب نوع ورود، دسترسی یا نقش حساب را تغییر نمی‌دهد.</p>}
      <form noValidate onSubmit={event => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const email = String(data.get("email") ?? "").trim();
        const password = String(data.get("password") ?? "");
        const confirmPassword = String(data.get("confirmPassword") ?? "");
        const next = { email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "" : "یک ایمیل معتبر وارد کنید.", ...(registration ? validateRegistrationPasswords(password, confirmPassword) : { password: validatePasswordCharacters(password), confirmPassword: "" }) };
        setErrors(next);
        if (next.email || next.password || next.confirmPassword) { event.currentTarget.querySelector<HTMLInputElement>(next.email ? "#auth-email" : next.password ? "#auth-password" : "#auth-confirm-password")?.focus(); return; }
        void submit("email", { password, confirmPassword });
      }} className="space-y-4">
        <fieldset disabled={!hydrated || pending || !simulate} className="min-w-0 space-y-4">
          {!registration && <fieldset className="flex flex-wrap gap-4">
            <legend className="mb-2 font-medium">نوع ورود</legend>
            {([ ["USER", "کاربر"], ["AUTHOR", "نویسنده"] ] as const).map(([value, label]) => <label key={value} className="flex min-h-12 items-center gap-2"><input type="radio" name="role" value={value} checked={role === value} onChange={() => setRole(value)} />{label}</label>)}
          </fieldset>}
          <Field label="ایمیل" htmlFor="auth-email"><Input id="auth-email" name="email" type="email" dir="ltr" autoComplete="email" className="min-h-12" aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined} /><p id="email-error" className="text-sm text-destructive">{errors.email}</p></Field>
          <Field label="گذرواژه" htmlFor="auth-password"><Input id="auth-password" name="password" type="password" autoComplete={registration ? "new-password" : "current-password"} className="min-h-12" aria-invalid={!!errors.password} aria-describedby={errors.password ? "password-error" : registration ? "password-hint" : undefined} />{registration && <p id="password-hint" className="text-sm text-muted-foreground">دست‌کم ۸ نویسه، شامل حرف انگلیسی، رقم انگلیسی و نماد؛ بدون فاصله یا نویسهٔ فارسی و غیرانگلیسی.</p>}<p id="password-error" className="text-sm text-destructive">{errors.password}</p></Field>
          {registration && <Field label="تکرار گذرواژه" htmlFor="auth-confirm-password"><Input id="auth-confirm-password" name="confirmPassword" type="password" autoComplete="new-password" className="min-h-12" aria-invalid={!!errors.confirmPassword} aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined} /><p id="confirm-password-error" className="text-sm text-destructive">{errors.confirmPassword}</p></Field>}
          <Button type="submit" size="lg" className="w-full">{title} با ایمیل</Button>
          <div className="grid gap-4 sm:grid-cols-2">
            <Button size="lg" variant="outline" onClick={() => void submit("google")}>{title} با گوگل</Button>
            <Button size="lg" variant="outline" onClick={() => void submit("github")}>{title} با گیت‌هاب</Button>
          </div>
        </fieldset>
      </form>
      <div className="min-h-12" aria-live="polite" aria-atomic="true">{pending && <p role="status">در حال شبیه‌سازی…</p>}{error && <p role="alert" className="text-destructive">{error}</p>}</div>
      <Link href={registration ? "/login" : "/register"} className="inline-flex min-h-12 items-center rounded-control px-4 underline focus-visible:outline-2 focus-visible:outline-ring">{registration ? "ورود" : "ثبت‌نام"}</Link>
    </CardContent>
  </Card>;
}

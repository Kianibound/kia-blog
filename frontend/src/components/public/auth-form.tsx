"use client";

import Link from "next/link";
import { useActionState, useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { oauthMessages } from "@/i18n/messages/oauth.fa";
import {
  initialAuthFormState,
  validateEmailValue,
  type AuthFormState,
} from "@/lib/auth/form-state";
import {
  validatePasswordCharacters,
  validateRegistrationPasswords,
} from "@/lib/registration-validation";

type AuthAction = (
  state: AuthFormState,
  formData: FormData,
) => Promise<AuthFormState>;

type Props = {
  mode: "login" | "register";
  action: AuthAction;
  csrfToken: string;
  next?: string;
  notice?: string;
  available?: boolean;
};

export function AuthForm({
  mode,
  action,
  csrfToken,
  next = "/",
  notice,
  available = true,
}: Props) {
  const registration = mode === "register";
  const title = registration ? "ثبت‌نام" : "ورود";
  const [state, formAction, pending] = useActionState(
    action,
    initialAuthFormState,
  );
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const serverField = state.status === "error" ? state.field : undefined;
  const emailError =
    errors.email || (serverField === "email" ? state.message : "");
  const passwordError =
    errors.password || (serverField === "password" ? state.message : "");
  const confirmPasswordError =
    errors.confirmPassword ||
    (serverField === "confirmPassword" ? state.message : "");

  useEffect(() => {
    const field = state.status === "error" ? state.field : undefined;
    if (!field) return;
    const id =
      field === "email"
        ? "auth-email"
        : field === "password"
          ? "auth-password"
          : "auth-confirm-password";
    document.getElementById(id)?.focus();
  }, [state]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const confirmPassword = String(data.get("confirmPassword") ?? "");
    const nextErrors = {
      email: validateEmailValue(email),
      ...(registration
        ? validateRegistrationPasswords(password, confirmPassword)
        : { password: validatePasswordCharacters(password), confirmPassword: "" }),
    };
    setErrors(nextErrors);
    if (
      nextErrors.email ||
      nextErrors.password ||
      nextErrors.confirmPassword
    ) {
      event.preventDefault();
      const selector = nextErrors.email
        ? "#auth-email"
        : nextErrors.password
          ? "#auth-password"
          : "#auth-confirm-password";
      event.currentTarget.querySelector<HTMLInputElement>(selector)?.focus();
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <h1 className="text-2xl font-bold">{title}</h1>
      </CardHeader>
      <CardContent className="space-y-6">
        {registration ? (
          <p>ثبت‌نام فقط برای حساب کاربر است؛ نقش حساب را سرویس انتخاب می‌کند.</p>
        ) : (
          <p>با ایمیل و گذرواژهٔ حساب خود وارد شوید.</p>
        )}

        {notice && (
          <p role="status" className="rounded-surface bg-secondary p-4 text-sm">
            {notice}
          </p>
        )}

        {!available && (
          <p role="alert" className="text-sm text-destructive">
            فرم امن در حال حاضر در دسترس نیست. تنظیمات سرور را بررسی کنید.
          </p>
        )}

        <form
          noValidate
          action={formAction}
          onSubmit={onSubmit}
          className="space-y-4"
        >
          <input type="hidden" name="csrfToken" value={csrfToken} />
          <input type="hidden" name="next" value={next} />

          <Field label="ایمیل" htmlFor="auth-email">
            <Input
              id="auth-email"
              name="email"
              type="email"
              dir="ltr"
              autoComplete="email"
              className="min-h-12"
              aria-invalid={!!emailError}
              aria-describedby={emailError ? "email-error" : undefined}
            />
            <p id="email-error" className="text-sm text-destructive">
              {emailError}
            </p>
          </Field>

          <Field label="گذرواژه" htmlFor="auth-password">
            <Input
              id="auth-password"
              name="password"
              type="password"
              autoComplete={registration ? "new-password" : "current-password"}
              className="min-h-12"
              aria-invalid={!!passwordError}
              aria-describedby={
                passwordError
                  ? "password-error"
                  : registration
                    ? "password-hint"
                    : undefined
              }
            />
            {registration && (
              <p id="password-hint" className="text-sm text-muted-foreground">
                دست‌کم ۸ نویسه، شامل حرف انگلیسی، رقم انگلیسی و نماد؛ بدون فاصله
                یا نویسهٔ فارسی و غیرانگلیسی.
              </p>
            )}
            <p id="password-error" className="text-sm text-destructive">
              {passwordError}
            </p>
          </Field>

          {registration && (
            <Field label="تکرار گذرواژه" htmlFor="auth-confirm-password">
              <Input
                id="auth-confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                className="min-h-12"
                aria-invalid={!!confirmPasswordError}
                aria-describedby={
                  confirmPasswordError
                    ? "confirm-password-error"
                    : undefined
                }
              />
              <p id="confirm-password-error" className="text-sm text-destructive">
                {confirmPasswordError}
              </p>
            </Field>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={!available || pending}
          >
            {pending
              ? registration
                ? "در حال ثبت‌نام…"
                : "در حال ورود…"
              : `${title} با ایمیل`}
          </Button>
        </form>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/auth/google"
            className="inline-flex min-h-12 items-center justify-center rounded-control border border-border px-4 font-semibold hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            {title} با {oauthMessages.providers.google}
          </Link>
          <Link
            href="/auth/github"
            className="inline-flex min-h-12 items-center justify-center rounded-control border border-border px-4 font-semibold hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            {title} با {oauthMessages.providers.github}
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">{oauthMessages.help}</p>

        <div className="min-h-12" aria-live="polite" aria-atomic="true">
          {state.status === "error" && !state.field && (
            <p role="alert" className="text-destructive">
              {state.message}
            </p>
          )}
        </div>

        <Link
          href={registration ? "/login" : "/register"}
          className="inline-flex min-h-12 items-center rounded-control px-4 underline focus-visible:outline-2 focus-visible:outline-ring"
        >
          {registration ? "ورود" : "ثبت‌نام"}
        </Link>
      </CardContent>
    </Card>
  );
}

"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { validateAuthorInput, type AuthorInput, type AuthorInputErrors } from "@/lib/author-form-contract";

export type AuthorCreateResult = "created" | "duplicate" | "error" | "uncertain";

// Presentation only; the preview supplies its test-only action explicitly.
export function AuthorCreateForm({ createAction }: { createAction: (input: AuthorInput) => Promise<AuthorCreateResult> }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<AuthorInputErrors>({});
  const [state, setState] = useState<"idle" | "saving" | AuthorCreateResult>("idle");
  const pending = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current || state === "created" || state === "uncertain") return;
    const invalid = validateAuthorInput({ name, email });
    setErrors(invalid);
    if (invalid.name || invalid.email) {
      event.currentTarget.querySelector<HTMLElement>(invalid.name ? "#author-name" : "#author-email")?.focus();
      return;
    }
    pending.current = true;
    setState("saving");
    try { setState(await createAction({ name: name.trim(), email: email.trim() })); }
    catch { setState("uncertain"); }
    finally { pending.current = false; }
  }

  function edited() {
    setErrors({});
    setState("idle");
  }

  const emailError = errors.email === "required" ? "ایمیل را وارد کنید." : errors.email === "format" ? "یک ایمیل معتبر وارد کنید." : state === "duplicate" ? "این ایمیل قبلاً ثبت شده است." : undefined;
  const busy = state === "saving";
  const blocked = busy || state === "created" || state === "uncertain";
  return <Card className="min-h-64 space-y-6 p-6 sm:p-8">
    <p>این فرم فقط داده‌های آزمایشی ایجاد می‌کند.</p>
    <form noValidate onSubmit={submit} className="space-y-6" aria-busy={busy}>
      <fieldset disabled={blocked} className="min-w-0 space-y-6">
        <Field label="نام" htmlFor="author-name">
          <Input id="author-name" name="name" autoComplete="name" value={name} required className="min-h-12" onChange={event => { setName(event.target.value); edited(); }} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "author-name-error" : undefined} />
          {errors.name && <p id="author-name-error" className="text-sm text-destructive">نام را وارد کنید.</p>}
        </Field>
        <Field label="ایمیل" htmlFor="author-email">
          <Input id="author-email" name="email" type="email" dir="ltr" autoComplete="email" value={email} required className="min-h-12" onChange={event => { setEmail(event.target.value); edited(); }} aria-invalid={Boolean(emailError)} aria-describedby={emailError ? "author-email-error" : undefined} />
          {emailError && <p id="author-email-error" role={state === "duplicate" ? "alert" : undefined} className="text-sm text-destructive">{emailError}</p>}
        </Field>
      </fieldset>
      <div className="min-h-12">
        <p role="status" aria-live="polite">{state === "created" ? "نویسنده در داده‌های آزمایشی ایجاد شد." : busy ? "در حال ایجاد نویسنده…" : ""}</p>
        {state === "error" && <p role="alert">ایجاد نویسنده انجام نشد. دوباره تلاش کنید.</p>}
        {state === "uncertain" && <p role="alert">نتیجهٔ ایجاد نویسنده مشخص نیست. پیش از تلاش دوباره، نویسندگان را بررسی کنید.</p>}
      </div>
      <Button type="submit" size="lg" disabled={blocked} className="w-full motion-reduce:transition-none sm:w-auto">{busy ? "در حال ایجاد نویسنده…" : "افزودن نویسنده"}</Button>
    </form>
    <Link href="/dashboard/workspace" className="inline-flex min-h-12 items-center rounded-control px-4 underline focus-visible:outline-2 focus-visible:outline-ring">مشاهدهٔ نویسندگان</Link>
  </Card>;
}

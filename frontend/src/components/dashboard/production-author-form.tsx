"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { createAuthorAction } from "@/app/dashboard/author-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { authorsMessages as copy, authorErrorMessage } from "@/i18n/messages/authors.fa";
import {
  validateAuthorCreateInput,
  type AuthorCreateInputErrors,
} from "@/lib/author-form-contract";

export function ProductionAuthorForm({ csrfToken }: { csrfToken: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<AuthorCreateInputErrors>({});
  const [state, setState] = useState<
    "idle" | "saving" | "created" | "failed" | "uncertain"
  >("idle");
  const [failure, setFailure] = useState("");
  const pending = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current || state === "created" || state === "uncertain") return;
    const invalid = validateAuthorCreateInput({ name, email, password });
    setErrors(invalid);
    if (invalid.name || invalid.email || invalid.password) {
      const target = invalid.name
        ? "#author-name"
        : invalid.email
          ? "#author-email"
          : "#author-password";
      event.currentTarget.querySelector<HTMLElement>(target)?.focus();
      return;
    }
    pending.current = true;
    setState("saving");
    setFailure("");
    try {
      const result = await createAuthorAction(
        { name: name.trim(), email: email.trim(), password },
        csrfToken,
      );
      if (result.state === "success") {
        // The password is never retained after the server accepted it.
        setPassword("");
        setName("");
        setEmail("");
        setState("created");
      } else if (result.state === "failure") {
        setState("failed");
        setFailure(authorErrorMessage(result.reason));
      } else if (result.state === "csrf") {
        setState("failed");
        setFailure(copy.csrf);
      } else {
        setState("uncertain");
      }
    } catch {
      setState("uncertain");
    } finally {
      pending.current = false;
    }
  }

  function edited() {
    setErrors({});
    if (state === "failed") {
      setState("idle");
      setFailure("");
    }
  }

  const nameError = errors.name ? copy.nameRequired : undefined;
  const emailError = errors.email
    ? errors.email === "required"
      ? copy.emailRequired
      : copy.emailFormat
    : undefined;
  const busy = state === "saving";
  const blocked = busy || state === "created" || state === "uncertain";

  return (
    <Card className="min-h-64 space-y-6 p-6 sm:p-8">
      <div className="space-y-2">
        <h2 className="text-xl leading-tight font-semibold">
          {copy.createTitle}
        </h2>
        <p>{copy.createDescription}</p>
      </div>
      <form noValidate onSubmit={submit} className="space-y-6" aria-busy={busy}>
        <fieldset disabled={blocked} className="min-w-0 space-y-6">
          <Field label={copy.name} htmlFor="author-name">
            <Input
              id="author-name"
              name="name"
              autoComplete="name"
              value={name}
              required
              className="min-h-12"
              error={nameError}
              onChange={(event) => {
                setName(event.target.value);
                edited();
              }}
            />
          </Field>
          <Field label={copy.email} htmlFor="author-email">
            <Input
              id="author-email"
              name="email"
              type="email"
              dir="ltr"
              autoComplete="email"
              value={email}
              required
              className="min-h-12"
              error={emailError}
              onChange={(event) => {
                setEmail(event.target.value);
                edited();
              }}
            />
          </Field>
          <Field
            label={copy.password}
            htmlFor="author-password"
            hint={copy.passwordHint}
          >
            <Input
              id="author-password"
              name="password"
              type="password"
              dir="ltr"
              autoComplete="new-password"
              value={password}
              required
              className="min-h-12"
              error={errors.password}
              onChange={(event) => {
                setPassword(event.target.value);
                edited();
              }}
            />
          </Field>
        </fieldset>
        <div className="min-h-12">
          <p role="status" aria-live="polite">
            {state === "created" ? copy.created : busy ? copy.creating : ""}
          </p>
          {state === "failed" && <p role="alert">{failure}</p>}
          {state === "uncertain" && <p role="alert">{copy.uncertain}</p>}
        </div>
        <Button type="submit" size="lg" disabled={blocked} className="w-full motion-reduce:transition-none sm:w-auto">
          {busy ? copy.creating : copy.create}
        </Button>
      </form>
      <Link
        href="/dashboard/authors"
        className="inline-flex min-h-12 items-center rounded-control px-4 underline focus-visible:outline-2 focus-visible:outline-ring"
      >
        {copy.backToList}
      </Link>
    </Card>
  );
}

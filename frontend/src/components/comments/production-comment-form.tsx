"use client";

import { useRef, useState, type FormEvent } from "react";
import { submitArticleCommentAction } from "@/app/comment-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { commentErrorMessage, commentsMessages as copy } from "@/i18n/messages/comments.fa";
import { validateCommentText } from "@/lib/comments-contract";

type FormState = "idle" | "submitting" | "submitted" | "failed" | "uncertain";

export function ProductionCommentForm({
  postId,
  csrfToken,
}: {
  postId: string;
  csrfToken: string;
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [failure, setFailure] = useState("");
  const locked = useRef(false);
  const busy = state === "submitting";
  const blocked = busy || state === "uncertain";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current || blocked) return;
    const invalid = validateCommentText(text);
    setError(invalid ? copy.required : "");
    if (invalid) {
      event.currentTarget.querySelector("textarea")?.focus();
      return;
    }
    locked.current = true;
    setState("submitting");
    setFailure("");
    try {
      const result = await submitArticleCommentAction(postId, text.trim(), csrfToken);
      if (result.state === "success") {
        setText("");
        setState("submitted");
      } else if (result.state === "failure") {
        setState("failed");
        setFailure(commentErrorMessage(result.reason));
      } else if (result.state === "csrf") {
        setState("failed");
        setFailure(copy.csrf);
      } else {
        setState("uncertain");
      }
    } catch {
      setState("uncertain");
    } finally {
      locked.current = false;
    }
  }

  return (
    <Card className="space-y-4 p-6">
      <form noValidate onSubmit={submit} className="space-y-4" aria-busy={busy}>
        <Field label={copy.article.label} htmlFor="article-comment-text" hint={copy.article.hint}>
          <Textarea
            id="article-comment-text"
            value={text}
            disabled={blocked}
            aria-invalid={Boolean(error)}
            aria-describedby="article-comment-error"
            onChange={(event) => {
              setText(event.target.value);
              setError("");
              if (state === "failed" || state === "submitted") {
                setState("idle");
                setFailure("");
              }
            }}
          />
        </Field>
        <p id="article-comment-error" className="min-h-6 text-sm text-destructive">{error}</p>
        <Button size="lg" type="submit" disabled={blocked} className="motion-reduce:transition-none">
          {busy ? copy.article.submitting : copy.article.submit}
        </Button>
        <div className="min-h-12">
          <p role="status" aria-live="polite">
            {state === "submitted" ? copy.article.submitted : busy ? copy.article.submitting : ""}
          </p>
          {state === "failed" && <p role="alert" className="text-sm text-destructive">{failure}</p>}
          {state === "uncertain" && <p role="alert" className="text-sm text-destructive">{copy.uncertain}</p>}
        </div>
      </form>
    </Card>
  );
}

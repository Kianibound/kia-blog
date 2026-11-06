"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { fa } from "@/lib/utils";
import { validateArticleCommentText, type ArticleCommentSubmissionResult, type ModerationComment } from "@/lib/comment-moderation-contract";

export function ArticleCommentsLoading() {
  return <section aria-label="دیدگاه‌های مقاله" aria-busy="true" className="mx-auto mt-8 min-h-256 max-w-3xl space-y-6">
    <h2 className="text-2xl font-semibold">دیدگاه‌های مقاله</h2>
    <Card className="min-h-96 space-y-4 p-6"><p role="status">در حال دریافت دیدگاه‌ها…</p><Skeleton className="h-6 w-32 motion-reduce:animate-none" /><Skeleton className="h-24 w-full motion-reduce:animate-none" /></Card>
    <Card className="min-h-128 space-y-4 p-6"><Skeleton className="h-6 w-32 motion-reduce:animate-none" /><Skeleton className="h-20 w-full motion-reduce:animate-none" /><Skeleton className="h-12 w-32 motion-reduce:animate-none" /></Card>
  </section>;
}

export function ArticleCommentList({ comments }: { comments: ModerationComment[] }) {
  return <Card className="min-h-96 p-6">
    {comments.length ? <ul aria-label="دیدگاه‌های تأییدشده" className="space-y-6">{comments.map(comment => <li key={comment.id} className="space-y-2">
      <p className="font-semibold wrap-anywhere">{fa(comment.name)}</p>
      <p className="whitespace-pre-wrap wrap-anywhere">{fa(comment.text)}</p>
    </li>)}</ul> : <p>هنوز دیدگاه تأییدشده‌ای برای این مقاله وجود ندارد.</p>}
  </Card>;
}

// Presentation only. A submit adapter is supplied exclusively by the test host.
export function ArticleCommentForm({ submitAction }: { submitAction: (text: string) => Promise<ArticleCommentSubmissionResult> }) {
  const hydrated = useSyncExternalStore(() => () => {}, () => true, () => false);
  const locked = useRef(false);
  const input = useRef<HTMLFormElement>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [state, setState] = useState<"idle" | "submitting" | ArticleCommentSubmissionResult>("idle");
  const busy = state === "submitting";
  const blocked = !hydrated || busy || state === "uncertain";
  const message = busy ? "در حال ارسال دیدگاه…" : state === "pending" ? "دیدگاه شما ثبت شد و در انتظار تأیید است." : state === "error" ? "ارسال دیدگاه انجام نشد. دوباره تلاش کنید." : state === "uncertain" ? "نتیجهٔ ارسال مشخص نیست. پیش از ارسال دوباره، صفحه را بارگذاری کنید." : "";

  return <Card className="min-h-128 p-6">
    <form ref={input} noValidate className="space-y-4" onSubmit={async event => {
      event.preventDefault();
      if (locked.current || blocked) return;
      setState("idle");
      const validation = validateArticleCommentText(text);
      setError(validation);
      if (validation) { input.current?.querySelector<HTMLTextAreaElement>("textarea")?.focus(); return; }
      locked.current = true;
      setState("submitting");
      try {
        const result = await submitAction(text.trim());
        setState(result);
        if (result === "pending") setText("");
      } catch { setState("uncertain"); }
      finally { locked.current = false; }
    }}>
      <p className="text-sm text-muted-foreground">دیدگاه آزمایشی پس از تأیید مدیر برای دیگران نمایش داده می‌شود.</p>
      <Field label="متن دیدگاه" htmlFor="article-comment"><Textarea id="article-comment" value={text} onChange={event => setText(event.target.value)} disabled={blocked} aria-invalid={!!error} aria-describedby="article-comment-error" /></Field>
      <p id="article-comment-error" className="min-h-12 text-sm text-destructive">{error}</p>
      <Button size="lg" type="submit" disabled={blocked}>ارسال دیدگاه</Button>
      <p role={message ? state === "error" || state === "uncertain" ? "alert" : "status" : undefined} aria-live="polite" aria-atomic="true" className="min-h-24">{message}</p>
    </form>
  </Card>;
}

"use client";

import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { publicationMessages as copy } from "@/i18n/messages/publication.fa";
import { authorPostsMessages } from "@/i18n/messages/author-posts.fa";
import { formatPublicationDate } from "@/lib/publication-date";
import { publicationFailureMessage } from "@/lib/article-write";
import type { ArticleRecord, ArticleSaveResult } from "@/lib/article-form-contract";

export type PublicationAction = (id: string, status: "DRAFT" | "PUBLISHED") => Promise<ArticleSaveResult>;

export function PublicationControls({ article, action, busy, dirty, blocked, onPending, onSaved, onUncertain, readingHref, saveControl, production = false }: {
  article?: ArticleRecord; action?: PublicationAction; busy: boolean; dirty: boolean; blocked: boolean;
  onPending: (value: boolean) => void; onSaved: (post: ArticleRecord) => void; onUncertain: () => void;
  readingHref?: (slug: string) => string;
  saveControl: ReactNode;
  production?: boolean;
}) {
  const messages = production
    ? {
        ...copy,
        title: copy.productionTitle,
        saveFirst: copy.productionSaveFirst,
        read: copy.productionRead,
        category: copy.productionCategory,
        confirmPublish: copy.productionConfirmPublish,
        confirmUnpublish: copy.productionConfirmUnpublish,
        publishHelp: copy.productionPublishHelp,
        unpublishHelp: copy.productionUnpublishHelp,
        published: copy.productionPublished,
        drafted: copy.productionDrafted,
        failed: copy.productionFailed,
        uncertain: copy.productionUncertain,
      }
    : copy;
  const [confirming, setConfirming] = useState(false);
  const [feedback, setFeedback] = useState<"idle" | "pending" | "published" | "drafted" | "failed" | "uncertain">("idle");
  const [failureMessage, setFailureMessage] = useState("");
  const pending = useRef(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const publishing = !article || article.status !== "PUBLISHED";
  const target = publishing ? "PUBLISHED" : "DRAFT";
  const categoryMissing = publishing && article && article.categories.length === 0;
  const disabled = busy || blocked || dirty || categoryMissing || !action || !article;

  function cancel() { setConfirming(false); requestAnimationFrame(() => trigger.current?.focus()); }
  async function confirm() {
    if (disabled || pending.current || !article || !action) return;
    pending.current = true;
    setFeedback("pending");
    setFailureMessage("");
    onPending(true);
    try {
      const result = await action(article.id, target);
      if (result.state === "saved") { onSaved(result.post); setFeedback(publishing ? "published" : "drafted"); setConfirming(false); requestAnimationFrame(() => trigger.current?.focus()); }
      else if (result.state === "error") { setFailureMessage(publicationFailureMessage(result, messages.failed)); setFeedback("failed"); }
      else { setFeedback("uncertain"); onUncertain(); setConfirming(false); }
    } catch { setFeedback("uncertain"); onUncertain(); setConfirming(false); }
    finally { pending.current = false; onPending(false); }
  }

  return <>
    <div role="group" aria-label={copy.actions} className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:gap-4">
      {saveControl}
      <Button size="md" className="min-h-12 w-full sm:w-auto" disabled={Boolean(disabled)} aria-haspopup="dialog" aria-expanded={confirming} onClick={event => { trigger.current = event.currentTarget; setFeedback("idle"); setConfirming(true); }}>{publishing ? copy.publish : copy.unpublish}</Button>
    </div>
    <section aria-label={messages.title} className="min-h-48 space-y-4 rounded-field border border-border p-4" aria-busy={feedback === "pending"}>
    <h2 className="text-xl font-semibold leading-tight">{messages.title}</h2>
    {article && <p>{authorPostsMessages.states[article.status]}{article.publishedAt && <> · <time dateTime={article.publishedAt}>{formatPublicationDate(article.publishedAt)}</time></>}</p>}
    <p>{action ? (production ? copy.productionHelp : copy.preview) : copy.unavailable}</p>
    {!article ? <p>{messages.saveFirst}</p> : <>
      {dirty && <p>{copy.dirty}</p>}
      {categoryMissing && <p>{messages.category}</p>}
    </>}
    <Dialog open={confirming} onOpenChange={open => { if (!open && feedback !== "pending") cancel(); }} title={messages.confirmTitle} description={publishing ? messages.publishHelp : messages.unpublishHelp} dismissible={feedback !== "pending"}
      footer={<><Button data-autofocus="" size="lg" disabled={Boolean(disabled)} onClick={confirm}>{publishing ? messages.confirmPublish : messages.confirmUnpublish}</Button><Button size="lg" variant="outline" disabled={feedback === "pending"} onClick={cancel}>{copy.cancel}</Button></>}>
      {feedback === "failed" && <p role="alert">{failureMessage || messages.failed}</p>}
      {feedback === "pending" && <p role="status">{copy.pending}</p>}
    </Dialog>
    {!confirming && (feedback === "failed" || feedback === "uncertain") && <p role="alert">{feedback === "failed" ? failureMessage || messages.failed : messages.uncertain}</p>}
    {!confirming && (feedback === "published" || feedback === "drafted") && <p role="status">{messages[feedback]}</p>}
    {article?.status === "PUBLISHED" && readingHref && <Link prefetch={false} href={readingHref(article.slug)} className="inline-flex min-h-12 items-center rounded-control px-4 underline focus-visible:outline-2 focus-visible:outline-ring">{messages.read}</Link>}
  </section></>;
}

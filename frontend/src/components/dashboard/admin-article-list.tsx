"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthorPostList } from "./author-post-list";
import { Button } from "@/components/ui/button";
import { DeleteArticleDialog, type DeleteDialogState } from "./delete-article-dialog";
import { deleteArticleAction } from "@/app/dashboard/article-actions";
import { deleteArticleMessages as copy } from "@/i18n/messages/article-form.fa";
import type { ArticleDeleteResult } from "@/lib/article-form-contract";
import type { OwnPost, OwnPosts } from "@/lib/own-posts-contract";

export type AdminArticleListMessages = {
  confirmSuffix?: string;
  deleted?: string;
};

/**
 * ADMIN article list with permanent deletion. Production callers pass the
 * CSRF token and the real delete action runs; the preview host passes its
 * own deleteAction and fixture wording instead.
 */
export function AdminArticleList({ posts, authors, deleteAction, csrfToken, createHref, messages: messagesProp }: {
  posts: OwnPosts;
  authors: Record<string, string>;
  deleteAction?: (id: string) => Promise<ArticleDeleteResult>;
  csrfToken?: string;
  createHref?: string;
  messages?: AdminArticleListMessages;
}) {
  const messages = { confirmSuffix: copy.confirmSuffix, deleted: copy.deleted, ...messagesProp };
  const action = deleteAction ?? ((id: string) => deleteArticleAction(id, csrfToken ?? ""));
  const router = useRouter();
  const [selected, setSelected] = useState<OwnPost | null>(null);
  const [state, setState] = useState<"idle" | "pending" | "deleted" | "error" | "uncertain">("idle");
  const pending = useRef(false);
  const feedback = useRef<HTMLParagraphElement>(null);

  async function confirm() {
    if (!selected || pending.current || state === "uncertain") return;
    pending.current = true;
    setState("pending");
    try {
      const result = await action(selected.id);
      if (result.state === "deleted") {
        setState("deleted");
        setSelected(null);
        router.refresh();
        requestAnimationFrame(() => feedback.current?.focus());
      } else if (result.state === "error") setState("error");
      else setState("uncertain");
    } catch { setState("uncertain"); }
    finally { pending.current = false; }
  }

  const dialogState: DeleteDialogState = state === "deleted" ? "idle" : state;

  return <>
    <AuthorPostList posts={posts} authors={authors} href={page => page === 1 ? "/dashboard/posts" : `/dashboard/posts?page=${page}`} createHref={createHref} formLinks={{ edit: id => `/dashboard/posts/${encodeURIComponent(id)}/edit` }}
      renderAction={post => <div className="flex justify-end"><Button size="lg" variant="destructive" aria-haspopup="dialog" disabled={state === "pending"} onClick={() => { setSelected(post); setState("idle"); }}>{copy.delete}</Button></div>} />
    <p ref={feedback} tabIndex={-1} role={state === "deleted" ? "status" : undefined} aria-live="polite" className="min-h-12">{state === "deleted" ? messages.deleted : ""}</p>
    <DeleteArticleDialog open={Boolean(selected)} postTitle={selected?.title ?? ""} state={dialogState} confirmSuffix={messages.confirmSuffix} onConfirm={confirm} onClose={() => { if (!pending.current) setSelected(null); }} />
  </>;
}

"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { DeleteArticleDialog, type DeleteDialogState } from "./delete-article-dialog";
import { deleteArticleMessages as copy } from "@/i18n/messages/article-form.fa";
import type { ArticleDeleteResult } from "@/lib/article-form-contract";

/** Self-contained delete button with confirmation dialog. ADMIN-only callers only. */
export function DeleteArticleButton({
  postId,
  postTitle,
  onDelete,
  onDeleted,
  size = "lg",
  className,
  confirmSuffix,
}: {
  postId: string;
  postTitle: string;
  onDelete: (id: string) => Promise<ArticleDeleteResult>;
  onDeleted?: () => void;
  size?: "md" | "lg";
  className?: string;
  confirmSuffix?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<DeleteDialogState>("idle");
  const pending = useRef(false);

  async function confirm() {
    if (pending.current) return;
    pending.current = true;
    setState("pending");
    try {
      const result = await onDelete(postId);
      if (result.state === "deleted") {
        setOpen(false);
        setState("idle");
        onDeleted?.();
      } else if (result.state === "error") setState("error");
      else setState("uncertain");
    } catch {
      setState("uncertain");
    } finally {
      pending.current = false;
    }
  }

  return <>
    <Button size={size} variant="destructive" aria-haspopup="dialog" disabled={state === "pending"} className={className} onClick={() => { setState("idle"); setOpen(true); }}>{copy.delete}</Button>
    <DeleteArticleDialog open={open} postTitle={postTitle} state={state} confirmSuffix={confirmSuffix} onConfirm={confirm} onClose={() => { if (!pending.current) setOpen(false); }} />
  </>;
}

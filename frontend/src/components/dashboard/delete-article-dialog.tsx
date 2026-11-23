"use client";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { deleteArticleMessages as copy } from "@/i18n/messages/article-form.fa";
import { fa } from "@/lib/utils";

export type DeleteDialogState = "idle" | "pending" | "error" | "uncertain";

/** Shared delete confirmation: red confirm, yellow cancel, cancel focused first. */
export function DeleteArticleDialog({
  open,
  postTitle,
  state,
  confirmSuffix = copy.confirmSuffix,
  onConfirm,
  onClose,
}: {
  open: boolean;
  postTitle: string;
  state: DeleteDialogState;
  confirmSuffix?: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return <Dialog open={open} role="alertdialog" title={copy.delete} description={<>آیا مقالهٔ «{fa(postTitle)}» {confirmSuffix}</>} dismissible={state !== "pending"} onOpenChange={open => { if (!open) onClose(); }}
    footer={<><Button data-autofocus="" size="lg" variant="warning" disabled={state === "pending"} onClick={onClose}>{copy.cancel}</Button><Button size="lg" variant="destructive" disabled={state === "pending" || state === "uncertain"} onClick={onConfirm}>{copy.confirm}</Button></>}>
    {state === "pending" && <p role="status">{copy.deleting}</p>}
    {state === "error" && <p role="alert">{copy.failed}</p>}
    {state === "uncertain" && <p role="alert">{copy.uncertain}</p>}
  </Dialog>;
}

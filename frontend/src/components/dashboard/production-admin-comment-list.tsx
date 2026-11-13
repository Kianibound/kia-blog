"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  approveCommentAction,
  deleteCommentAction,
} from "@/app/dashboard/comment-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { commentErrorMessage, commentsMessages as copy } from "@/i18n/messages/comments.fa";
import type { AdminComment } from "@/lib/comments-contract";
import { formatPublicationDate } from "@/lib/publication-date";
import { fa } from "@/lib/utils";

type RowFailure = { id: string; message: string; stale: boolean };

export function ProductionAdminCommentList({
  comments: initialComments,
  csrfToken,
}: {
  comments: AdminComment[];
  csrfToken: string;
}) {
  const router = useRouter();
  const [comments, setComments] = useState(initialComments);
  const [notice, setNotice] = useState("");
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [failure, setFailure] = useState<RowFailure | null>(null);
  const [removing, setRemoving] = useState<AdminComment | null>(null);
  const [removeState, setRemoveState] = useState<"idle" | "pending" | "failed" | "uncertain">("idle");
  const [removeFailure, setRemoveFailure] = useState("");
  const pending = useRef(false);

  const busy = approvingId !== null || removeState === "pending";

  // Approval never retries a stale version: the reviewer reloads and decides again.
  async function approve(comment: AdminComment) {
    if (pending.current) return;
    pending.current = true;
    setApprovingId(comment.id);
    setFailure(null);
    setNotice("");
    try {
      const result = await approveCommentAction(comment.id, comment.version, csrfToken);
      if (result.state === "success" && result.value) {
        const approved = result.value;
        setComments((current) => current.map((item) => (item.id === approved.id ? approved : item)));
        setNotice(copy.admin.approvedNotice);
      } else if (result.state === "failure") {
        setFailure({
          id: comment.id,
          message: result.reason === "conflict" ? copy.admin.stale : commentErrorMessage(result.reason),
          stale: result.reason === "conflict",
        });
      } else if (result.state === "csrf") {
        setFailure({ id: comment.id, message: copy.csrf, stale: false });
      } else {
        setFailure({ id: comment.id, message: copy.uncertain, stale: true });
      }
    } catch {
      setFailure({ id: comment.id, message: copy.uncertain, stale: true });
    } finally {
      setApprovingId(null);
      pending.current = false;
    }
  }

  async function remove() {
    if (!removing || pending.current || removeState === "uncertain") return;
    const target = removing;
    pending.current = true;
    setRemoveState("pending");
    setRemoveFailure("");
    try {
      const result = await deleteCommentAction(target.id, csrfToken);
      if (result.state === "success") {
        setComments((current) => current.filter((item) => item.id !== target.id));
        setRemoving(null);
        setRemoveState("idle");
        setNotice(copy.admin.removed);
      } else if (result.state === "failure") {
        setRemoveState("failed");
        setRemoveFailure(commentErrorMessage(result.reason));
      } else if (result.state === "csrf") {
        setRemoveState("failed");
        setRemoveFailure(copy.csrf);
      } else {
        setRemoveState("uncertain");
      }
    } catch {
      setRemoveState("uncertain");
    } finally {
      pending.current = false;
    }
  }

  return (
    <div className="space-y-6">
      <p role="status" aria-live="polite" className="min-h-12">{notice}</p>
      <ul className="space-y-4">
        {comments.map((comment) => (
          <li key={comment.id}>
            <Card className="space-y-4 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="font-semibold wrap-anywhere">{fa(comment.authorName)}</p>
                <span className="rounded-control bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground">
                  {comment.status === "PENDING" ? copy.admin.pending : copy.admin.approved}
                </span>
              </div>
              <time dateTime={comment.createdAt} className="text-sm text-muted-foreground">
                {formatPublicationDate(comment.createdAt)}
              </time>
              <p className="whitespace-pre-wrap wrap-anywhere">{fa(comment.content)}</p>
              <div className="flex flex-wrap gap-4">
                {comment.status === "PENDING" && (
                  <Button
                    size="lg"
                    disabled={busy || (failure?.id === comment.id && failure.stale)}
                    onClick={() => void approve(comment)}
                  >
                    {approvingId === comment.id ? copy.admin.approving : copy.admin.approve}
                  </Button>
                )}
                <Button
                  size="lg"
                  variant="destructive"
                  disabled={busy}
                  aria-haspopup="dialog"
                  onClick={() => {
                    setRemoving(comment);
                    setRemoveState("idle");
                    setRemoveFailure("");
                  }}
                >
                  {copy.admin.remove}
                </Button>
              </div>
              {failure?.id === comment.id && (
                <div role="alert" className="space-y-4">
                  <p className="text-sm text-destructive">{failure.message}</p>
                  {failure.stale && (
                    <Button size="lg" variant="outline" onClick={() => router.refresh()}>
                      {copy.admin.reload}
                    </Button>
                  )}
                </div>
              )}
            </Card>
          </li>
        ))}
      </ul>
      <Dialog
        open={Boolean(removing)}
        role="alertdialog"
        title={copy.admin.removeTitle}
        description={copy.admin.removeDescription}
        dismissible={removeState !== "pending"}
        onOpenChange={(open) => {
          if (!open && !pending.current) setRemoving(null);
        }}
        footer={
          <>
            <Button data-autofocus="" size="lg" variant="outline" disabled={removeState === "pending"} onClick={() => setRemoving(null)}>
              {copy.admin.cancel}
            </Button>
            <Button size="lg" variant="destructive" disabled={removeState === "pending" || removeState === "uncertain"} onClick={() => void remove()}>
              {copy.admin.confirmRemove}
            </Button>
          </>
        }
      >
        {removeState === "pending" && <p role="status">{copy.admin.removing}</p>}
        {removeState === "failed" && <p role="alert">{removeFailure}</p>}
        {removeState === "uncertain" && <p role="alert">{copy.uncertain}</p>}
      </Dialog>
    </div>
  );
}

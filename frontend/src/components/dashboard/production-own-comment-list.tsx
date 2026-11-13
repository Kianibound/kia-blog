"use client";

import { useRef, useState, type FormEvent } from "react";
import {
  deleteCommentAction,
  updateOwnCommentAction,
} from "@/app/dashboard/comment-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { commentErrorMessage, commentsMessages as copy } from "@/i18n/messages/comments.fa";
import {
  validateCommentText,
  type OwnComment,
} from "@/lib/comments-contract";
import { formatPublicationDate } from "@/lib/publication-date";
import { fa } from "@/lib/utils";

type EditState = "idle" | "saving" | "failed" | "uncertain";
type RemoveState = "idle" | "pending" | "failed" | "uncertain";

export function ProductionOwnCommentList({
  comments: initialComments,
  csrfToken,
}: {
  comments: OwnComment[];
  csrfToken: string;
}) {
  const [comments, setComments] = useState(initialComments);
  const [notice, setNotice] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [draftError, setDraftError] = useState("");
  const [editState, setEditState] = useState<EditState>("idle");
  const [editFailure, setEditFailure] = useState("");
  const [removing, setRemoving] = useState<OwnComment | null>(null);
  const [removeState, setRemoveState] = useState<RemoveState>("idle");
  const [removeFailure, setRemoveFailure] = useState("");
  const pending = useRef(false);

  const busy = editState === "saving" || removeState === "pending";

  function startEdit(comment: OwnComment) {
    setEditingId(comment.id);
    setDraft(comment.content);
    setDraftError("");
    setEditState("idle");
    setEditFailure("");
    setNotice("");
  }

  function stopEdit() {
    setEditingId(null);
    setEditState("idle");
    setEditFailure("");
  }

  async function save(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    if (pending.current || editState === "uncertain") return;
    const invalid = validateCommentText(draft);
    setDraftError(invalid ? copy.required : "");
    if (invalid) {
      event.currentTarget.querySelector("textarea")?.focus();
      return;
    }
    pending.current = true;
    setEditState("saving");
    setEditFailure("");
    try {
      const result = await updateOwnCommentAction(id, draft.trim(), csrfToken);
      if (result.state === "success" && result.value) {
        const updated = result.value;
        setComments((current) => current.map((item) => (item.id === id ? updated : item)));
        setEditingId(null);
        setEditState("idle");
        setNotice(copy.own.updated);
      } else if (result.state === "failure") {
        setEditState("failed");
        setEditFailure(commentErrorMessage(result.reason));
      } else if (result.state === "csrf") {
        setEditState("failed");
        setEditFailure(copy.csrf);
      } else {
        setEditState("uncertain");
      }
    } catch {
      setEditState("uncertain");
    } finally {
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
        setNotice(copy.own.removed);
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
                <time dateTime={comment.createdAt} className="text-sm text-muted-foreground">
                  {formatPublicationDate(comment.createdAt)}
                </time>
                <span className="rounded-control bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground">
                  {comment.status === "PENDING" ? copy.own.pending : copy.own.approved}
                </span>
              </div>
              {editingId === comment.id ? (
                <form noValidate className="space-y-4" aria-busy={editState === "saving"} onSubmit={(event) => void save(event, comment.id)}>
                  <Field label={copy.article.label} htmlFor="own-comment-text">
                    <Textarea
                      id="own-comment-text"
                      value={draft}
                      disabled={editState === "saving" || editState === "uncertain"}
                      aria-invalid={Boolean(draftError)}
                      aria-describedby="own-comment-edit-notice own-comment-error"
                      onChange={(event) => {
                        setDraft(event.target.value);
                        setDraftError("");
                        if (editState === "failed") setEditState("idle");
                      }}
                    />
                  </Field>
                  <p id="own-comment-edit-notice" className="text-sm text-muted-foreground">{copy.own.editNotice}</p>
                  <p id="own-comment-error" className="min-h-6 text-sm text-destructive">{draftError}</p>
                  <div className="flex flex-wrap gap-4">
                    <Button size="lg" type="submit" disabled={editState === "saving" || editState === "uncertain"} className="motion-reduce:transition-none">
                      {editState === "saving" ? copy.own.saving : copy.own.save}
                    </Button>
                    <Button size="lg" variant="outline" type="button" disabled={editState === "saving"} onClick={stopEdit}>
                      {copy.own.cancel}
                    </Button>
                  </div>
                  <div className="min-h-6">
                    {editState === "failed" && <p role="alert" className="text-sm text-destructive">{editFailure}</p>}
                    {editState === "uncertain" && <p role="alert" className="text-sm text-destructive">{copy.uncertain}</p>}
                  </div>
                </form>
              ) : (
                <>
                  <p className="whitespace-pre-wrap wrap-anywhere">{fa(comment.content)}</p>
                  <div className="flex flex-wrap gap-4">
                    <Button size="lg" variant="outline" disabled={busy} onClick={() => startEdit(comment)}>
                      {copy.own.edit}
                    </Button>
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
                      {copy.own.remove}
                    </Button>
                  </div>
                </>
              )}
            </Card>
          </li>
        ))}
      </ul>
      <Dialog
        open={Boolean(removing)}
        role="alertdialog"
        title={copy.own.removeTitle}
        description={copy.own.removeDescription}
        dismissible={removeState !== "pending"}
        onOpenChange={(open) => {
          if (!open && !pending.current) setRemoving(null);
        }}
        footer={
          <>
            <Button data-autofocus="" size="lg" variant="outline" disabled={removeState === "pending"} onClick={() => setRemoving(null)}>
              {copy.own.cancel}
            </Button>
            <Button size="lg" variant="destructive" disabled={removeState === "pending" || removeState === "uncertain"} onClick={() => void remove()}>
              {copy.own.confirmRemove}
            </Button>
          </>
        }
      >
        {removeState === "pending" && <p role="status">{copy.own.removing}</p>}
        {removeState === "failed" && <p role="alert">{removeFailure}</p>}
        {removeState === "uncertain" && <p role="alert">{copy.uncertain}</p>}
      </Dialog>
    </div>
  );
}

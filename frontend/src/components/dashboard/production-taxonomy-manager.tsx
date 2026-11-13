"use client";

import { useRef, useState, type FormEvent } from "react";
import {
  createTaxonomyAction,
  deleteTaxonomyAction,
} from "@/app/dashboard/taxonomy-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import {
  taxonomyErrorMessage,
  taxonomyMessages as copy,
} from "@/i18n/messages/taxonomy.fa";
import {
  taxonomyNameError,
  type TaxonomyFailureReason,
  type TaxonomyKind,
  type TaxonomyRecord,
} from "@/lib/taxonomy-contract";
import { fa } from "@/lib/utils";

type CreateState = "idle" | "pending" | "created" | "failed" | "uncertain";
type DeleteState = "idle" | "pending" | "deleted" | "failed" | "uncertain";

export function ProductionTaxonomyManager({
  kind,
  initialItems,
  csrfToken,
}: {
  kind: TaxonomyKind;
  initialItems: TaxonomyRecord[];
  csrfToken: string;
}) {
  const nameLabel =
    kind === "categories" ? copy.categoriesName : copy.tagsName;
  const createdMessage =
    kind === "categories" ? copy.createdCategories : copy.createdTags;
  const deletedMessage =
    kind === "categories" ? copy.deletedCategories : copy.deletedTags;
  const deleteTitle =
    kind === "categories" ? copy.deleteTitleCategories : copy.deleteTitleTags;

  const [items, setItems] = useState(initialItems);
  const [name, setName] = useState("");
  const [required, setRequired] = useState(false);
  const [createState, setCreateState] = useState<CreateState>("idle");
  const [createReason, setCreateReason] =
    useState<TaxonomyFailureReason | null>(null);
  const [createFailure, setCreateFailure] = useState("");
  const [selected, setSelected] = useState<TaxonomyRecord | null>(null);
  const [deleteState, setDeleteState] = useState<DeleteState>("idle");
  const [deleteFailure, setDeleteFailure] = useState("");
  const pending = useRef(false);
  const feedback = useRef<HTMLParagraphElement>(null);
  const deleteFeedback = useRef<HTMLParagraphElement>(null);

  const busy = createState === "pending" || deleteState === "pending";

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    const error = taxonomyNameError(name);
    setRequired(Boolean(error));
    if (error) {
      event.currentTarget.querySelector<HTMLElement>("#taxonomy-name")?.focus();
      return;
    }
    pending.current = true;
    setCreateState("pending");
    setCreateFailure("");
    setCreateReason(null);
    try {
      const result = await createTaxonomyAction(kind, name.trim(), csrfToken);
      if (result.state === "success" && result.item) {
        const item = result.item;
        setItems((current) =>
          [...current, item].sort((a, b) =>
            a.name.localeCompare(b.name, "fa"),
          ),
        );
        setName("");
        setCreateState("created");
        requestAnimationFrame(() => feedback.current?.focus());
      } else if (result.state === "failure") {
        setCreateState("failed");
        setCreateReason(result.reason);
        setCreateFailure(taxonomyErrorMessage(result.reason));
      } else if (result.state === "csrf") {
        setCreateState("failed");
        setCreateFailure(copy.csrf);
      } else {
        setCreateState("uncertain");
      }
    } catch {
      setCreateState("uncertain");
    } finally {
      pending.current = false;
    }
  }

  async function remove() {
    if (!selected || pending.current || deleteState === "uncertain") return;
    pending.current = true;
    setDeleteState("pending");
    setDeleteFailure("");
    try {
      const result = await deleteTaxonomyAction(
        kind,
        selected.id,
        csrfToken,
      );
      if (result.state === "success") {
        setItems((current) => current.filter((item) => item.id !== selected.id));
        setSelected(null);
        setDeleteState("deleted");
        requestAnimationFrame(() => deleteFeedback.current?.focus());
      } else if (result.state === "failure") {
        setDeleteState("failed");
        setDeleteFailure(taxonomyErrorMessage(result.reason));
      } else if (result.state === "csrf") {
        setDeleteState("failed");
        setDeleteFailure(copy.csrf);
      } else {
        setDeleteState("uncertain");
      }
    } catch {
      setDeleteState("uncertain");
    } finally {
      pending.current = false;
    }
  }

  function edited() {
    setRequired(false);
    if (createState === "failed") {
      setCreateState("idle");
      setCreateFailure("");
      setCreateReason(null);
    }
  }

  const duplicate = createState === "failed" && createReason === "duplicate";

  return (
    <Card className="min-h-64 space-y-6 p-6 sm:p-8">
      <form noValidate onSubmit={create} className="space-y-4" aria-busy={busy}>
        <Field
          label={nameLabel}
          htmlFor="taxonomy-name"
          hint={copy.nameHint}
        >
          <Input
            id="taxonomy-name"
            name="name"
            required
            value={name}
            disabled={busy}
            className="min-h-12"
            aria-invalid={required || duplicate}
            aria-describedby={
              required
                ? "taxonomy-required"
                : duplicate
                  ? "taxonomy-duplicate"
                  : undefined
            }
            onChange={(event) => {
              setName(event.target.value);
              edited();
            }}
          />
          {required && (
            <p id="taxonomy-required" className="text-sm text-destructive">
              {copy.nameRequired}
            </p>
          )}
          {duplicate && (
            <p
              id="taxonomy-duplicate"
              role="alert"
              className="text-sm text-destructive"
            >
              {copy.errors.duplicate}
            </p>
          )}
        </Field>
        <Button type="submit" size="lg" disabled={busy} className="motion-reduce:transition-none">
          {createState === "pending" ? copy.adding : copy.add}
        </Button>
        <div className="min-h-12">
          <p ref={feedback} tabIndex={-1} role="status" aria-live="polite">
            {createState === "created" ? createdMessage : ""}
          </p>
          {createState === "failed" && !duplicate && (
            <p role="alert">{createFailure}</p>
          )}
          {createState === "uncertain" && <p role="alert">{copy.uncertain}</p>}
        </div>
      </form>

      {items.length ? (
        <ul className="space-y-4">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-control border border-border p-4"
            >
              <div className="min-w-0 space-y-1">
                <p className="wrap-anywhere">{fa(item.name)}</p>
                {item.slug.trim() && (
                  <p className="text-sm text-muted-foreground">
                    <bdi>{item.slug}</bdi>
                  </p>
                )}
              </div>
              <Button
                size="lg"
                variant="destructive"
                disabled={busy}
                aria-haspopup="dialog"
                onClick={() => {
                  setSelected(item);
                  setDeleteState("idle");
                  setDeleteFailure("");
                }}
              >
                {copy.delete}
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p>{copy.empty}</p>
      )}

      <p
        ref={deleteFeedback}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className="min-h-12"
      >
        {deleteState === "deleted" ? deletedMessage : ""}
      </p>

      <Dialog
        open={Boolean(selected)}
        role="alertdialog"
        title={deleteTitle}
        description={
          <>
            آیا «{fa(selected?.name ?? "")}» حذف شود؟ {copy.deleteDescription}
          </>
        }
        dismissible={deleteState !== "pending"}
        onOpenChange={(open) => {
          if (!open && !pending.current) setSelected(null);
        }}
        footer={
          <>
            <Button
              data-autofocus=""
              size="lg"
              variant="outline"
              disabled={deleteState === "pending"}
              onClick={() => setSelected(null)}
            >
              {copy.cancel}
            </Button>
            <Button
              size="lg"
              variant="destructive"
              disabled={deleteState === "pending" || deleteState === "uncertain"}
              onClick={remove}
            >
              {copy.deleteConfirm}
            </Button>
          </>
        }
      >
        {deleteState === "pending" && <p role="status">{copy.deleting}</p>}
        {deleteState === "failed" && <p role="alert">{deleteFailure}</p>}
        {deleteState === "uncertain" && <p role="alert">{copy.uncertain}</p>}
      </Dialog>
    </Card>
  );
}

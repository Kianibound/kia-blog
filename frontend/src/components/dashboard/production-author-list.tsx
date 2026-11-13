"use client";

import { useRef, useState } from "react";
import { deactivateAuthorAction } from "@/app/dashboard/author-actions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { authorsMessages as copy, authorErrorMessage } from "@/i18n/messages/authors.fa";
import type { AdminAuthorRecord } from "@/lib/admin-authors-contract";
import { fa } from "@/lib/utils";

export function ProductionAuthorList({
  initialAuthors,
  csrfToken,
}: {
  initialAuthors: AdminAuthorRecord[];
  csrfToken: string;
}) {
  const [authors, setAuthors] = useState(initialAuthors);
  const [selected, setSelected] = useState<AdminAuthorRecord | null>(null);
  const [state, setState] = useState<
    "idle" | "pending" | "deactivated" | "failed" | "uncertain"
  >("idle");
  const [failure, setFailure] = useState("");
  const pending = useRef(false);
  const feedback = useRef<HTMLParagraphElement>(null);

  async function confirm() {
    if (!selected || pending.current || state === "uncertain") return;
    pending.current = true;
    setState("pending");
    setFailure("");
    try {
      const result = await deactivateAuthorAction(selected.id, csrfToken);
      if (result.state === "success") {
        setAuthors((current) =>
          current.map((item) =>
            item.id === result.author.id ? result.author : item,
          ),
        );
        setSelected(null);
        setState("deactivated");
        requestAnimationFrame(() => feedback.current?.focus());
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

  return (
    <>
      {authors.length ? (
        <ul className="space-y-4">
          {authors.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-start justify-between gap-4 rounded-control border border-border p-4 wrap-anywhere"
            >
              <div className="min-w-0 space-y-1">
                <p className="font-semibold">
                  {fa(item.name?.trim() || item.username)}
                </p>
                <p>
                  <bdi>{item.email}</bdi>
                </p>
                <p className="text-sm text-muted-foreground">
                  {item.disabledAt ? copy.disabled : copy.active}
                </p>
              </div>
              {!item.disabledAt && (
                <Button
                  size="lg"
                  variant="destructive"
                  aria-haspopup="dialog"
                  onClick={() => {
                    setSelected(item);
                    setState("idle");
                    setFailure("");
                  }}
                >
                  {copy.deactivate}
                </Button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>{copy.empty}</p>
      )}
      <p
        ref={feedback}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className="min-h-12"
      >
        {state === "deactivated" ? copy.deactivated : ""}
      </p>
      <Dialog
        open={Boolean(selected)}
        role="alertdialog"
        title={copy.deactivateTitle}
        description={
          <>
            آیا «{fa(selected?.name?.trim() || selected?.username || "")}» غیرفعال شود؟{" "}
            {copy.deactivateDescription}
          </>
        }
        dismissible={state !== "pending"}
        onOpenChange={(open) => {
          if (!open && !pending.current) setSelected(null);
        }}
        footer={
          <>
            <Button
              data-autofocus=""
              size="lg"
              variant="outline"
              disabled={state === "pending"}
              onClick={() => setSelected(null)}
            >
              {copy.cancel}
            </Button>
            <Button
              size="lg"
              variant="destructive"
              disabled={state === "pending" || state === "uncertain"}
              onClick={confirm}
            >
              {copy.deactivateConfirm}
            </Button>
          </>
        }
      >
        {state === "pending" && <p role="status">{copy.deactivating}</p>}
        {state === "failed" && <p role="alert">{failure}</p>}
        {state === "uncertain" && <p role="alert">{copy.uncertain}</p>}
      </Dialog>
    </>
  );
}

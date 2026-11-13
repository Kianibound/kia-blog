"use client";

import { useRef, useState } from "react";
import { Bookmark } from "lucide-react";
import { setBookmarkAction } from "@/app/bookmark-actions";
import { Button } from "@/components/ui/button";
import {
  bookmarkErrorMessage,
  bookmarksMessages as copy,
} from "@/i18n/messages/bookmarks.fa";

type State = "idle" | "pending" | "success" | "failed" | "uncertain";

export function ProductionBookmarkButton({
  postId,
  initialSaved,
  csrfToken,
  onChange,
}: {
  postId: string;
  initialSaved: boolean;
  csrfToken: string;
  onChange?: (saved: boolean) => void;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [state, setState] = useState<State>("idle");
  const [failure, setFailure] = useState("");
  const locked = useRef(false);
  const busy = state === "pending";
  const blocked = busy || state === "uncertain";
  const message =
    busy
      ? copy.saving
      : state === "success"
        ? saved
          ? copy.saved
          : copy.removed
        : "";

  async function toggle() {
    if (locked.current || blocked) return;
    locked.current = true;
    setState("pending");
    setFailure("");
    const next = !saved;
    try {
      const result = await setBookmarkAction(postId, next, csrfToken);
      if (result.state === "success") {
        setSaved(next);
        setState("success");
        onChange?.(next);
      } else if (result.state === "failure") {
        setState("failed");
        setFailure(bookmarkErrorMessage(result.reason));
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
    <div className="relative size-12" aria-busy={busy}>
      <Button
        size="icon"
        variant="outline"
        className="size-12 bg-card [&_svg]:size-5"
        aria-label={saved ? copy.unsave : copy.save}
        aria-pressed={saved}
        disabled={blocked}
        onClick={() => void toggle()}
      >
        <Bookmark aria-hidden="true" fill={saved ? "currentColor" : "none"} />
      </Button>
      <p
        role={
          state === "failed" || state === "uncertain"
            ? "alert"
            : message
              ? "status"
              : undefined
        }
        aria-live="polite"
        aria-atomic="true"
        className={
          state === "failed" || state === "uncertain"
            ? "absolute end-0 top-full z-10 mt-2 w-56 rounded-surface border border-border bg-card p-3 text-sm shadow"
            : "sr-only"
        }
      >
        {state === "uncertain" ? copy.uncertain : failure || message}
      </p>
    </div>
  );
}

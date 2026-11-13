"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  profileErrorMessage,
  profileMessages as copy,
} from "@/i18n/messages/profile.fa";
import { validateImageFile } from "@/lib/media-upload";
import { removeAvatar, uploadAvatar } from "@/lib/profile-avatar";

type State =
  | "idle"
  | "saving"
  | "removing"
  | "saved"
  | "removed"
  | "failed"
  | "conflict"
  | "uncertain";

export function ProductionAvatarEditor({
  initialAvatarUrl,
  csrfToken,
}: {
  initialAvatarUrl: string | null;
  csrfToken: string;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialAvatarUrl);
  const [file, setFile] = useState<File>();
  const [preview, setPreview] = useState<string | null>(null);
  const [inputKey, setInputKey] = useState(0);
  const [invalid, setInvalid] = useState<"invalid" | "too-large" | null>(null);
  const [state, setState] = useState<State>("idle");
  const [failure, setFailure] = useState("");
  const objectUrl = useRef<string | null>(null);
  const pending = useRef(false);

  const busy = state === "saving" || state === "removing";
  const blocked = busy || state === "uncertain" || state === "conflict";

  useEffect(
    () => () => {
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    },
    [],
  );

  function clearSelection(resetInput = true) {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = null;
    setPreview(null);
    setFile(undefined);
    setInvalid(null);
    if (resetInput) setInputKey((value) => value + 1);
  }

  function select(next?: File) {
    clearSelection(false);
    setState("idle");
    setFailure("");
    if (!next) return;
    const problem = validateImageFile(next);
    if (problem === "invalid" || problem === "too-large") {
      setInvalid(problem);
      return;
    }
    objectUrl.current = URL.createObjectURL(next);
    setPreview(objectUrl.current);
    setFile(next);
  }

  async function save() {
    if (!file || pending.current || blocked) return;
    pending.current = true;
    setState("saving");
    setFailure("");
    try {
      const result = await uploadAvatar(file, { csrfToken });
      if (result.state === "success") {
        setSaved(result.profile.avatarUrl);
        clearSelection();
        setState("saved");
      } else if (result.state === "failure") {
        if (result.reason === "conflict") setState("conflict");
        else {
          setState("failed");
          setFailure(profileErrorMessage(result.reason));
        }
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

  async function remove() {
    if (!saved || pending.current || blocked) return;
    pending.current = true;
    setState("removing");
    setFailure("");
    try {
      const result = await removeAvatar({ csrfToken });
      if (result.state === "success") {
        setSaved(null);
        clearSelection();
        setState("removed");
      } else if (result.state === "failure") {
        if (result.reason === "conflict") setState("conflict");
        else {
          setState("failed");
          setFailure(profileErrorMessage(result.reason));
        }
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

  const message =
    state === "saving"
      ? copy.saving
      : state === "removing"
        ? copy.removing
        : state === "saved"
          ? copy.saved
          : state === "removed"
            ? copy.removed
            : "";

  return (
    <Card className="min-h-96 space-y-6 p-6 sm:p-8">
      <div className="flex size-32 items-center justify-center overflow-hidden rounded-surface border border-border bg-secondary">
        {preview || saved ? (
          // Server-resolved Cloudinary URLs and transient local previews only.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview ?? saved!}
            alt={preview ? copy.preview : copy.title}
            width={128}
            height={128}
            className="aspect-square size-32 object-cover"
          />
        ) : (
          <div role="img" aria-label={copy.none}>
            <UserRound aria-hidden="true" className="size-12" strokeWidth={1.5} />
          </div>
        )}
      </div>
      {preview && <p>{copy.selected}</p>}
      <Field label={copy.fileLabel} htmlFor="avatar-file" hint={copy.help}>
        <Input
          key={inputKey}
          id="avatar-file"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={blocked}
          className="min-h-12 min-w-0 max-w-full"
          aria-invalid={Boolean(invalid)}
          aria-describedby={invalid ? "avatar-file-error" : undefined}
          onChange={(event) => select(event.target.files?.[0])}
        />
        {invalid && (
          <p id="avatar-file-error" role="alert" className="text-sm text-destructive">
            {invalid === "too-large" ? copy.errors["too-large"] : copy.errors.invalid}
          </p>
        )}
      </Field>
      <div className="min-h-24" aria-live="polite">
        {(busy || state === "saved" || state === "removed") && (
          <div role="status" className="space-y-2">
            <p>{message}</p>
            {busy && <Skeleton className="h-12 w-full motion-reduce:animate-none" />}
          </div>
        )}
        {state === "failed" && <p role="alert">{failure}</p>}
        {state === "uncertain" && <p role="alert">{copy.uncertain}</p>}
        {state === "conflict" && (
          <div role="alert" className="space-y-4">
            <p>{copy.conflict}</p>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                setState("idle");
                router.refresh();
              }}
            >
              {copy.reload}
            </Button>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-4">
        <Button
          size="lg"
          disabled={!file || Boolean(invalid) || blocked}
          className="motion-reduce:transition-none"
          onClick={() => void save()}
        >
          {state === "saving" ? copy.saving : copy.save}
        </Button>
        <Button
          size="lg"
          variant="outline"
          disabled={!saved || blocked}
          onClick={() => void remove()}
        >
          {state === "removing" ? copy.removing : copy.remove}
        </Button>
      </div>
    </Card>
  );
}

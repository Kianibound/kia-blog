"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { articleFormMessages as copy } from "@/i18n/messages/article-form.fa";
import { editorMessages } from "@/i18n/messages/editor.fa";
import { parseCoverImage, type CoverImage } from "@/lib/posts-contract";

export function CoverImageField({ value, disabled, uploadImage, onChange, onPending }: {
  value: CoverImage | null; disabled: boolean;
  uploadImage: (file: File, signal: AbortSignal) => Promise<string>;
  onChange: (value: CoverImage | null) => void; onPending: (pending: boolean) => void;
}) {
  const [file, setFile] = useState<File>();
  const [alt, setAlt] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const request = useRef<AbortController | null>(null);
  const [inputKey, setInputKey] = useState(0);
  useEffect(() => () => request.current?.abort(), []);

  function cancel() {
    request.current?.abort(); request.current = null;
    setUploading(false); setFile(undefined); setAlt(""); setError(""); onPending(false);
    setInputKey(value => value + 1);
  }

  async function choose() {
    if (disabled || request.current) return;
    if (!file || !alt.trim()) { setError(editorMessages.imageRequired); return; }
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || !file.size || file.size > 5 * 1024 * 1024) { setError(editorMessages.imageInvalid); return; }
    const controller = new AbortController(); request.current = controller;
    setUploading(true); setError(""); onPending(true);
    try {
      const src = await uploadImage(file, controller.signal);
      if (controller.signal.aborted) return;
      onChange(parseCoverImage({ src, alt: alt.trim() }));
      cancel();
    } catch { if (!controller.signal.aborted) setError(editorMessages.imageError); }
    finally { if (request.current === controller) { request.current = null; setUploading(false); } }
  }

  return <fieldset disabled={disabled} className="min-w-0 space-y-4">
    <legend className="text-sm font-medium">{copy.cover}</legend>
    <p id="cover-help" className="text-sm text-muted-foreground">{copy.coverHelp} {editorMessages.imageHelp}</p>
    {/* Selected bytes are served by the supplied fixture adapter, without image optimization. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    {value && <img src={value.src} alt={value.alt} width={640} height={360} className="aspect-video w-full rounded-field object-cover" />}
    <Field label={copy.coverFile} htmlFor="cover-file"><Input key={inputKey} id="cover-file" type="file" accept="image/png,image/jpeg,image/webp" disabled={uploading} aria-describedby="cover-help cover-error" aria-invalid={Boolean(error)} onChange={event => { setFile(event.target.files?.[0]); setError(""); onPending(Boolean(event.target.files?.length) || Boolean(alt)); }} className="min-h-12 min-w-0 max-w-full" /></Field>
    <Field label={copy.coverAlt} htmlFor="cover-alt"><Input id="cover-alt" value={alt} disabled={uploading} aria-describedby="cover-error" aria-invalid={Boolean(error)} onChange={event => { setAlt(event.target.value); setError(""); onPending(Boolean(file) || Boolean(event.target.value)); }} className="min-h-12" /></Field>
    <div className="min-h-24" aria-live="polite">{uploading && <div role="status"><p>{editorMessages.imageUploading}</p><Skeleton className="h-12 w-full motion-reduce:animate-none" /></div>}<p id="cover-error" role={error ? "alert" : undefined}>{error}</p></div>
    <div className="flex flex-wrap gap-2">
      <Button size="lg" disabled={uploading} onClick={() => void choose()} className="motion-reduce:transition-none">{copy.coverChoose}</Button>
      {(file || alt || uploading) && <Button size="lg" variant="outline" onClick={cancel} className="motion-reduce:transition-none">{copy.coverCancel}</Button>}
      {value && <Button size="lg" variant="outline" onClick={() => { cancel(); onChange(null); }} className="motion-reduce:transition-none">{copy.coverRemove}</Button>}
    </div>
  </fieldset>;
}

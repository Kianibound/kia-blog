"use client";

import { useEffect, useRef, useState } from "react";
import { UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { editorMessages } from "@/i18n/messages/editor.fa";
import { uploadFixtureImage } from "./image-upload";
import { saveFixtureAvatar } from "./avatar-actions";

export function AvatarEditor({ initialSrc }: { initialSrc: string | null }) {
  const [saved, setSaved] = useState(initialSrc);
  const [file, setFile] = useState<File>();
  const [preview, setPreview] = useState<string | null>(null);
  const [inputKey, setInputKey] = useState(0);
  const [state, setState] = useState<"idle" | "pending" | "saved" | "removed" | "error" | "uncertain">("idle");
  const [invalid, setInvalid] = useState(false);
  const objectUrl = useRef<string | null>(null);
  const request = useRef<AbortController | null>(null);
  const pending = useRef(false);
  const busy = state === "pending";
  const blocked = busy || state === "uncertain";
  useEffect(() => () => { if (objectUrl.current) URL.revokeObjectURL(objectUrl.current); request.current?.abort(); }, []);

  function clearSelection(resetInput = true) {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = null; setPreview(null); setFile(undefined); setInvalid(false); if (resetInput) setInputKey(value => value + 1);
  }
  function select(next?: File) {
    clearSelection(false); setState("idle");
    if (!next) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(next.type) || !next.size || next.size > 5 * 1024 * 1024) { setInvalid(true); return; }
    objectUrl.current = URL.createObjectURL(next); setPreview(objectUrl.current); setFile(next);
  }
  async function write(remove: boolean) {
    if (pending.current || state === "uncertain" || (!remove && !file)) return;
    pending.current = true; setState("pending");
    const controller = new AbortController(); request.current = controller;
    let writingReference = false;
    try {
      const src = remove ? null : await uploadFixtureImage(file!, controller.signal);
      if (controller.signal.aborted) return;
      writingReference = true;
      const result = await saveFixtureAvatar(src);
      if (result === "saved") { setSaved(src); clearSelection(); setState(remove ? "removed" : "saved"); }
      else setState(result);
    } catch { if (!controller.signal.aborted) setState(writingReference ? "uncertain" : "error"); }
    finally { pending.current = false; request.current = null; }
  }

  return <Card className="min-h-96 space-y-6 p-6 sm:p-8">
    <p>ذخیره و حذف عکس فقط در داده‌های آزمایشی انجام می‌شود.</p>
    <div className="flex size-32 items-center justify-center overflow-hidden rounded-surface border border-border bg-secondary">
      {/* Fixture and transient local preview bytes bypass image optimization. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {preview || saved ? <img src={preview ?? saved!} alt={preview ? "پیش‌نمایش عکس پروفایل" : "عکس پروفایل"} width={128} height={128} className="aspect-square size-32 object-contain" /> : <div role="img" aria-label="بدون عکس پروفایل"><UserRound aria-hidden="true" className="size-12" strokeWidth={1.5} /></div>}
    </div>
    {preview && <p>تصویر انتخاب‌شده هنوز ذخیره نشده است.</p>}
    <Field label="فایل عکس پروفایل" htmlFor="avatar-file"><Input key={inputKey} id="avatar-file" type="file" accept="image/png,image/jpeg,image/webp" disabled={blocked} onChange={event => select(event.target.files?.[0])} aria-invalid={invalid} aria-describedby="avatar-help avatar-file-error" className="min-h-12 min-w-0 max-w-full" /><p id="avatar-file-error" role={invalid ? "alert" : undefined} className="text-sm text-destructive">{invalid ? editorMessages.imageInvalid : ""}</p></Field>
    <p id="avatar-help" className="text-sm text-muted-foreground">فرمت‌های مجاز: PNG، JPEG و WebP؛ حداکثر اندازه: ۵ مگابایت.</p>
    <div className="min-h-32" aria-live="polite">
      {busy && <div role="status"><p>در حال ذخیرهٔ تغییرات عکس…</p><Skeleton className="h-12 w-full motion-reduce:animate-none" /></div>}
      {(state === "saved" || state === "removed") && <p role="status">{state === "saved" ? "عکس پروفایل در داده‌های آزمایشی ذخیره شد." : "عکس پروفایل از داده‌های آزمایشی حذف شد."}</p>}
      {(state === "error" || state === "uncertain") && <p role="alert">{state === "error" ? "ذخیرهٔ تغییرات عکس انجام نشد. دوباره تلاش کنید." : "نتیجهٔ تغییر عکس مشخص نیست. صفحه را دوباره بارگذاری کنید."}</p>}
    </div>
    <div className="flex flex-wrap gap-4"><Button size="lg" disabled={!file || invalid || blocked} onClick={() => void write(false)}>ذخیرهٔ عکس</Button><Button size="lg" variant="outline" disabled={!saved || blocked} onClick={() => void write(true)}>حذف عکس</Button></div>
  </Card>;
}

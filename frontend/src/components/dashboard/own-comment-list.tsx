"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fa } from "@/lib/utils";
import { validateArticleCommentText, type CommentModerationResult, type ModerationComment } from "@/lib/comment-moderation-contract";

// Presentation only. Test-only adapters enforce the current fixture USER's ownership.
export function OwnCommentList({ initialComments, saveAction, deleteAction }: {
  initialComments: ModerationComment[];
  saveAction: (id: string, text: string) => Promise<CommentModerationResult>;
  deleteAction: (id: string) => Promise<CommentModerationResult>;
}) {
  const [comments, setComments] = useState(initialComments);
  const [selected, setSelected] = useState<ModerationComment | null>(null);
  const [operation, setOperation] = useState<"edit" | "delete">("edit");
  const [text, setText] = useState("");
  const [validation, setValidation] = useState("");
  const [state, setState] = useState<"idle" | "pending" | "saved" | "deleted" | "error" | "uncertain">("idle");
  const locked = useRef(false);
  const feedback = useRef<HTMLParagraphElement>(null);
  const busy = state === "pending";
  const blocked = busy || state === "uncertain";
  const failed = state === "error" || state === "uncertain";
  const message = busy ? operation === "edit" ? "در حال ثبت تغییرات…" : "در حال حذف کامنت…" : state === "saved" ? "کامنت ویرایش شد و در انتظار تأیید است." : state === "deleted" ? "کامنت حذف شد." : state === "error" ? "انجام عملیات ممکن نشد. دوباره تلاش کنید." : state === "uncertain" ? "نتیجهٔ عملیات مشخص نیست. پیش از تلاش دوباره، صفحه را بارگذاری کنید." : "";

  function open(comment: ModerationComment, next: "edit" | "delete") {
    if (blocked) return;
    setSelected(comment); setOperation(next); setText(comment.text); setValidation(""); setState("idle");
  }

  async function run() {
    if (!selected || locked.current || state === "uncertain") return;
    const error = operation === "edit" ? validateArticleCommentText(text) : "";
    setValidation(error);
    if (error) { document.getElementById("own-comment-text")?.focus(); return; }
    locked.current = true; setState("pending");
    try {
      const result = operation === "edit" ? await saveAction(selected.id, text.trim()) : await deleteAction(selected.id);
      if (result === "saved") {
        setComments(current => operation === "delete" ? current.filter(item => item.id !== selected.id) : current.map(item => item.id === selected.id ? { ...item, text: text.trim(), status: "PENDING" } : item));
        setState(operation === "delete" ? "deleted" : "saved"); setSelected(null);
        requestAnimationFrame(() => feedback.current?.focus());
      } else setState(result);
    } catch { setState("uncertain"); }
    finally { locked.current = false; }
  }

  return <section aria-label="فهرست کامنت‌های من" aria-busy={busy} className="min-h-160 space-y-6">
    {comments.length ? <ul className="space-y-4">{comments.map(comment => <li key={comment.id}><Card className="space-y-4 p-6">
      <p className="whitespace-pre-wrap wrap-anywhere">{fa(comment.text)}</p>
      <p><span className="rounded-control bg-secondary px-4 py-2 text-sm text-secondary-foreground">{comment.status === "PENDING" ? "در انتظار تأیید" : "تأییدشده"}</span></p>
      <div className="flex flex-wrap gap-4"><Button size="lg" disabled={blocked} onClick={() => open(comment, "edit")}>ویرایش</Button><Button size="lg" variant="destructive" disabled={blocked} aria-haspopup="dialog" onClick={() => open(comment, "delete")}>حذف کامنت</Button></div>
    </Card></li>)}</ul> : <Card className="min-h-64 p-6"><p>هنوز کامنتی ثبت نکرده‌اید.</p></Card>}
    <p ref={feedback} tabIndex={-1} role={!selected && message ? failed ? "alert" : "status" : undefined} aria-live="polite" className="min-h-24">{!selected ? message : ""}</p>
    <Dialog open={Boolean(selected)} role={operation === "delete" ? "alertdialog" : "dialog"} title={operation === "delete" ? "حذف کامنت" : "ویرایش کامنت"} description={operation === "delete" ? <span className="wrap-anywhere">آیا کامنت «{fa(selected?.text ?? "")}» حذف شود؟</span> : "پس از ویرایش، کامنت دوباره در انتظار تأیید مدیر قرار می‌گیرد."} dismissible={!busy} onOpenChange={value => { if (!value && !locked.current) setSelected(null); }} footer={<>
      <Button data-autofocus={operation === "delete" ? "" : undefined} size="lg" variant="outline" disabled={busy} onClick={() => setSelected(null)}>انصراف</Button>
      {operation === "edit" ? <Button size="lg" type="submit" form="own-comment-form" disabled={blocked}>ثبت تغییرات</Button> : <Button size="lg" variant="destructive" disabled={blocked} onClick={() => void run()}>تأیید حذف</Button>}
    </>}>
      {operation === "edit" && <form id="own-comment-form" noValidate onSubmit={event => { event.preventDefault(); void run(); }} className="space-y-4"><Field label="متن کامنت" htmlFor="own-comment-text"><Textarea data-autofocus="" id="own-comment-text" value={text} onChange={event => setText(event.target.value)} disabled={blocked} aria-invalid={!!validation} aria-describedby="own-comment-error" /></Field><p id="own-comment-error" className="min-h-12 text-sm text-destructive">{validation}</p></form>}
      <p role={message && (busy || failed) ? failed ? "alert" : "status" : undefined} aria-live="polite" className="min-h-24">{busy || failed ? message : ""}</p>
    </Dialog>
  </section>;
}

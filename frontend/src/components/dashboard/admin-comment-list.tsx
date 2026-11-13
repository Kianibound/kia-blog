"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { fa } from "@/lib/utils";
import type { CommentModerationResult, CommentOperation, ModerationComment } from "@/lib/comment-moderation-contract";

// Presentation only; moderation is supplied explicitly by the test-only ADMIN host.
export function AdminCommentList({ initialComments, action }: { initialComments: ModerationComment[]; action: (id: string, operation: CommentOperation) => Promise<CommentModerationResult> }) {
  const [comments, setComments] = useState(initialComments);
  const [selected, setSelected] = useState<ModerationComment | null>(null);
  const [operation, setOperation] = useState<CommentOperation>("approve");
  const [state, setState] = useState<"idle" | "pending" | "approved" | "deleted" | "error" | "uncertain">("idle");
  const pending = useRef(false);
  const feedback = useRef<HTMLParagraphElement>(null);
  const busy = state === "pending";
  const blocked = busy || state === "uncertain";
  const message = state === "pending" ? operation === "approve" ? "در حال تأیید کامنت…" : "در حال حذف کامنت…" : state === "approved" ? "کامنت در داده‌های آزمایشی تأیید شد." : state === "deleted" ? "کامنت از داده‌های آزمایشی حذف شد." : state === "error" ? "انجام عملیات ممکن نشد. دوباره تلاش کنید." : state === "uncertain" ? "نتیجهٔ عملیات مشخص نیست. صفحه را دوباره بارگذاری کنید." : "";
  const failed = state === "error" || state === "uncertain";

  async function run(comment: ModerationComment, nextOperation: CommentOperation) {
    if (pending.current || state === "uncertain") return;
    pending.current = true;
    setOperation(nextOperation);
    setState("pending");
    try {
      const result = await action(comment.id, nextOperation);
      if (result === "saved") {
        setComments(current => nextOperation === "delete" ? current.filter(item => item.id !== comment.id) : current.map(item => item.id === comment.id ? { ...item, status: "APPROVED" } : item));
        setState(nextOperation === "delete" ? "deleted" : "approved");
        setSelected(null);
        requestAnimationFrame(() => feedback.current?.focus());
      } else setState(result);
    } catch { setState("uncertain"); }
    finally { pending.current = false; }
  }

  return <section className="min-h-64 space-y-6" aria-label="فهرست کامنت‌ها" aria-busy={busy}>
    {comments.length ? <ul className="space-y-4">{comments.map(comment => <li key={comment.id}><Card className="space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4"><p className="font-semibold wrap-anywhere">{fa(comment.name)}</p><span className="rounded-control bg-secondary px-4 py-2 text-sm text-secondary-foreground">{comment.status === "PENDING" ? "در انتظار تأیید" : "تأییدشده"}</span></div>
      <p className="whitespace-pre-wrap wrap-anywhere">{fa(comment.text)}</p>
      <div className="flex flex-wrap gap-4">
        {comment.status === "PENDING" && <Button size="lg" disabled={blocked} onClick={() => void run(comment, "approve")}>تأیید</Button>}
        <Button size="lg" variant="destructive" disabled={blocked} aria-haspopup="dialog" onClick={() => { setSelected(comment); setState("idle"); }}>حذف کامنت</Button>
      </div>
    </Card></li>)}</ul> : <Card className="min-h-64 p-6"><p>کامنتی برای نمایش وجود ندارد.</p></Card>}
    <p ref={feedback} tabIndex={-1} role={!selected && message ? failed ? "alert" : "status" : undefined} aria-live="polite" className="min-h-12">{!selected ? message : ""}</p>
    <Dialog open={Boolean(selected)} role="alertdialog" title="حذف کامنت" description={<span className="wrap-anywhere">آیا کامنت «{fa(selected?.text ?? "")}» از داده‌های آزمایشی حذف شود؟</span>} dismissible={!busy} onOpenChange={open => { if (!open && !pending.current) setSelected(null); }}
      footer={<><Button data-autofocus="" size="lg" variant="outline" disabled={busy} onClick={() => setSelected(null)}>انصراف</Button><Button size="lg" variant="destructive" disabled={blocked} onClick={() => { if (selected) void run(selected, "delete"); }}>تأیید حذف</Button></>}>
      {message && (busy || failed) && <p role={failed ? "alert" : "status"}>{message}</p>}
    </Dialog>
  </section>;
}

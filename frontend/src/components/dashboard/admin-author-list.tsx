"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { fa } from "@/lib/utils";

export type AdminAuthor = { id: string; name: string; email: string };
export type AuthorDeleteResult = "deleted" | "error" | "uncertain";

// Presentation only; the test preview supplies the deletion adapter.
export function AdminAuthorList({ initialAuthors, deleteAction }: { initialAuthors: AdminAuthor[]; deleteAction: (id: string) => Promise<AuthorDeleteResult> }) {
  const [authors, setAuthors] = useState(initialAuthors);
  const [selected, setSelected] = useState<AdminAuthor | null>(null);
  const [state, setState] = useState<"idle" | "pending" | AuthorDeleteResult>("idle");
  const pending = useRef(false);
  const feedback = useRef<HTMLParagraphElement>(null);

  async function confirm() {
    if (!selected || pending.current || state === "uncertain") return;
    pending.current = true;
    setState("pending");
    try {
      const result = await deleteAction(selected.id);
      setState(result);
      if (result === "deleted") {
        setAuthors(current => current.filter(item => item.id !== selected.id));
        setSelected(null);
        requestAnimationFrame(() => feedback.current?.focus());
      }
    } catch { setState("uncertain"); }
    finally { pending.current = false; }
  }

  return <>
    {authors.length ? <ul className="space-y-4">{authors.map(item => <li key={item.id} className="space-y-4 rounded-control border border-border p-4 wrap-anywhere">
      <p className="font-semibold">{fa(item.name)}</p><p><bdi>{item.email}</bdi></p>
      <Button size="lg" variant="destructive" aria-haspopup="dialog" onClick={() => { setSelected(item); setState("idle"); }}>حذف</Button>
    </li>)}</ul> : <p>هنوز نویسنده‌ای ایجاد نشده است.</p>}
    <p ref={feedback} tabIndex={-1} role="status" aria-live="polite" className="min-h-12">{state === "deleted" ? "نویسنده از داده‌های آزمایشی حذف شد." : ""}</p>
    <Dialog open={Boolean(selected)} role="alertdialog" title="حذف نویسنده" description={<>آیا «{fa(selected?.name ?? "")}» از فهرست آزمایشی حذف شود؟ مقاله‌ها، دیدگاه‌ها و رسانه‌ها حذف نمی‌شوند.</>} dismissible={state !== "pending"} onOpenChange={open => { if (!open && !pending.current) setSelected(null); }}
      footer={<><Button data-autofocus="" size="lg" variant="outline" disabled={state === "pending"} onClick={() => setSelected(null)}>انصراف</Button><Button size="lg" variant="destructive" disabled={state === "pending" || state === "uncertain"} onClick={confirm}>تأیید حذف</Button></>}>
      {state === "pending" && <p role="status">در حال حذف نویسنده…</p>}
      {state === "error" && <p role="alert">حذف نویسنده انجام نشد. دوباره تلاش کنید.</p>}
      {state === "uncertain" && <p role="alert">نتیجهٔ حذف مشخص نیست. فهرست را دوباره بارگذاری کنید.</p>}
    </Dialog>
  </>;
}

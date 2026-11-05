"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthorPostList } from "./author-post-list";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { fa } from "@/lib/utils";
import type { OwnPost, OwnPosts } from "@/lib/own-posts-contract";

export type ArticleDeleteResult = "deleted" | "error" | "uncertain";

// The test-only ADMIN host supplies deletion. The shared AUTHOR list has no action.
export function AdminArticleList({ posts, authors, deleteAction }: { posts: OwnPosts; authors: Record<string, string>; deleteAction: (id: string) => Promise<ArticleDeleteResult> }) {
  const router = useRouter();
  const [selected, setSelected] = useState<OwnPost | null>(null);
  const [state, setState] = useState<"idle" | "pending" | ArticleDeleteResult>("idle");
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
        setSelected(null);
        router.refresh();
        requestAnimationFrame(() => feedback.current?.focus());
      }
    } catch { setState("uncertain"); }
    finally { pending.current = false; }
  }

  return <>
    <AuthorPostList posts={posts} authors={authors} href={page => page === 1 ? "/dashboard/posts" : `/dashboard/posts?page=${page}`} formLinks={{ edit: id => `/dashboard/posts/${encodeURIComponent(id)}/edit` }}
      renderAction={post => <Button size="lg" variant="destructive" aria-haspopup="dialog" disabled={state === "pending"} onClick={() => { setSelected(post); setState("idle"); }}>حذف مقاله</Button>} />
    <p ref={feedback} tabIndex={-1} role={state === "deleted" ? "status" : undefined} aria-live="polite" className="min-h-12">{state === "deleted" ? "مقاله از داده‌های آزمایشی حذف شد." : ""}</p>
    <Dialog open={Boolean(selected)} role="alertdialog" title="حذف مقاله" description={<>آیا مقالهٔ «{fa(selected?.title ?? "")}» برای همیشه از داده‌های آزمایشی حذف شود؟</>} dismissible={state !== "pending"} onOpenChange={open => { if (!open && !pending.current) setSelected(null); }}
      footer={<><Button data-autofocus="" size="lg" variant="outline" disabled={state === "pending"} onClick={() => setSelected(null)}>انصراف</Button><Button size="lg" variant="destructive" disabled={state === "pending" || state === "uncertain"} onClick={confirm}>تأیید حذف مقاله</Button></>}>
      {state === "pending" && <p role="status">در حال حذف مقاله…</p>}
      {state === "error" && <p role="alert">حذف مقاله انجام نشد. دوباره تلاش کنید.</p>}
      {state === "uncertain" && <p role="alert">نتیجهٔ حذف مشخص نیست. فهرست را دوباره بارگذاری کنید.</p>}
    </Dialog>
  </>;
}

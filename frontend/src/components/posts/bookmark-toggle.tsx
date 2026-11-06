"use client";
import { useRef, useState } from "react";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BookmarkWriteResult } from "@/lib/posts-contract";

export function BookmarkToggle({ initialSaved, action, onChange }: { initialSaved: boolean; action: (saved: boolean) => Promise<BookmarkWriteResult>; onChange?: (saved: boolean) => void }) {
  const [saved, setSaved] = useState(initialSaved);
  const [state, setState] = useState<"idle" | "pending" | "success" | "error" | "uncertain">("idle");
  const locked = useRef(false);
  const busy = state === "pending";
  const message = busy ? "در حال ثبت ذخیره‌سازی…" : state === "success" ? saved ? "مقاله ذخیره شد." : "مقاله از ذخیره‌شده‌ها حذف شد." : state === "error" ? "انجام عملیات ممکن نشد. دوباره تلاش کنید." : state === "uncertain" ? "نتیجهٔ عملیات مشخص نیست. پیش از تلاش دوباره، صفحه را بارگذاری کنید." : "";
  return <div className="relative size-12" aria-busy={busy}>
    <Button size="icon" className="size-12 bg-card [&_svg]:size-5" variant="outline" aria-label={saved ? "حذف از ذخیره‌شده‌ها" : "ذخیره مقاله"} aria-pressed={saved} disabled={busy || state === "uncertain"} onClick={async () => {
      if (locked.current || state === "uncertain") return;
      locked.current = true; setState("pending");
      const next = !saved;
      try {
        const result = await action(next);
        if (result === "saved") { setSaved(next); setState("success"); onChange?.(next); }
        else setState(result);
      } catch { setState("uncertain"); }
      finally { locked.current = false; }
    }}><Bookmark aria-hidden="true" fill={saved ? "currentColor" : "none"} /></Button>
    <p role={message ? state === "error" || state === "uncertain" ? "alert" : "status" : undefined} aria-live="polite" aria-atomic="true" className={state === "error" || state === "uncertain" ? "absolute end-0 top-full z-10 mt-2 w-56 rounded-surface border border-border bg-card p-3 text-sm shadow" : "sr-only"}>{message}</p>
  </div>;
}

"use client";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { BookmarkWriteResult } from "@/lib/posts-contract";

export function BookmarkToggle({ initialSaved, action, onChange }: { initialSaved: boolean; action: (saved: boolean) => Promise<BookmarkWriteResult>; onChange?: (saved: boolean) => void }) {
  const [saved, setSaved] = useState(initialSaved);
  const [state, setState] = useState<"idle" | "pending" | "success" | "error" | "uncertain">("idle");
  const locked = useRef(false);
  const busy = state === "pending";
  const message = busy ? "در حال ثبت ذخیره‌سازی…" : state === "success" ? saved ? "مقاله ذخیره شد." : "مقاله از ذخیره‌شده‌ها حذف شد." : state === "error" ? "انجام عملیات ممکن نشد. دوباره تلاش کنید." : state === "uncertain" ? "نتیجهٔ عملیات مشخص نیست. پیش از تلاش دوباره، صفحه را بارگذاری کنید." : "";
  return <div className="min-h-48 space-y-4" aria-busy={busy}>
    <Button size="lg" variant={saved ? "outline" : "default"} aria-pressed={saved} disabled={busy || state === "uncertain"} onClick={async () => {
      if (locked.current || state === "uncertain") return;
      locked.current = true; setState("pending");
      const next = !saved;
      try {
        const result = await action(next);
        if (result === "saved") { setSaved(next); setState("success"); onChange?.(next); }
        else setState(result);
      } catch { setState("uncertain"); }
      finally { locked.current = false; }
    }}>{saved ? "حذف از ذخیره‌شده‌ها" : "ذخیره مقاله"}</Button>
    <p role={message ? state === "error" || state === "uncertain" ? "alert" : "status" : undefined} aria-live="polite" aria-atomic="true" className="min-h-24">{message}</p>
  </div>;
}

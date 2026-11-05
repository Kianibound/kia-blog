"use client";

import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { fa } from "@/lib/utils";
import type { ArticleTaxonomy } from "@/lib/article-form-contract";

export type TaxonomyKind = "categories" | "tags";
export type TaxonomyCreateResult = { state: "created"; item: ArticleTaxonomy } | { state: "duplicate" | "error" | "uncertain" };
export type TaxonomyDeleteResult = "deleted" | "in-use" | "error" | "uncertain";

// Presentation only. All writes are explicitly supplied by the test-preview host.
export function AdminTaxonomy({ kind, initialItems, createAction, deleteAction }: {
  kind: TaxonomyKind; initialItems: ArticleTaxonomy[];
  createAction: (kind: TaxonomyKind, name: string) => Promise<TaxonomyCreateResult>;
  deleteAction: (kind: TaxonomyKind, id: string) => Promise<TaxonomyDeleteResult>;
}) {
  const label = kind === "categories" ? "دسته‌بندی" : "تگ";
  const [items, setItems] = useState(initialItems);
  const [name, setName] = useState("");
  const [required, setRequired] = useState(false);
  const [selected, setSelected] = useState<ArticleTaxonomy | null>(null);
  const [state, setState] = useState<"idle" | "pending" | "created" | "duplicate" | TaxonomyDeleteResult>("idle");
  const pending = useRef(false);
  const feedback = useRef<HTMLParagraphElement>(null);
  const busy = state === "pending";
  const blocked = busy || state === "uncertain";
  const failed = ["duplicate", "in-use", "error", "uncertain"].includes(state);
  const message = state === "pending" ? "در حال ذخیرهٔ تغییرات…" : state === "created" ? `${label} در داده‌های آزمایشی ایجاد شد.` : state === "deleted" ? `${label} از داده‌های آزمایشی حذف شد.` : state === "in-use" ? "این مورد در مقاله‌ای استفاده شده است و حذف نمی‌شود." : state === "error" ? "انجام عملیات ممکن نشد. دوباره تلاش کنید." : state === "uncertain" ? "نتیجهٔ عملیات مشخص نیست. صفحه را دوباره بارگذاری کنید." : "";

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current || state === "uncertain") return;
    if (!name.trim()) { setRequired(true); event.currentTarget.querySelector("input")?.focus(); return; }
    pending.current = true; setState("pending");
    try {
      const result = await createAction(kind, name.trim());
      setState(result.state);
      if (result.state === "created") { setItems(current => [...current, result.item]); setName(""); }
    } catch { setState("uncertain"); }
    finally { pending.current = false; }
  }

  async function remove() {
    if (!selected || pending.current || state === "uncertain") return;
    pending.current = true; setState("pending");
    try {
      const result = await deleteAction(kind, selected.id);
      setState(result);
      if (result === "deleted") { setItems(current => current.filter(item => item.id !== selected.id)); setSelected(null); requestAnimationFrame(() => feedback.current?.focus()); }
    } catch { setState("uncertain"); }
    finally { pending.current = false; }
  }

  return <Card className="min-h-64 space-y-6 p-6 sm:p-8">
    <form noValidate onSubmit={create} className="space-y-4" aria-busy={busy}>
      <Field label={`نام ${label}`} htmlFor="taxonomy-name"><Input id="taxonomy-name" name="name" required value={name} disabled={blocked} onChange={event => { setName(event.target.value); setRequired(false); setState("idle"); }} className="min-h-12" aria-invalid={required || state === "duplicate"} aria-describedby={required ? "taxonomy-required" : state === "duplicate" ? "taxonomy-duplicate" : undefined} />{required && <p id="taxonomy-required" className="text-sm text-destructive">نام را وارد کنید.</p>}{state === "duplicate" && <p id="taxonomy-duplicate" role="alert" className="text-sm text-destructive">این نام قبلاً ثبت شده است.</p>}</Field>
      <Button type="submit" size="lg" disabled={blocked}>افزودن</Button>
    </form>
    {items.length ? <ul className="space-y-4">{items.map(item => <li key={item.id} className="flex flex-wrap items-center justify-between gap-4 rounded-control border border-border p-4"><p className="min-w-0 wrap-anywhere">{fa(item.name)}</p><Button size="lg" variant="destructive" disabled={blocked} aria-haspopup="dialog" onClick={() => { setSelected(item); setState("idle"); }}>حذف</Button></li>)}</ul> : <p>موردی برای نمایش وجود ندارد.</p>}
    <p id="taxonomy-feedback" ref={feedback} tabIndex={-1} role={!selected && message ? failed ? "alert" : "status" : undefined} aria-live="polite" className="min-h-12">{!selected ? message : ""}</p>
    <Dialog open={Boolean(selected)} role="alertdialog" title={`حذف ${label}`} description={<span className="wrap-anywhere">آیا «{fa(selected?.name ?? "")}» از داده‌های آزمایشی حذف شود؟</span>} dismissible={!busy} onOpenChange={open => { if (!open && !pending.current) setSelected(null); }}
      footer={<><Button data-autofocus="" size="lg" variant="outline" disabled={busy} onClick={() => setSelected(null)}>انصراف</Button><Button size="lg" variant="destructive" disabled={blocked} onClick={() => void remove()}>تأیید حذف</Button></>}>
      {message && (busy || failed) && <p role={failed ? "alert" : "status"}>{message}</p>}
    </Dialog>
  </Card>;
}

import "server-only";
import Link from "next/link";
import { AdminTaxonomy, type TaxonomyKind } from "@/components/dashboard/admin-taxonomy";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { parseArticleTaxonomy } from "@/lib/article-form-contract";
import { createFixtureTaxonomy, deleteFixtureTaxonomy } from "./taxonomy-actions";

export function TaxonomyNavigation({ kind }: { kind: TaxonomyKind }) {
  return <nav aria-label="مدیریت دسته‌بندی‌ها و تگ‌ها" className="flex flex-wrap gap-4">{([['categories', 'دسته‌بندی‌ها'], ['tags', 'تگ‌ها']] as const).map(([value, label]) => <Link key={value} href={`/dashboard/${value}`} aria-current={value === kind ? "page" : undefined} className="inline-flex min-h-12 items-center rounded-control border border-border px-4 font-semibold focus-visible:outline-2 focus-visible:outline-ring">{label}</Link>)}</nav>;
}

export function AdminTaxonomyLoading() {
  return <Card className="min-h-64 space-y-6 p-6 sm:p-8" aria-busy="true"><p role="status">در حال دریافت فهرست…</p><Skeleton className="h-12 w-full motion-reduce:animate-none" /><Skeleton className="h-12 w-32 motion-reduce:animate-none" /><Skeleton className="h-20 w-full motion-reduce:animate-none" /><Skeleton className="h-20 w-full motion-reduce:animate-none" /></Card>;
}

export async function PreviewAdminTaxonomy({ kind }: { kind: TaxonomyKind }) {
  let items;
  try {
    const response = await fetch(`http://127.0.0.1:4101/dashboard-taxonomies/${kind}`, { cache: "no-store", signal: AbortSignal.timeout(2500) });
    if (!response.ok) throw new Error("Fixture taxonomy unavailable");
    items = parseArticleTaxonomy(await response.json());
  } catch {
    return <Card className="min-h-64 space-y-4 p-6" role="alert"><p>دریافت فهرست ممکن نشد.</p><form><Button size="lg" type="submit">تلاش دوباره</Button></form></Card>;
  }
  return <AdminTaxonomy key={kind} kind={kind} initialItems={items} createAction={createFixtureTaxonomy} deleteAction={deleteFixtureTaxonomy} />;
}

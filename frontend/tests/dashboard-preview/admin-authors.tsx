import "server-only";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminAuthorList } from "@/components/dashboard/admin-author-list";
import { deleteFixtureAuthor } from "./author-actions";

export function AdminAuthorsLoading() {
  return <Card className="min-h-64 space-y-6 p-6 sm:p-8" aria-busy="true">
    <h2 className="text-xl leading-tight font-semibold">نویسندگان</h2>
    <Skeleton className="h-12 w-48 motion-reduce:animate-none" />
    <p role="status">در حال دریافت نویسندگان…</p>
    <Skeleton className="h-20 w-full motion-reduce:animate-none" />
  </Card>;
}

// Minimal test-only record view inside the existing ADMIN workspace.
export async function PreviewAdminAuthors() {
  let authors: { id: string; name: string; email: string }[];
  try {
    const response = await fetch("http://127.0.0.1:4101/dashboard-authors", { cache: "no-store", signal: AbortSignal.timeout(2500) });
    if (!response.ok) throw new Error("Fixture Authors unavailable");
    const data: unknown = await response.json();
    if (!Array.isArray(data) || data.some(item => !item || typeof item.id !== "string" || typeof item.name !== "string" || typeof item.email !== "string")) throw new Error("Invalid fixture Authors");
    authors = data;
  } catch {
    return <Card className="min-h-64 space-y-4 p-6" role="alert"><p>دریافت نویسندگان ممکن نشد.</p><form><Button type="submit" size="lg">تلاش دوباره</Button></form></Card>;
  }
  return <Card id="authors" className="min-h-64 space-y-6 p-6 sm:p-8">
    <h2 className="text-xl leading-tight font-semibold">نویسندگان</h2>
    <Link href="/dashboard/authors/new" className="inline-flex min-h-12 items-center justify-center rounded-control bg-brand px-6 font-semibold text-brand-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">افزودن نویسنده</Link>
    <p>نویسندگان ایجادشده در داده‌های آزمایشی اینجا نمایش داده می‌شوند.</p>
    <AdminAuthorList initialAuthors={authors} deleteAction={deleteFixtureAuthor} />
  </Card>;
}

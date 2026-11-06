import "server-only";
import { BookmarkToggle } from "@/components/posts/bookmark-toggle";
import { SavedArticles } from "@/components/dashboard/saved-articles";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { parseBookmarkState, parseBookmarkedPosts } from "@/lib/posts-contract";
import { readFixtureIdentity } from "./identity";
import { changeFixtureBookmark } from "./bookmark-actions";

export function BookmarkLoading() {
  return <section aria-label="ذخیره‌سازی مقاله" className="mx-auto mt-8 min-h-64 max-w-3xl space-y-4" aria-busy="true"><p role="status">در حال دریافت وضعیت ذخیره…</p><Skeleton className="h-12 w-48 motion-reduce:animate-none" /><Skeleton className="h-24 w-full motion-reduce:animate-none" /></section>;
}

export async function PreviewBookmark({ slug }: { slug: string }) {
  const identity = await readFixtureIdentity();
  let saved: boolean | null = null;
  if (identity?.role === "USER") {
    try {
      const response = await fetch(`http://127.0.0.1:4101/article-bookmarks/${encodeURIComponent(slug)}`, { cache: "no-store", signal: AbortSignal.timeout(2500) });
      if (!response.ok) throw new Error("Fixture bookmark unavailable");
      saved = parseBookmarkState(await response.json(), identity.id, slug);
    } catch { saved = null; }
  }
  return <section aria-label="ذخیره‌سازی مقاله" className="mx-auto mt-8 min-h-64 max-w-3xl">{identity?.role !== "USER" ? <p>ذخیره مقاله در این پیش‌نمایش فقط برای حساب کاربر در دسترس است.</p> : saved === null ? <Card role="alert" className="space-y-4 p-6"><p>دریافت وضعیت ذخیره ممکن نشد.</p><form><Button size="lg" type="submit">تلاش دوباره</Button></form></Card> : <BookmarkToggle key={`${identity.id}:${slug}`} initialSaved={saved} action={changeFixtureBookmark.bind(null, identity.id, slug)} />}</section>;
}

export function SavedArticlesLoading() {
  return <section aria-label="فهرست مقالات ذخیره‌شده" aria-busy="true" className="min-h-256 space-y-6"><p role="status">در حال دریافت مقالات ذخیره‌شده…</p><div className="grid gap-6 md:grid-cols-2">{[0, 1].map(index => <Card key={index} className="min-h-96 space-y-4 p-6"><Skeleton className="h-12 w-full motion-reduce:animate-none" /><Skeleton className="h-6 w-32 motion-reduce:animate-none" /><Skeleton className="h-12 w-48 motion-reduce:animate-none" /></Card>)}</div></section>;
}

export async function PreviewSavedArticles({ userId }: { userId: string }) {
  let posts;
  try {
    const response = await fetch("http://127.0.0.1:4101/dashboard-bookmarks", { cache: "no-store", signal: AbortSignal.timeout(2500) });
    if (!response.ok) throw new Error("Fixture saved articles unavailable");
    posts = parseBookmarkedPosts(await response.json(), userId);
  } catch {
    return <section aria-label="فهرست مقالات ذخیره‌شده" className="min-h-256"><Card role="alert" className="min-h-64 space-y-4 p-6"><p>دریافت مقالات ذخیره‌شده ممکن نشد.</p><form><Button size="lg" type="submit">تلاش دوباره</Button></form></Card></section>;
  }
  return <SavedArticles key={userId} initialPosts={posts} action={changeFixtureBookmark.bind(null, userId)} />;
}

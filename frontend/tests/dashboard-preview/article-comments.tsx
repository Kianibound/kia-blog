import "server-only";
import Link from "next/link";
import { ArticleCommentList, ArticleCommentForm } from "@/components/posts/article-comments";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { parseApprovedComments } from "@/lib/comment-moderation-contract";
import { readFixtureIdentity } from "./identity";
import { submitFixtureArticleComment } from "./article-comment-actions";

export async function PreviewArticleComments({ slug }: { slug: string }) {
  let comments;
  try {
    const response = await fetch(`http://127.0.0.1:4101/article-comments/${encodeURIComponent(slug)}`, { cache: "no-store", signal: AbortSignal.timeout(2500) });
    if (!response.ok) throw new Error("Fixture article Comments unavailable");
    comments = parseApprovedComments(await response.json());
  } catch {
    return <section aria-label="دیدگاه‌های مقاله" className="mx-auto mt-8 min-h-256 max-w-3xl"><Card role="alert" className="min-h-64 space-y-4 p-6"><h2 className="text-2xl font-semibold">دیدگاه‌های مقاله</h2><p>دریافت دیدگاه‌ها ممکن نشد.</p><form><Button size="lg" type="submit">تلاش دوباره</Button></form></Card></section>;
  }
  const identity = await readFixtureIdentity();
  return <section aria-label="دیدگاه‌های مقاله" className="mx-auto mt-8 min-h-256 max-w-3xl space-y-6">
    <h2 className="text-2xl font-semibold">دیدگاه‌های مقاله</h2>
    <ArticleCommentList comments={comments} />
    {identity?.role === "USER" ? <ArticleCommentForm submitAction={submitFixtureArticleComment.bind(null, slug)} /> : <Card className="min-h-128 space-y-4 p-6"><p>{identity ? "ثبت دیدگاه در این پیش‌نمایش فقط برای حساب کاربر در دسترس است." : "برای ثبت دیدگاه وارد حساب کاربر شوید."}</p>{!identity && <Link href="/login" className="inline-flex min-h-12 items-center rounded-control px-4 underline focus-visible:outline-2 focus-visible:outline-ring">ورود</Link>}</Card>}
  </section>;
}

import "server-only";
import { AdminCommentList } from "@/components/dashboard/admin-comment-list";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { parseModerationComments } from "@/lib/comment-moderation-contract";
import { moderateFixtureComment } from "./comment-actions";

export function AdminCommentsLoading() {
  return <section className="min-h-64 space-y-4" aria-busy="true"><p role="status">در حال دریافت کامنت‌ها…</p>{[0, 1].map(index => <Card key={index} className="space-y-4 p-6"><Skeleton className="h-8 w-1/2 motion-reduce:animate-none" /><Skeleton className="h-12 w-full motion-reduce:animate-none" /><Skeleton className="h-12 w-48 motion-reduce:animate-none" /></Card>)}</section>;
}

export async function PreviewAdminComments() {
  let comments;
  try {
    const response = await fetch("http://127.0.0.1:4101/dashboard-comments", { cache: "no-store", signal: AbortSignal.timeout(2500) });
    if (!response.ok) throw new Error("Fixture Comments unavailable");
    comments = parseModerationComments(await response.json());
  } catch {
    return <Card className="min-h-64 space-y-4 p-6" role="alert"><p>دریافت کامنت‌ها ممکن نشد.</p><form><Button size="lg" type="submit">تلاش دوباره</Button></form></Card>;
  }
  return <AdminCommentList initialComments={comments} action={moderateFixtureComment} />;
}

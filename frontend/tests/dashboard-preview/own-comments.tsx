import "server-only";
import { OwnCommentList } from "@/components/dashboard/own-comment-list";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { parseOwnComments } from "@/lib/comment-moderation-contract";
import { saveOwnFixtureComment, deleteOwnFixtureComment } from "./own-comment-actions";

export function OwnCommentsLoading() {
  return <section aria-label="فهرست کامنت‌های من" aria-busy="true" className="min-h-160 space-y-6"><p role="status">در حال دریافت کامنت‌های من…</p>{[0, 1].map(index => <Card key={index} className="space-y-4 p-6"><Skeleton className="h-12 w-full motion-reduce:animate-none" /><Skeleton className="h-8 w-32 motion-reduce:animate-none" /><Skeleton className="h-12 w-48 motion-reduce:animate-none" /></Card>)}</section>;
}

export async function PreviewOwnComments({ userId }: { userId: string }) {
  let comments;
  try {
    const response = await fetch("http://127.0.0.1:4101/dashboard-my-comments", { cache: "no-store", signal: AbortSignal.timeout(2500) });
    if (!response.ok) throw new Error("Fixture own Comments unavailable");
    comments = parseOwnComments(await response.json(), userId);
  } catch {
    return <section aria-label="فهرست کامنت‌های من" className="min-h-160"><Card className="min-h-64 space-y-4 p-6" role="alert"><p>دریافت کامنت‌های شما ممکن نشد.</p><form><Button size="lg" type="submit">تلاش دوباره</Button></form></Card></section>;
  }
  return <OwnCommentList key={userId} initialComments={comments} saveAction={saveOwnFixtureComment} deleteAction={deleteOwnFixtureComment} />;
}

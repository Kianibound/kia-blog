import { redirect } from "next/navigation";
import { ProductionSavedArticles } from "@/components/dashboard/production-saved-articles";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { bookmarksMessages as copy } from "@/i18n/messages/bookmarks.fa";
import type { PublicAccount } from "@/lib/auth/current-user";
import { loadSavedBookmarks } from "@/lib/dashboard/bookmarks";

export function ProductionSavedArticlesLoading() {
  return (
    <section className="min-h-64 space-y-4" aria-busy="true">
      <p role="status">{copy.loading}</p>
      {Array.from({ length: 4 }, (_, index) => (
        <Card key={index} className="space-y-4 p-6">
          <Skeleton className="h-6 w-1/2 motion-reduce:animate-none" />
          <Skeleton className="h-32 w-full motion-reduce:animate-none" />
        </Card>
      ))}
    </section>
  );
}

export async function ProductionSavedArticlesPage({
  account,
}: {
  account: PublicAccount;
}) {
  if (account.user.role !== "USER")
    return (
      <Card role="alert" className="min-h-64 space-y-4 p-6">
        <p>{copy.denied}</p>
      </Card>
    );

  const result = await loadSavedBookmarks();
  if (result.status === "unauthenticated")
    redirect(
      `/session/clear?next=${encodeURIComponent("/dashboard/bookmarks")}`,
    );
  if (result.status === "unavailable")
    return (
      <Card role="alert" className="min-h-64 space-y-4 p-6">
        <p>{copy.unavailable}</p>
        <form action="/dashboard/bookmarks" method="get">
          <Button size="lg" type="submit" className="motion-reduce:transition-none">
            {copy.retry}
          </Button>
        </form>
      </Card>
    );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl leading-tight font-semibold">{copy.title}</h2>
        <p>{copy.description}</p>
      </div>
      <ProductionSavedArticles
        key={result.bookmarks.map((bookmark) => bookmark.id).join("|")}
        initialBookmarks={result.bookmarks}
        csrfToken={account.csrfToken}
      />
    </div>
  );
}

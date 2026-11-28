import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { messages } from "@/i18n/messages/fa";

const still = "motion-reduce:animate-none";

export default function ArticleDetailLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <p role="status">{messages.article.loading}</p>
      <article className="mx-auto max-w-3xl space-y-6" aria-hidden="true">
        <Skeleton className={`h-12 w-40 ${still}`} />
        <Card className="overflow-hidden">
          <Skeleton className={`aspect-video w-full rounded-t-surface ${still}`} />
          <div className="space-y-6 p-6 sm:p-8">
            <div className="space-y-3">
              <Skeleton className={`h-10 w-full ${still}`} />
              <Skeleton className={`h-10 w-2/3 ${still}`} />
            </div>
            <Skeleton className={`h-4 w-48 ${still}`} />
            <div className="flex flex-wrap gap-2">
              <Skeleton className={`h-8 w-20 rounded-md ${still}`} />
              <Skeleton className={`h-8 w-24 rounded-md ${still}`} />
            </div>
          </div>
          <div className="space-y-4 border-t border-border p-6 sm:p-8">
            <Skeleton className={`h-5 w-full ${still}`} />
            <Skeleton className={`h-5 w-full ${still}`} />
            <Skeleton className={`h-5 w-5/6 ${still}`} />
            <Skeleton className={`h-5 w-full ${still}`} />
            <Skeleton className={`h-5 w-3/4 ${still}`} />
            <Skeleton className={`h-5 w-full ${still}`} />
            <Skeleton className={`h-5 w-2/3 ${still}`} />
          </div>
        </Card>
      </article>
      <Card className="mx-auto max-w-3xl space-y-6 p-6 sm:p-8" aria-hidden="true">
        <Skeleton className={`h-6 w-40 ${still}`} />
        {[0, 1].map((index) => (
          <div key={index} className="flex gap-4">
            <Skeleton className={`size-10 shrink-0 rounded-full ${still}`} />
            <div className="flex-1 space-y-3">
              <Skeleton className={`h-4 w-32 ${still}`} />
              <Skeleton className={`h-4 w-full ${still}`} />
              <Skeleton className={`h-4 w-4/5 ${still}`} />
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

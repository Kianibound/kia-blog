import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { messages } from "@/i18n/messages/fa";

export function FeedLoading() {
  const motion = "animate-pulse motion-reduce:animate-none";
  return (
    <div className="min-h-64 space-y-6">
      <p role="status">{messages.home.feedLoading}</p>
      <div aria-hidden="true" className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 10 }, (_, index) => (
          <Card key={index} className="flex min-h-52 flex-col">
            <CardHeader>
              <Skeleton className={`mb-3 h-6 w-24 ${motion}`} />
              <Skeleton className={`h-6 w-full ${motion}`} />
              <Skeleton className={`h-6 w-3/4 ${motion}`} />
            </CardHeader>
            <CardContent className="mt-auto">
              <div className="flex gap-4 border-t border-border pt-4">
                <Skeleton className={`h-4 w-24 ${motion}`} />
                <Skeleton className={`h-4 w-32 ${motion}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

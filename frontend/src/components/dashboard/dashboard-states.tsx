import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { dashboardMessages as copy } from "@/i18n/messages/dashboard.fa";
import { DashboardShell } from "./dashboard-shell";

export function DashboardLoading() {
  return (
    <DashboardShell identity={null} destinations={[]} pending title={copy.title} description={copy.description} actions={<Skeleton className="h-12 w-40 motion-reduce:animate-none" />}>
      <Card className="min-h-64 space-y-6 p-6 sm:p-8" aria-busy="true">
        <p role="status">{copy.loading}</p>
        <div aria-hidden="true" className="space-y-4 motion-reduce:animate-none">
          <Skeleton className="h-8 w-1/2 motion-reduce:animate-none" />
          <Skeleton className="h-6 w-full motion-reduce:animate-none" />
          <Skeleton className="h-6 w-3/4 motion-reduce:animate-none" />
        </div>
      </Card>
    </DashboardShell>
  );
}

export function DashboardUnavailable({ retryHref }: { retryHref: string }) {
  return (
    <Card role="alert" className="min-h-64 space-y-6 p-6 sm:p-8">
      <p>{copy.unavailable}</p>
      <form action={retryHref} method="get">
        <Button type="submit" size="lg" className="motion-reduce:transition-none">{copy.retry}</Button>
      </form>
    </Card>
  );
}

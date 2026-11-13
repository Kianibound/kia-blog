import Link from "next/link";
import { redirect } from "next/navigation";
import { ProductionAvatarEditor } from "@/components/dashboard/production-avatar-editor";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { profileMessages as copy } from "@/i18n/messages/profile.fa";
import type { PublicAccount } from "@/lib/auth/current-user";
import { loadProfile } from "@/lib/dashboard/profile";

export function ProductionAvatarLoading() {
  return (
    <Card className="min-h-96 space-y-6 p-6 sm:p-8" aria-busy="true">
      <p role="status">{copy.title}…</p>
      <Skeleton className="size-32 motion-reduce:animate-none" />
      <Skeleton className="h-12 w-full motion-reduce:animate-none" />
      <Skeleton className="h-12 w-48 motion-reduce:animate-none" />
    </Card>
  );
}

export async function ProductionAvatar({
  account,
}: {
  account: PublicAccount;
}) {
  if (account.user.role !== "AUTHOR")
    return (
      <Card role="alert" className="min-h-64 space-y-4 p-6">
        <p>{copy.denied}</p>
      </Card>
    );

  const result = await loadProfile();
  if (result.status === "unauthenticated")
    redirect(
      `/session/clear?next=${encodeURIComponent("/dashboard/avatar")}`,
    );
  if (result.status === "unavailable")
    return (
      <Card role="alert" className="min-h-64 space-y-4 p-6">
        <p>{copy.loadError}</p>
        <form action="/dashboard/avatar" method="get">
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
      <ProductionAvatarEditor
        key={result.profile.avatarUrl ?? "none"}
        initialAvatarUrl={result.profile.avatarUrl}
        csrfToken={account.csrfToken}
      />
      <Link
        href="/dashboard"
        className="inline-flex min-h-12 items-center rounded-control px-4 underline focus-visible:outline-2 focus-visible:outline-ring"
      >
        {copy.back}
      </Link>
    </div>
  );
}

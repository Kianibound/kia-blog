import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductionAuthorList } from "@/components/dashboard/production-author-list";
import { authorsMessages as copy } from "@/i18n/messages/authors.fa";
import type { PublicAccount } from "@/lib/auth/current-user";
import { loadAdminAuthors } from "@/lib/dashboard/authors";

const linkClassName =
  "inline-flex min-h-12 items-center rounded-control underline px-4 focus-visible:outline-2 focus-visible:outline-ring";

export function ProductionAuthorsLoading() {
  return (
    <Card className="min-h-64 space-y-6 p-6 sm:p-8" aria-busy="true">
      <h2 className="text-xl leading-tight font-semibold">{copy.listTitle}</h2>
      <Skeleton className="h-12 w-40 motion-reduce:animate-none" />
      <p role="status">{copy.loading}</p>
      <Skeleton className="h-24 w-full motion-reduce:animate-none" />
    </Card>
  );
}

export async function ProductionAuthors({
  account,
}: {
  account: PublicAccount;
}) {
  if (account.user.role !== "ADMIN") return <Card role="alert"><p>{copy.denied}</p></Card>;

  const result = await loadAdminAuthors(account);
  if (result.status === "unauthenticated")
    redirect(
      `/session/clear?next=${encodeURIComponent("/dashboard/authors")}`,
    );
  if (result.status === "forbidden")
    return (
      <Card role="alert" className="min-h-64 space-y-4 p-6">
        <p>{copy.denied}</p>
      </Card>
    );
  if (result.status === "unavailable")
    return (
      <Card role="alert" className="min-h-64 space-y-4 p-6">
        <h2 className="text-xl leading-tight font-semibold">
          {copy.listTitle}
        </h2>
        <p>{copy.listError}</p>
        <Link href="/dashboard/authors" className={linkClassName}>
          {copy.retry}
        </Link>
      </Card>
    );

  return (
    <Card id="authors" className="min-h-64 space-y-6 p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl leading-tight font-semibold">
          {copy.listTitle}
        </h2>
        <Link
          href="/dashboard/authors/new"
          className="inline-flex min-h-12 items-center justify-center rounded-control bg-brand px-6 font-semibold text-brand-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          {copy.addAuthor}
        </Link>
      </div>
      <p>{copy.listDescription}</p>
      <ProductionAuthorList
        initialAuthors={result.authors}
        csrfToken={account.csrfToken}
      />
    </Card>
  );
}

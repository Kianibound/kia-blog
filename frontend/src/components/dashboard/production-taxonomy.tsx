import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductionTaxonomyManager } from "@/components/dashboard/production-taxonomy-manager";
import { taxonomyMessages as copy } from "@/i18n/messages/taxonomy.fa";
import type { PublicAccount } from "@/lib/auth/current-user";
import { loadAdminTaxonomy } from "@/lib/dashboard/taxonomy";
import type { TaxonomyKind } from "@/lib/taxonomy-contract";

const tabs: { kind: TaxonomyKind; label: string }[] = [
  { kind: "categories", label: copy.categories },
  { kind: "tags", label: copy.tags },
];

function tabClassName(active: boolean) {
  return active
    ? "inline-flex min-h-12 items-center rounded-control bg-brand px-4 font-semibold text-brand-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
    : "inline-flex min-h-12 items-center rounded-control border border-border px-4 font-semibold focus-visible:outline-2 focus-visible:outline-ring";
}

export function ProductionTaxonomyLoading() {
  return (
    <Card className="min-h-64 space-y-6 p-6 sm:p-8" aria-busy="true">
      <p role="status">{copy.loading}</p>
      <Skeleton className="h-12 w-full motion-reduce:animate-none" />
      <Skeleton className="h-12 w-32 motion-reduce:animate-none" />
      <Skeleton className="h-20 w-full motion-reduce:animate-none" />
    </Card>
  );
}

export async function ProductionTaxonomy({
  kind,
  account,
}: {
  kind: TaxonomyKind;
  account: PublicAccount;
}) {
  if (account.user.role !== "ADMIN")
    return (
      <Card role="alert" className="min-h-64 p-6">
        <p>{copy.errors.forbidden}</p>
      </Card>
    );

  const result = await loadAdminTaxonomy(kind, account);
  if (result.status === "forbidden")
    return (
      <Card role="alert" className="min-h-64 p-6">
        <p>{copy.errors.forbidden}</p>
      </Card>
    );
  if (result.status === "unavailable")
    return (
      <Card role="alert" className="min-h-64 space-y-4 p-6">
        <p>{copy.loadError}</p>
        <Link
          href={`/dashboard/${kind}`}
          className="inline-flex min-h-12 items-center rounded-control underline px-4 focus-visible:outline-2 focus-visible:outline-ring"
        >
          {copy.retry}
        </Link>
      </Card>
    );

  return (
    <div className="space-y-6">
      <nav aria-label={copy.navigation} className="flex flex-wrap gap-4">
        {tabs.map((tab) => (
          <Link
            key={tab.kind}
            href={`/dashboard/${tab.kind}`}
            aria-current={tab.kind === kind ? "page" : undefined}
            className={tabClassName(tab.kind === kind)}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      <ProductionTaxonomyManager
        key={kind}
        kind={kind}
        initialItems={result.items}
        csrfToken={account.csrfToken}
      />
    </div>
  );
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { ProductionArticleForm } from "@/components/dashboard/production-article-form";
import { articleFormMessages as copy } from "@/i18n/messages/article-form.fa";
import type { PublicAccount } from "@/lib/auth/current-user";
import {
  loadArticleForEdit,
  loadArticleTaxonomy,
} from "@/lib/dashboard/articles";

function Unavailable() {
  return (
    <Card role="alert" className="min-h-64 space-y-4 p-6">
      <p>{copy.readError}</p>
      <Link
        href="/dashboard/posts"
        className="inline-flex min-h-12 items-center rounded-control px-4 underline focus-visible:outline-2 focus-visible:outline-ring"
      >
        {copy.back}
      </Link>
    </Card>
  );
}

export async function ProductionArticleEditor({
  account,
  articleId,
}: {
  account: PublicAccount;
  articleId?: string;
}) {
  if (!articleId) {
    const taxonomy = await loadArticleTaxonomy();
    if (!taxonomy) return <Unavailable />;
    return (
      <ProductionArticleForm
        categories={taxonomy.categories}
        tags={taxonomy.tags}
        csrfToken={account.csrfToken}
      />
    );
  }

  const result = await loadArticleForEdit(account, articleId);
  if (result.status === "unauthenticated")
    redirect(
      `/session/clear?next=${encodeURIComponent(`/dashboard/posts/${articleId}/edit`)}`,
    );
  if (result.status === "not-found") notFound();
  if (result.status === "unavailable") return <Unavailable />;

  return (
    <ProductionArticleForm
      article={result.article}
      categories={result.taxonomy.categories}
      tags={result.taxonomy.tags}
      csrfToken={account.csrfToken}
    />
  );
}

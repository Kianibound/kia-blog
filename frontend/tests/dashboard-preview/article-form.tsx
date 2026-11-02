import "server-only";
import { ArticleForm } from "@/components/dashboard/article-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { articleFormMessages as copy } from "@/i18n/messages/article-form.fa";
import { parseArticleDetail, parseArticleTaxonomy } from "@/lib/article-form-contract";
import { saveFixtureArticle } from "./article-actions";

async function read(path: string) {
  const response = await fetch(`http://127.0.0.1:4101/${path}`, { cache: "no-store", signal: AbortSignal.timeout(2500) });
  if (!response.ok) throw new Error("Fixture form unavailable");
  return response.json();
}

export async function PreviewArticleForm({ id, authorId, unavailable = false }: { id?: string; authorId: string; unavailable?: boolean }) {
  let article, categories, tags;
  try {
    const [taxonomy, detail] = await Promise.all([read("dashboard-taxonomy"), id ? read(`dashboard-posts/${encodeURIComponent(id)}`) : undefined]);
    categories = parseArticleTaxonomy(taxonomy.categories);
    tags = parseArticleTaxonomy(taxonomy.tags);
    article = id ? parseArticleDetail(detail) : undefined;
    if (article && (article.id !== id || article.authorId !== authorId)) throw new Error("Mismatched fixture article");
  } catch {
    return <Card role="alert" className="min-h-64 space-y-4 p-6"><p>{copy.readError}</p><form><Button type="submit" size="lg">{copy.retry}</Button></form></Card>;
  }
  return <ArticleForm key={article?.id ?? "new"} article={article} categories={categories} tags={tags} saveAction={unavailable ? undefined : saveFixtureArticle} />;
}

import ArticleDetail from "@/app/(public)/posts/[slug]/page";
import { FixturePublicLayout } from "../../../public-layout";
import { Suspense } from "react";
import { ArticleCommentsLoading } from "@/components/posts/article-comments";
import { PreviewArticleComments } from "../../../article-comments";

export const dynamic = "force-dynamic";

export default async function PreviewArticleDetail({ params }: { params: Promise<{ slug: string }> }) {
  // Resolve the shared page before its shell so missing/unpublished posts keep HTTP 404.
  const article = await ArticleDetail({ params });
  const { slug } = await params;
  return <FixturePublicLayout>{article}<Suspense fallback={<ArticleCommentsLoading />}><PreviewArticleComments slug={slug} /></Suspense></FixturePublicLayout>;
}

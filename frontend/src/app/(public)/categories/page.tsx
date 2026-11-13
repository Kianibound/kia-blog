import type { Metadata } from "next";
import { Suspense } from "react";
import { DiscoveryLoading } from "@/components/posts/discovery-loading";
import { TaxonomyIndex } from "@/components/posts/taxonomy-index";
import { messages } from "@/i18n/messages/fa";
import { getEditorTaxonomy } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: messages.discovery.categoriesTitle,
  description: messages.discovery.categoriesDescription,
  alternates: { canonical: "/categories" },
};

async function CategoriesContent() {
  const taxonomy = await getEditorTaxonomy();
  if (!taxonomy)
    return (
      <div className="space-y-8">
        <h1 className="text-3xl leading-tight font-bold">
          {messages.discovery.categoriesTitle}
        </h1>
        <p role="alert">{messages.discovery.taxonomyUnavailable}</p>
      </div>
    );
  return <TaxonomyIndex kind="categories" items={taxonomy.categories} />;
}

export default function CategoriesPage() {
  return (
    <Suspense fallback={<DiscoveryLoading />}>
      <CategoriesContent />
    </Suspense>
  );
}

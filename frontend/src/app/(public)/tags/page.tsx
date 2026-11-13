import type { Metadata } from "next";
import { Suspense } from "react";
import { DiscoveryLoading } from "@/components/posts/discovery-loading";
import { TaxonomyIndex } from "@/components/posts/taxonomy-index";
import { messages } from "@/i18n/messages/fa";
import { getEditorTaxonomy } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: messages.discovery.tagsTitle,
  description: messages.discovery.tagsDescription,
  alternates: { canonical: "/tags" },
};

async function TagsContent() {
  const taxonomy = await getEditorTaxonomy();
  if (!taxonomy)
    return (
      <div className="space-y-8">
        <h1 className="text-3xl leading-tight font-bold">
          {messages.discovery.tagsTitle}
        </h1>
        <p role="alert">{messages.discovery.taxonomyUnavailable}</p>
      </div>
    );
  return <TaxonomyIndex kind="tags" items={taxonomy.tags} />;
}

export default function TagsPage() {
  return (
    <Suspense fallback={<DiscoveryLoading />}>
      <TagsContent />
    </Suspense>
  );
}

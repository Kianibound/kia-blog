import Link from "next/link";
import { Card } from "@/components/ui/card";
import { messages } from "@/i18n/messages/fa";
import {
  categoryHref,
  isSafeTaxonomySlug,
  tagHref,
} from "@/lib/discovery";
import { fa } from "@/lib/utils";

const linkClass =
  "flex min-h-12 items-center rounded-control border border-border px-4 font-semibold hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring";

export function TaxonomyIndex({
  kind,
  items,
}: {
  kind: "categories" | "tags";
  items: { id: string; name: string; slug: string }[];
}) {
  const categories = kind === "categories";
  const routable = items.filter((item) => isSafeTaxonomySlug(item.slug));
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl leading-tight font-bold">
          {categories
            ? messages.discovery.categoriesTitle
            : messages.discovery.tagsTitle}
        </h1>
        <p>
          {categories
            ? messages.discovery.categoriesDescription
            : messages.discovery.tagsDescription}
        </p>
      </div>
      {routable.length === 0 ? (
        <Card className="min-h-64 p-6">
          <p role="status">{messages.discovery.taxonomyEmpty}</p>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {routable.map((item) => (
            <li key={item.id}>
              <Link
                href={categories ? categoryHref(item.slug) : tagHref(item.slug)}
                className={linkClass}
              >
                {fa(item.name)}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

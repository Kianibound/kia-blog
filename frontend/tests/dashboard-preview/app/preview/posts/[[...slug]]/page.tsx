import { notFound } from "next/navigation";
import { PreviewReading } from "../../../../reading";

export const dynamic = "force-dynamic";

export default async function ReadingPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug = [] } = await params;
  if (slug.length > 1) notFound();
  // Resolve visibility before streaming any success UI, so unavailable articles return 404.
  return await PreviewReading({ slug: slug[0] });
}

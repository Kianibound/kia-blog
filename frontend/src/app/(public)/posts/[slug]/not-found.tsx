import Link from "next/link";
import { messages } from "@/i18n/messages/fa";

export default function ArticleNotFound() {
  return (
    <div className="mx-auto min-h-64 max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">{messages.article.notFound}</h1>
      <p>{messages.article.notFoundHelp}</p>
      <Link href="/" className="inline-flex min-h-12 items-center rounded-md border border-border px-4 font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">{messages.article.backToFeed}</Link>
    </div>
  );
}

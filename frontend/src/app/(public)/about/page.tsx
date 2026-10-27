import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { messages } from "@/i18n/messages/fa";

export const metadata: Metadata = {
  title: messages.about.title,
  description: messages.about.introduction,
};

export default function About() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-4">
        <p className="text-sm font-medium text-brand">{messages.metadata.title}</p>
        <h1 className="text-3xl leading-tight font-bold sm:text-4xl">{messages.about.title}</h1>
        <p>{messages.about.introduction}</p>
      </div>
      <Card>
        <section aria-labelledby="about-purpose" className="space-y-4 p-6 sm:p-8">
          <h2 id="about-purpose" className="text-2xl leading-tight font-semibold">{messages.about.purposeTitle}</h2>
          <p>{messages.about.purpose}</p>
          <p>{messages.about.invitation}</p>
        </section>
      </Card>
      <Link
        href="/#published-posts"
        className="inline-flex min-h-12 items-center rounded-control px-4 font-medium text-foreground underline decoration-border underline-offset-4 hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        {messages.about.backToArticles}
      </Link>
    </div>
  );
}

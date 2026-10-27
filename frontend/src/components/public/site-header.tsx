import Link from "next/link";
import { messages } from "@/i18n/messages/fa";

export function SiteHeader() {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only rounded-md bg-primary px-4 py-3 text-primary-foreground focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:outline-2 focus:outline-offset-4 focus:outline-ring"
      >
        {messages.public.skipToContent}
      </a>
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="inline-flex min-h-11 items-center rounded-md text-xl font-bold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
            {messages.metadata.title}
          </Link>
          <nav aria-label={messages.public.navigation}>
            <Link href="/" aria-current="page" className="inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
              {messages.public.home}
            </Link>
          </nav>
        </div>
      </header>
    </>
  );
}

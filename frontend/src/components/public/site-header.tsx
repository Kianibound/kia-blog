import Link from "next/link";
import { messages } from "@/i18n/messages/fa";
import { SiteNavigation } from "./site-navigation";
import { getPublicCategories } from "@/lib/categories";

export async function SiteHeader({ accountEntry }: { accountEntry?: React.ReactNode }) {
  const categories = await getPublicCategories();
  return (
    <>
      <a
        href="#main-content"
        className="sr-only rounded-md bg-primary px-4 py-3 text-primary-foreground focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:outline-2 focus:outline-offset-4 focus:outline-ring"
      >
        {messages.public.skipToContent}
      </a>
      <header className="border-b border-border bg-card">
        <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6">
          <SiteNavigation categories={categories}>
            <Link href="/" className="inline-flex min-h-12 items-center rounded-md text-xl font-bold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
              {messages.metadata.title}
            </Link>
          </SiteNavigation>
          <div className="mt-4 flex min-h-12 flex-wrap items-center justify-end gap-4">
            {accountEntry ?? <Link href="/login" className="inline-flex min-h-12 items-center rounded-control px-4 font-medium hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring">ورود / ثبت‌نام</Link>}
          </div>
        </div>
      </header>
    </>
  );
}

import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="mx-auto min-h-96 w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}

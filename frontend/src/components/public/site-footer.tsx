import { messages } from "@/i18n/messages/fa";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6">
        <p className="font-semibold">{messages.metadata.title}</p>
        <p className="max-w-xl text-sm">{messages.public.footerDescription}</p>
      </div>
    </footer>
  );
}

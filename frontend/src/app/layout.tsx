import type { Metadata } from "next";
import "./globals.css";
import { vazirmatn } from "./fonts";
import { locale } from "@/i18n/config";
import { messages } from "@/i18n/messages/fa";

export const metadata: Metadata = {
  ...messages.metadata,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang={locale.language}
      dir={locale.direction}
      className={vazirmatn.variable}
    >
      <body className="font-sans bg-background text-foreground">{children}</body>
    </html>
  );
}

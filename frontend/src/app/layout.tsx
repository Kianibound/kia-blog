import type { Metadata } from "next";
import "./globals.css";
import { vazirmatn } from "./fonts";
import { locale } from "@/i18n/config";
import { messages } from "@/i18n/messages/fa";
import { ThemeProvider } from "@/components/theme-provider";
import { themeStorageKey } from "@/lib/theme";

export const metadata: Metadata = {
  ...messages.metadata,
};

// Run before next-themes' bootstrap: ignore invalid stored values and choose the
// system palette before paint when browser storage is unavailable.
const themePreflight = `try {
  var key = ${JSON.stringify(themeStorageKey)};
  var saved = localStorage.getItem(key);
  if (saved && saved !== "light" && saved !== "dark" && saved !== "system") localStorage.removeItem(key);
} catch (_) {
  document.documentElement.setAttribute("data-theme", matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang={locale.language}
      dir={locale.direction}
      className={vazirmatn.variable}
      suppressHydrationWarning
    >
      <head><script dangerouslySetInnerHTML={{ __html: themePreflight }} /></head>
      <body className="font-sans bg-background text-foreground">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

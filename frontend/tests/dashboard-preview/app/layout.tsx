import RootLayout from "@/app/layout";

export const metadata = { title: "پیش‌نمایش آزمایشی پیشخوان" };

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <RootLayout params={Promise.resolve({})}>
      <aside className="border-b border-border bg-secondary px-4 py-4 text-secondary-foreground">
        <p role="note" className="mx-auto max-w-7xl">پیش‌نمایش با داده‌های آزمایشی؛ حساب واقعی، ذخیره‌سازی یا ارسال پیام انجام نمی‌شود. نمایش نقش‌ها به معنای احراز هویت یا کنترل دسترسی نیست.</p>
      </aside>
      {children}
    </RootLayout>
  );
}

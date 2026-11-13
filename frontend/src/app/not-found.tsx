import { messages } from "@/i18n/messages/fa";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-svh max-w-3xl flex-col justify-center gap-4 px-6 py-16 text-start">
      <h1 className="text-3xl font-bold">{messages.notFound.title}</h1>
      <p className="text-muted-foreground">{messages.notFound.description}</p>
    </main>
  );
}

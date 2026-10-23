import { messages } from "@/i18n/messages/fa";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-svh max-w-3xl flex-col justify-center gap-4 px-6 py-16 text-start">
      <h1 className="text-4xl font-bold">{messages.foundation.title}</h1>
      <p className="text-lg text-muted-foreground">{messages.foundation.description}</p>
    </main>
  );
}

import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { ContactForm } from "@/components/public/contact-form";
import { messages } from "@/i18n/messages/fa";

export const metadata: Metadata = {
  title: messages.contact.title,
  description: messages.contact.unavailable,
};

export default function Contact() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-4">
        <p className="text-sm font-medium text-brand">{messages.metadata.title}</p>
        <h1 className="text-3xl leading-tight font-bold sm:text-4xl">{messages.contact.title}</h1>
        <p>{messages.contact.introduction}</p>
        <p id="contact-unavailable" role="status" className="rounded-control border border-border bg-secondary p-4">
          {messages.contact.unavailable}
        </p>
      </div>
      <Card className="p-6 sm:p-8">
        <ContactForm />
      </Card>
    </div>
  );
}

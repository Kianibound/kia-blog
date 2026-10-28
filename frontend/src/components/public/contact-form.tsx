"use client";

import { useState, type ChangeEvent, type FocusEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { messages } from "@/i18n/messages/fa";

type ContactField = "name" | "email" | "message";

export function ContactForm() {
  const [errors, setErrors] = useState<Partial<Record<ContactField, string>>>({});

  function validate(field: ContactField, control: HTMLInputElement | HTMLTextAreaElement) {
    const invalid = !control.value.trim() || (field === "email" && !control.validity.valid);
    const error = {
      name: messages.contact.nameRequired,
      email: messages.contact.emailInvalid,
      message: messages.contact.messageRequired,
    }[field];
    setErrors((current) => ({ ...current, [field]: invalid ? error : undefined }));
  }

  function fieldProps(field: ContactField) {
    return {
      id: `contact-${field}`,
      name: field,
      required: true,
      "aria-invalid": Boolean(errors[field]),
      "aria-describedby": `contact-${field}-error`,
      onBlur: (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => validate(field, event.currentTarget),
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (errors[field]) validate(field, event.currentTarget);
      },
    };
  }

  return (
    <form aria-label={messages.contact.title} aria-describedby="contact-unavailable" noValidate onSubmit={(event) => event.preventDefault()} className="space-y-6">
      <p className="text-sm">{messages.contact.requiredHint}</p>
      <Field label={messages.contact.name} htmlFor="contact-name">
        <Input {...fieldProps("name")} autoComplete="name" className="min-h-12 motion-reduce:transition-none" />
        <p id="contact-name-error" aria-live="polite" className="text-sm text-destructive">{errors.name}</p>
      </Field>
      <Field label={messages.contact.email} htmlFor="contact-email">
        <Input {...fieldProps("email")} type="email" dir="ltr" autoComplete="email" className="min-h-12 motion-reduce:transition-none" />
        <p id="contact-email-error" aria-live="polite" className="text-sm text-destructive">{errors.email}</p>
      </Field>
      <Field label={messages.contact.message} htmlFor="contact-message">
        <Textarea {...fieldProps("message")} rows={6} className="motion-reduce:transition-none" />
        <p id="contact-message-error" aria-live="polite" className="text-sm text-destructive">{errors.message}</p>
      </Field>
      {/* A disabled submit button also prevents implicit submission without JavaScript. */}
      <Button type="submit" size="lg" disabled aria-describedby="contact-unavailable" className="w-full motion-reduce:transition-none sm:w-auto">
        {messages.contact.send}
      </Button>
    </form>
  );
}

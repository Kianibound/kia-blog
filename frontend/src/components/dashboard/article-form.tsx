"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { articleFormMessages as copy } from "@/i18n/messages/article-form.fa";
import { fa } from "@/lib/utils";
import type { ArticleInput, ArticleRecord, ArticleSaveResult, ArticleTaxonomy } from "@/lib/article-form-contract";

type Props = {
  article?: ArticleRecord;
  categories: ArticleTaxonomy[];
  tags: ArticleTaxonomy[];
  saveAction?: (id: string | undefined, input: ArticleInput) => Promise<ArticleSaveResult>;
};

export function ArticleFormLoading() {
  return <Card className="min-h-64 space-y-6 p-6 sm:p-8" aria-busy="true">
    <p role="status">{copy.loading}</p>
    <Skeleton className="h-12 w-full motion-reduce:animate-none" />
    <Skeleton className="h-64 w-full motion-reduce:animate-none" />
    <Skeleton className="h-12 w-1/2 motion-reduce:animate-none" />
    <Skeleton className="h-12 w-1/2 motion-reduce:animate-none" />
  </Card>;
}

function TaxonomyChoices({ label, choices, original, selected, onChange }: { label: string; choices: ArticleTaxonomy[]; original: ArticleTaxonomy[]; selected: ArticleTaxonomy[]; onChange: (value: ArticleTaxonomy[]) => void }) {
  const recovered = original.filter(item => !choices.some(choice => choice.id === item.id));
  return <fieldset className="space-y-2">
    <legend className="text-sm font-medium">{label}</legend>
    {recovered.length > 0 && <p className="text-sm">{copy.recovered}</p>}
    {choices.length + recovered.length === 0 && <p>{copy.noChoices}</p>}
    <div className="flex flex-wrap gap-4">{[...choices, ...recovered].map(item => <label key={item.id} className="flex min-h-12 cursor-pointer items-center gap-2 rounded-control border border-border px-4">
      <input type="checkbox" className="size-4 accent-primary" checked={selected.some(value => value.id === item.id)} onChange={event => onChange(event.target.checked ? [...selected, item] : selected.filter(value => value.id !== item.id))} />
      <span>{fa(item.name)}</span>
    </label>)}</div>
  </fieldset>;
}

/** Presentation only. Without an explicitly supplied adapter, saving is unavailable. */
export function ArticleForm({ article, categories, tags, saveAction }: Props) {
  const [saved, setSaved] = useState(article);
  const [title, setTitle] = useState(article?.title ?? "");
  const [content, setContent] = useState(article?.content ?? "");
  const [selectedCategories, setCategories] = useState(article?.categories ?? []);
  const [selectedTags, setTags] = useState(article?.tags ?? []);
  const [errors, setErrors] = useState({ title: false, content: false });
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error" | "uncertain">("idle");
  const pending = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!saveAction || pending.current || state === "uncertain") return;
    const invalid = { title: !title.trim(), content: !content.trim() };
    setErrors(invalid);
    if (invalid.title || invalid.content) {
      event.currentTarget.querySelector<HTMLElement>(invalid.title ? "#article-title" : "#article-content")?.focus();
      return;
    }
    pending.current = true;
    setState("saving");
    try {
      const result = await saveAction(saved?.id, { title, content, categoryIds: selectedCategories.map(item => item.id), tagIds: selectedTags.map(item => item.id) });
      setState(result.state);
      if (result.state === "saved") {
        setSaved(result.post);
        if (!saved) window.history.replaceState(null, "", `/dashboard/posts/${encodeURIComponent(result.post.id)}/edit`);
      }
    } catch {
      setState("uncertain");
    } finally { pending.current = false; }
  }

  return <Card className="min-h-64 space-y-6 p-6 sm:p-8">
    <p>{saveAction ? copy.preview : copy.unavailable}</p>
    <form noValidate onSubmit={submit} className="space-y-6" aria-busy={state === "saving"}>
      <fieldset disabled={!saveAction || state === "saving"} className="min-w-0 space-y-6">
        <Field label={copy.title} htmlFor="article-title"><Input id="article-title" value={title} onChange={event => { setTitle(event.target.value); if (state === "saved") setState("idle"); }} required aria-invalid={errors.title} aria-describedby={errors.title ? "article-title-error" : undefined} className="min-h-12" />{errors.title && <p id="article-title-error" className="text-sm text-destructive">{copy.requiredTitle}</p>}</Field>
        <Field label={copy.content} htmlFor="article-content" hint={copy.plain}><Textarea id="article-content" value={content} onChange={event => { setContent(event.target.value); if (state === "saved") setState("idle"); }} required rows={10} aria-invalid={errors.content} aria-describedby={errors.content ? "article-content-error" : undefined} />{errors.content && <p id="article-content-error" className="text-sm text-destructive">{copy.requiredContent}</p>}</Field>
        <TaxonomyChoices label={copy.categories} choices={categories} original={article?.categories ?? []} selected={selectedCategories} onChange={value => { setCategories(value); if (state === "saved") setState("idle"); }} />
        <TaxonomyChoices label={copy.tags} choices={tags} original={article?.tags ?? []} selected={selectedTags} onChange={value => { setTags(value); if (state === "saved") setState("idle"); }} />
      </fieldset>
      {(state === "error" || state === "uncertain") && <p role="alert">{copy[state]}</p>}
      <p role="status" aria-live="polite">{state === "saved" ? copy.saved : state === "saving" ? copy.saving : ""}</p>
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" disabled={!saveAction || state === "saving" || state === "uncertain"} className="motion-reduce:transition-none">{state === "saving" ? copy.saving : copy.save}</Button>
        <Link href="/dashboard/posts" className="inline-flex min-h-12 items-center rounded-control px-4 underline focus-visible:outline-2 focus-visible:outline-ring">{copy.back}</Link>
      </div>
    </form>
  </Card>;
}

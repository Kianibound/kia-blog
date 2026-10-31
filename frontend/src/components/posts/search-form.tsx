"use client";

import Form from "next/form";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { messages } from "@/i18n/messages/fa";
import { postsHref, type PostsQuery } from "@/lib/posts-query";

export function SearchForm({ query }: { query: PostsQuery }) {
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const form = formRef.current;
    // Keep one form mounted; synchronize uncontrolled fields with the URL after navigation.
    const restore = () => {
      const search = form?.elements.namedItem("search");
      const sort = form?.elements.namedItem("sort");
      if (search instanceof HTMLInputElement) search.value = query.search ?? "";
      if (sort instanceof HTMLSelectElement) sort.value = query.sort;
    };
    restore();
    window.addEventListener("popstate", restore);
    window.addEventListener("pageshow", restore);
    return () => {
      window.removeEventListener("popstate", restore);
      window.removeEventListener("pageshow", restore);
    };
  }, [query.search, query.sort, query.page, query.category, query.tag]);
  return (
    <Form ref={formRef} action="/" prefetch={false} role="search" aria-label={messages.search.form} className="grid gap-4 sm:grid-cols-3">
      <Field label={messages.search.label} htmlFor="article-search" className="min-w-0 sm:col-span-2">
        <Input id="article-search" type="search" name="search" defaultValue={query.search ?? ""} className="h-12 motion-reduce:transition-none" />
      </Field>
      <Field label={messages.search.sort} htmlFor="article-sort">
        <select id="article-sort" name="sort" defaultValue={query.sort} className="h-12 w-full rounded-field border border-input bg-field px-3 text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
          <option value="newest">{messages.search.newest}</option>
          <option value="oldest">{messages.search.oldest}</option>
        </select>
      </Field>
      {query.category && <input type="hidden" name="category" value={query.category} />}
      {query.tag && <input type="hidden" name="tag" value={query.tag} />}
      <div className="flex flex-wrap items-center gap-4 sm:col-span-3">
        <Button type="submit" size="lg" className="motion-reduce:transition-none">{messages.search.submit}</Button>
        {query.search && (
          <Link href={postsHref({ ...query, search: undefined, page: 1 })} className="inline-flex min-h-12 items-center rounded-control border border-border px-4 font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">{messages.search.clear}</Link>
        )}
      </div>
    </Form>
  );
}

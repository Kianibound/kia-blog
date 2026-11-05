"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { ArticleForm } from "@/components/dashboard/article-form";
import { Skeleton } from "@/components/ui/skeleton";
import { documentFromText } from "@/components/editor/types";
import { editorMessages as copy } from "@/i18n/messages/editor.fa";
import type { ArticleRecord, ArticleTaxonomy } from "@/lib/article-form-contract";
import type { PreviewDocument } from "./editor-document";
import { saveFixtureArticle } from "./article-actions";
import { changeFixturePublication } from "./article-actions";

import { uploadFixtureImage } from "./image-upload";

const RichEditor = dynamic(() => import("@/components/editor/rich-editor").then(module => module.RichEditor), {
  ssr: false, loading: () => <div role="status" className="min-h-96 space-y-4"><p>{copy.loading}</p><div className="flex flex-wrap gap-2">{Array.from({ length: 14 }, (_, index) => <Skeleton key={index} className="h-12 w-24 motion-reduce:animate-none" />)}</div><Skeleton className="h-64 w-full motion-reduce:animate-none" /></div>,
});

export function PreviewRichArticleForm({ article, categories, tags, initialDocument, unavailable, admin = false }: { article?: ArticleRecord; categories: ArticleTaxonomy[]; tags: ArticleTaxonomy[]; initialDocument?: PreviewDocument; unavailable: boolean; admin?: boolean }) {
  const [imagePending, setImagePending] = useState(false);
  const document = useRef<PreviewDocument>(initialDocument ?? { format: "tiptap-ui-proposal-1", document: documentFromText(article?.content ?? "") });
  return <div className="space-y-4"><p>{copy.preview}</p><ArticleForm article={article} categories={categories} tags={tags}
    backLabel={admin ? "بازگشت به فهرست مقاله‌ها" : undefined}
    uploadImage={uploadFixtureImage}
    contentBlocked={imagePending}
    saveAction={unavailable ? undefined : (id, input) => saveFixtureArticle(id, input, JSON.parse(JSON.stringify(document.current)))}
    publicationAction={unavailable ? undefined : changeFixturePublication}
    readingHref={slug => `/preview/posts/${encodeURIComponent(slug)}`}
    renderContent={field => <RichEditor {...field} uploadImage={uploadFixtureImage} onImagePending={setImagePending} initialDocument={document.current.document} onChange={value => { document.current = { format: "tiptap-ui-proposal-1", document: value.document }; field.onChange(value.plainText); }} />}
  /></div>;
}

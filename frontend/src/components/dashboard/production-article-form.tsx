"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { ArticleForm } from "@/components/dashboard/article-form";
import { Skeleton } from "@/components/ui/skeleton";
import { editorMessages as editorCopy } from "@/i18n/messages/editor.fa";
import { articleFormMessages as copy } from "@/i18n/messages/article-form.fa";
import type {
  ArticleInput,
  ArticleRecord,
  ArticleSaveResult,
  ArticleTaxonomy,
} from "@/lib/article-form-contract";
import {
  articleDocument,
  buildArticleWritePayload,
  UnsupportedArticleImageError,
} from "@/lib/article-write";
import {
  saveArticleAction,
  updateArticleStatusAction,
} from "@/app/dashboard/article-actions";

const RichEditor = dynamic(
  () =>
    import("@/components/editor/rich-editor").then(
      (module) => module.RichEditor,
    ),
  {
    ssr: false,
    loading: () => (
      <div role="status" className="min-h-96 space-y-4">
        <p>{editorCopy.loading}</p>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 14 }, (_, index) => (
            <Skeleton key={index} className="h-12 w-24 motion-reduce:animate-none" />
          ))}
        </div>
        <Skeleton className="h-64 w-full motion-reduce:animate-none" />
      </div>
    ),
  },
);

export function ProductionArticleForm({
  article,
  categories,
  tags,
  csrfToken,
}: {
  article?: ArticleRecord;
  categories: ArticleTaxonomy[];
  tags: ArticleTaxonomy[];
  csrfToken: string;
}) {
  const document = useRef(articleDocument(article ?? {}));
  const documentChanged = useRef(false);
  const legacyContent =
    article && !article.contentDocument ? article.content : undefined;

  async function save(
    id: string | undefined,
    input: ArticleInput,
  ): Promise<ArticleSaveResult> {
    try {
      const useLegacy = legacyContent !== undefined && !documentChanged.current;
      const payload = buildArticleWritePayload({
        title: input.title,
        ...(useLegacy
          ? { content: legacyContent }
          : { document: document.current }),
        categoryIds: input.categoryIds,
        tagIds: input.tagIds,
      });
      return saveArticleAction(id, payload, csrfToken);
    } catch (error) {
      return {
        state: "error",
        message:
          error instanceof UnsupportedArticleImageError
            ? copy.productionUnsupportedImage
            : undefined,
      };
    }
  }

  return (
    <ArticleForm
      article={article}
      categories={categories}
      tags={tags}
      saveAction={save}
      publicationAction={(id, status) =>
        updateArticleStatusAction(id, status, csrfToken)
      }
      readingHref={(slug) => `/posts/${encodeURIComponent(slug)}`}
      helpText={copy.productionHelp}
      savedText={copy.productionSaved}
      errorText={copy.productionError}
      uncertainText={copy.productionUncertain}
      production
      renderContent={(field) => (
        <RichEditor
          {...field}
          initialDocument={document.current}
          onChange={(value) => {
            documentChanged.current = true;
            document.current = value.document;
            field.onChange(value.plainText);
          }}
        />
      )}
    />
  );
}

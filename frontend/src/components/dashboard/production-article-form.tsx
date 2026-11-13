"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRef } from "react";
import { ArticleForm } from "@/components/dashboard/article-form";
import { Card } from "@/components/ui/card";
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
  buildArticleWritePayload,
  prepareArticleDocument,
  UnsupportedArticleImageError,
} from "@/lib/article-write";
import { uploadImageFile } from "@/lib/media-upload";
import type { EditorDocument } from "@/components/editor/types";
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
  const document = useRef<EditorDocument | null>(null);
  const documentChanged = useRef(false);
  const persistedCoverId = useRef<string | null>(article?.coverImage?.id ?? null);
  const legacyContent =
    article && !article.contentDocument ? article.content : undefined;
  if (document.current === null) {
    try {
      document.current = prepareArticleDocument(article ?? {});
    } catch (error) {
      if (!(error instanceof UnsupportedArticleImageError)) throw error;
      return (
        <Card role="alert" className="min-h-64 space-y-4 p-6">
          <p>{copy.productionUnsupportedImage}</p>
          <Link
            href="/dashboard/posts"
            className="inline-flex min-h-12 items-center rounded-control px-4 underline focus-visible:outline-2 focus-visible:outline-ring"
          >
            {copy.back}
          </Link>
        </Card>
      );
    }
  }

  async function save(
    id: string | undefined,
    input: ArticleInput,
  ): Promise<ArticleSaveResult> {
    try {
      const useLegacy = legacyContent !== undefined && !documentChanged.current;
      const cover = input.coverImage;
      let coverMediaId: string | null | undefined;
      let coverAlt: string | undefined;
      if (cover) {
        if (!cover.id) throw new Error("Invalid cover reference");
        coverMediaId = cover.id;
        coverAlt = cover.alt;
      } else if (persistedCoverId.current) {
        coverMediaId = null;
      }
      const payload = buildArticleWritePayload({
        title: input.title,
        ...(useLegacy
          ? { content: legacyContent }
          : { document: document.current }),
        categoryIds: input.categoryIds,
        tagIds: input.tagIds,
        ...(coverMediaId !== undefined ? { coverMediaId } : {}),
        ...(coverAlt !== undefined ? { coverAlt } : {}),
      });
      const result = await saveArticleAction(id, payload, csrfToken);
      if (result.state === "saved") {
        if (cover?.id) persistedCoverId.current = cover.id;
        else if (coverMediaId === null) persistedCoverId.current = null;
      }
      return result;
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

  const initialDocument = document.current;
  return (
    <ArticleForm
      article={article}
      categories={categories}
      tags={tags}
      saveAction={save}
      uploadImage={(file, signal) =>
        uploadImageFile(file, { csrfToken, signal })
      }
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
          initialDocument={initialDocument}
          uploadImage={(file, signal) =>
            uploadImageFile(file, { csrfToken, signal })
          }
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

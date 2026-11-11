"use server";

import { headers } from "next/headers";
import { parseArticleWrite, type ArticleSaveResult } from "@/lib/article-form-contract";
import { articleFormMessages as copy } from "@/i18n/messages/article-form.fa";
import {
  articleWriteMethod,
  articleWritePath,
  buildArticleWritePayload,
  buildStatusPayload,
  mutationErrorResult,
  type ArticleStatusPayload,
  type ArticleWritePayload,
} from "@/lib/article-write";
import { handleAuthenticatedMutation } from "@/lib/session/server";

async function mutationRequest(csrfToken: string): Promise<Request> {
  const requestHeaders = await headers();
  return new Request("http://session.internal/article", {
    method: "POST",
    headers: {
      origin: requestHeaders.get("origin") ?? "",
      "x-csrf-token": csrfToken,
    },
  });
}

async function readWriteResponse(response: Response): Promise<ArticleSaveResult> {
  if (response.status >= 500) return { state: "uncertain" };
  if (!response.ok) return { state: "error" };
  try {
    return { state: "saved", post: parseArticleWrite(await response.json()) };
  } catch {
    return { state: "uncertain" };
  }
}

export async function saveArticleAction(
  id: string | undefined,
  input: ArticleWritePayload,
  csrfToken: string,
): Promise<ArticleSaveResult> {
  try {
    const payload = buildArticleWritePayload({
      title: input.title,
      ...(input.contentDocument !== undefined
        ? { document: input.contentDocument }
        : { content: input.content }),
      categoryIds: input.categoryIds,
      tagIds: input.tagIds,
    });
    const request = await mutationRequest(csrfToken);
    let writeResponse: Response | null = null;
    await handleAuthenticatedMutation(request, async ({ mutate }) => {
      writeResponse = await mutate(articleWritePath(id), {
        method: articleWriteMethod(id),
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return writeResponse;
    });
    return writeResponse
      ? readWriteResponse(writeResponse)
      : { state: "uncertain" };
  } catch (error) {
    return mutationErrorResult(error, copy.productionCsrfError);
  }
}

export async function updateArticleStatusAction(
  id: string,
  status: ArticleStatusPayload["status"],
  csrfToken: string,
): Promise<ArticleSaveResult> {
  if (status !== "DRAFT" && status !== "PUBLISHED") return { state: "error" };
  try {
    const request = await mutationRequest(csrfToken);
    let writeResponse: Response | null = null;
    await handleAuthenticatedMutation(request, async ({ mutate }) => {
      writeResponse = await mutate(articleWritePath(id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildStatusPayload(status)),
      });
      return writeResponse;
    });
    return writeResponse
      ? readWriteResponse(writeResponse)
      : { state: "uncertain" };
  } catch (error) {
    return mutationErrorResult(error, copy.productionCsrfError);
  }
}

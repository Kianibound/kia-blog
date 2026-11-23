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
import { fa } from "@/lib/utils";

/** Article writes run against a slow stack; give the round-trip room. */
const WRITE_TIMEOUT_MS = 30000;

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
  if (response.status >= 500)
    return {
      state: "uncertain",
      message: `خطای سرور (وضعیت ${fa(response.status)}). ورودی‌ها حفظ شده‌اند؛ پیش از تلاش دوباره، فهرست مقاله‌ها را بررسی کنید.`,
    };
  if (response.status === 403)
    return { state: "error", message: copy.forbidden };
  if (response.status === 404)
    return { state: "error", message: copy.notFound };
  if (response.status === 400)
    return { state: "error", message: copy.badRequest };
  if (!response.ok) return { state: "error" };
  try {
    return { state: "saved", post: parseArticleWrite(await response.json()) };
  } catch {
    return {
      state: "uncertain",
      message: `پاسخ ذخیره خوانده نشد (وضعیت ${fa(response.status)}). ورودی‌ها حفظ شده‌اند؛ پیش از تلاش دوباره، فهرست مقاله‌ها را بررسی کنید.`,
    };
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
      ...(input.coverMediaId !== undefined
        ? { coverMediaId: input.coverMediaId }
        : {}),
      ...(input.coverAlt !== undefined ? { coverAlt: input.coverAlt } : {}),
    });
    const request = await mutationRequest(csrfToken);
    let writeResponse: Response | null = null;
    await handleAuthenticatedMutation(request, async ({ mutate }) => {
      writeResponse = await mutate(articleWritePath(id), {
        method: articleWriteMethod(id),
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(WRITE_TIMEOUT_MS),
      });
      return writeResponse;
    });
    return writeResponse
      ? readWriteResponse(writeResponse)
      : { state: "uncertain" };
  } catch (error) {
    return mutationErrorResult(error, copy.productionCsrfError, copy.timeout);
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
        signal: AbortSignal.timeout(WRITE_TIMEOUT_MS),
      });
      return writeResponse;
    });
    return writeResponse
      ? readWriteResponse(writeResponse)
      : { state: "uncertain" };
  } catch (error) {
    return mutationErrorResult(error, copy.productionCsrfError, copy.timeout);
  }
}

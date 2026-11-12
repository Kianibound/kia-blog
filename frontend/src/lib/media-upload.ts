import { isSafeCloudinaryUrl } from "./posts-contract.ts";
import { editorMessages } from "../i18n/messages/editor.fa.ts";

export type UploadedImage = {
  id: string;
  url: string;
  width: number | null;
  height: number | null;
};

export type MediaUploadErrorKind =
  | "aborted"
  | "invalid"
  | "too-large"
  | "unauthenticated"
  | "unavailable"
  | "unsupported";

export class MediaUploadError extends Error {
  readonly kind: MediaUploadErrorKind;

  constructor(kind: MediaUploadErrorKind) {
    super(kind);
    this.name = "MediaUploadError";
    this.kind = kind;
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function validateImageFile(file: { type: string; size: number }): MediaUploadErrorKind | null {
  if (!MIME.has(file.type)) return "invalid";
  if (!file.size || file.size >= MAX_IMAGE_BYTES) return "too-large";
  return null;
}

export async function uploadImageFile(
  file: File,
  options: {
    csrfToken: string;
    fetchImpl?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
    signal?: AbortSignal;
  },
): Promise<UploadedImage> {
  const invalid = validateImageFile(file);
  if (invalid) throw new MediaUploadError(invalid);
  if (options.signal?.aborted) throw new MediaUploadError("aborted");

  const body = new FormData();
  body.append("file", file);
  const fetchImpl = options.fetchImpl ?? ((input, init) => fetch(input, init));
  let response: Response;
  try {
    response = await fetchImpl("/api/media/images", {
      method: "POST",
      headers: { "x-csrf-token": options.csrfToken },
      body,
      signal: options.signal,
    });
  } catch {
    if (options.signal?.aborted) throw new MediaUploadError("aborted");
    throw new MediaUploadError("unavailable");
  }

  if (response.status === 401) throw new MediaUploadError("unauthenticated");
  if (response.status === 413) throw new MediaUploadError("too-large");
  if (response.status === 422) throw new MediaUploadError("invalid");
  if (!response.ok) throw new MediaUploadError("unavailable");

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new MediaUploadError("unsupported");
  }
  if (typeof payload !== "object" || payload === null) throw new MediaUploadError("unsupported");
  const value = payload as Record<string, unknown>;
  if (
    typeof value.id !== "string" ||
    !UUID.test(value.id) ||
    !isSafeCloudinaryUrl(value.url) ||
    !(value.width === null || (typeof value.width === "number" && Number.isInteger(value.width) && value.width > 0)) ||
    !(value.height === null || (typeof value.height === "number" && Number.isInteger(value.height) && value.height > 0))
  )
    throw new MediaUploadError("unsupported");
  return { id: value.id, url: value.url, width: value.width, height: value.height };
}

export function mediaUploadMessage(kind: MediaUploadErrorKind): string {
  switch (kind) {
    case "aborted":
      return editorMessages.uploadCancelled;
    case "invalid":
      return editorMessages.uploadInvalid;
    case "too-large":
      return editorMessages.uploadTooLarge;
    case "unauthenticated":
      return editorMessages.uploadUnauthenticated;
    case "unavailable":
      return editorMessages.uploadUnavailable;
    case "unsupported":
      return editorMessages.uploadUnsupported;
  }
}

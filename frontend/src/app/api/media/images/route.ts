import { isSafeCloudinaryUrl } from "@/lib/posts-contract";
import { handleAuthenticatedMutation } from "@/lib/session/server";
import { MediaUploadError, validateImageFile, type UploadedImage } from "@/lib/media-upload";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function failure(status: number): Response {
  return Response.json({ code: "media-upload-failed" }, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function parseUploadedImage(value: unknown): UploadedImage | null {
  if (typeof value !== "object" || value === null) return null;
  const media = value as Record<string, unknown>;
  if (
    typeof media.id !== "string" ||
    !UUID.test(media.id) ||
    !isSafeCloudinaryUrl(media.url) ||
    !(media.width === null || (typeof media.width === "number" && Number.isInteger(media.width) && media.width > 0)) ||
    !(media.height === null || (typeof media.height === "number" && Number.isInteger(media.height) && media.height > 0))
  )
    return null;
  return { id: media.id, url: media.url, width: media.width, height: media.height };
}

export async function POST(request: Request) {
  try {
    return await handleAuthenticatedMutation(request, async ({ mutate }) => {
      let form: FormData;
      try {
        form = await request.formData();
      } catch {
        return failure(422);
      }
      const file = form.get("file");
      if (!(file instanceof File)) return failure(422);
      const invalid = validateImageFile(file);
      if (invalid === "invalid") return failure(422);
      if (invalid === "too-large") return failure(413);

      const response = await mutate("/media/images", {
        method: "POST",
        body: form,
        headers: { Accept: "application/json" },
      });
      if (response.status === 401) return failure(401);
      if (response.status === 413) return failure(413);
      if (response.status === 422) return failure(422);
      if (!response.ok) return failure(503);
      const uploaded = parseUploadedImage(await response.json().catch(() => null));
      if (!uploaded) return failure(502);
      return Response.json(uploaded, {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      });
    });
  } catch (error) {
    if (error instanceof MediaUploadError) return failure(422);
    if (error instanceof Error && error.name === "UnauthenticatedError") return failure(401);
    if (error instanceof Error && error.name === "CsrfError") return failure(403);
    return failure(503);
  }
}

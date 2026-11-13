import { validateImageFile } from "@/lib/media-upload";
import { parseProfile } from "@/lib/profile-contract";
import { handleAuthenticatedMutation } from "@/lib/session/server";

export const dynamic = "force-dynamic";

function failure(status: number): Response {
  return Response.json(
    { code: "avatar-failed" },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function upstreamFailure(status: number): Response {
  return [401, 404, 409, 413, 422].includes(status)
    ? failure(status)
    : failure(503);
}

async function readProfile(response: Response): Promise<Response> {
  if (!response.ok) return upstreamFailure(response.status);
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return failure(502);
  }
  const profile = parseProfile(payload);
  return profile
    ? Response.json(profile, {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      })
    : failure(502);
}

function unexpected(error: unknown): Response {
  if (error instanceof Error && error.name === "UnauthenticatedError")
    return failure(401);
  if (error instanceof Error && error.name === "CsrfError") return failure(403);
  return failure(503);
}

/** Multipart avatar write; Nest validates type/size again server-side. */
export async function PATCH(request: Request) {
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
      return readProfile(
        await mutate("/media/avatar", {
          method: "PATCH",
          body: form,
          headers: { Accept: "application/json" },
        }),
      );
    });
  } catch (error) {
    return unexpected(error);
  }
}

/** Idempotent removal; 409 means a concurrent replacement won. */
export async function DELETE(request: Request) {
  try {
    return await handleAuthenticatedMutation(request, async ({ mutate }) =>
      readProfile(
        await mutate("/media/avatar", {
          method: "DELETE",
          headers: { Accept: "application/json" },
        }),
      ),
    );
  } catch (error) {
    return unexpected(error);
  }
}

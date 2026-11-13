import { validateImageFile } from "./media-upload.ts";
import {
  parseProfile,
  profileFailure,
  type ProfileOutcome,
} from "./profile-contract.ts";

type AvatarRequestOptions = {
  csrfToken: string;
  fetchImpl?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  signal?: AbortSignal;
};

async function readOutcome(response: Response): Promise<ProfileOutcome> {
  if (response.status >= 500) return { state: "uncertain" };
  if (!response.ok)
    return { state: "failure", reason: profileFailure(response.status) };
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return { state: "uncertain" };
  }
  const profile = parseProfile(payload);
  return profile ? { state: "success", profile } : { state: "uncertain" };
}

/** PATCH /media/avatar through the CSRF-checked Next route. */
export async function uploadAvatar(
  file: File,
  options: AvatarRequestOptions,
): Promise<ProfileOutcome> {
  const invalid = validateImageFile(file);
  if (invalid === "invalid") return { state: "failure", reason: "invalid" };
  if (invalid === "too-large") return { state: "failure", reason: "too-large" };
  if (options.signal?.aborted) return { state: "uncertain" };

  const body = new FormData();
  body.append("file", file);
  const fetchImpl = options.fetchImpl ?? ((input, init) => fetch(input, init));
  let response: Response;
  try {
    response = await fetchImpl("/api/media/avatar", {
      method: "PATCH",
      headers: { "x-csrf-token": options.csrfToken },
      body,
      signal: options.signal,
    });
  } catch {
    return { state: "uncertain" };
  }
  return readOutcome(response);
}

/** DELETE /media/avatar; Nest treats an absent avatar as success. */
export async function removeAvatar(
  options: AvatarRequestOptions,
): Promise<ProfileOutcome> {
  const fetchImpl = options.fetchImpl ?? ((input, init) => fetch(input, init));
  let response: Response;
  try {
    response = await fetchImpl("/api/media/avatar", {
      method: "DELETE",
      headers: { "x-csrf-token": options.csrfToken },
      signal: options.signal,
    });
  } catch {
    return { state: "uncertain" };
  }
  return readOutcome(response);
}

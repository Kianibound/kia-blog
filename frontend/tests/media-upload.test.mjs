import assert from "node:assert/strict";
import test from "node:test";
import {
  MediaUploadError,
  MAX_IMAGE_BYTES,
  mediaUploadMessage,
  uploadImageFile,
} from "../src/lib/media-upload.ts";

function file(type = "image/png", size = 100) {
  return new File([new Uint8Array(size)], "image.png", { type });
}

function response(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const uploaded = {
  id: "40000000-0000-4000-8000-000000000099",
  url: "https://res.cloudinary.com/demo/image/upload/v1/uploaded/image.png",
  width: 640,
  height: 360,
};

test("upload rejects invalid MIME, oversized files and pre-aborted signals", async () => {
  await assert.rejects(() => uploadImageFile(file("image/gif"), { csrfToken: "c" }), (error) => error instanceof MediaUploadError && error.kind === "invalid");
  await assert.rejects(() => uploadImageFile(file("image/png", MAX_IMAGE_BYTES), { csrfToken: "c" }), (error) => error instanceof MediaUploadError && error.kind === "too-large");
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(() => uploadImageFile(file(), { csrfToken: "c", signal: controller.signal }), (error) => error instanceof MediaUploadError && error.kind === "aborted");
});

test("upload sends multipart with the session CSRF header and trusts only the server response", async () => {
  let request;
  const result = await uploadImageFile(file(), {
    csrfToken: "csrf-token",
    fetchImpl: async (url, init) => {
      request = { url, init };
      return response(uploaded, 201);
    },
  });
  assert.equal(request.url, "/api/media/images");
  assert.equal(request.init.headers["x-csrf-token"], "csrf-token");
  assert.ok(request.init.body instanceof FormData);
  assert.deepEqual(result, uploaded);

  for (const bad of [
    { ...uploaded, url: "https://evil.test/image.png" },
    { ...uploaded, id: "not-a-uuid" },
    { ...uploaded, url: "http://res.cloudinary.com/demo/image/upload/a.png" },
  ]) {
    await assert.rejects(
      () => uploadImageFile(file(), { csrfToken: "c", fetchImpl: async () => response(bad) }),
      (error) => error instanceof MediaUploadError && error.kind === "unsupported",
    );
  }
});

test("upload maps 401/413/422/5xx without exposing backend bodies", async () => {
  for (const [status, kind] of [[401, "unauthenticated"], [413, "too-large"], [422, "invalid"], [500, "unavailable"], [503, "unavailable"]]) {
    await assert.rejects(
      () => uploadImageFile(file(), {
        csrfToken: "c",
        fetchImpl: async () => response({ message: "upstream secret" }, status),
      }),
      (error) => {
        assert.ok(error instanceof MediaUploadError);
        assert.equal(error.kind, kind);
        assert.ok(!error.message.includes("upstream"));
        return true;
      },
    );
  }
  assert.match(mediaUploadMessage("too-large"), /۵ مگابایت/);
});

test("abort during upload surfaces an aborted state", async () => {
  const controller = new AbortController();
  const pending = uploadImageFile(file(), {
    csrfToken: "c",
    signal: controller.signal,
    fetchImpl: async () => {
      controller.abort();
      throw new DOMException("aborted", "AbortError");
    },
  });
  await assert.rejects(() => pending, (error) => error instanceof MediaUploadError && error.kind === "aborted");
});

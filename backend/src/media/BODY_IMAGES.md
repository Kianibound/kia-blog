# Article body images (Issue #48)

Existing `POST /media/images` remains the multipart upload endpoint. A valid
Bearer session is required. Upload `file` containing JPEG, PNG or WebP, strictly
less than 5 MiB. Nest validates detected file signatures, not the client MIME
label alone. Invalid/missing files return 422; the multipart stream limit rejects
files above 5 MiB with 413 before Cloudinary. The existing Cloudinary adapter
stores bytes and creates the owned Media record; the response's `id` is the
stable reference. No new provider, credentials or environment variables are added.

Existing article create/PATCH accepts this block-level leaf inside canonical
`contentDocument` (including blockquotes and list-item block positions):

```json
{
  "type": "image",
  "attrs": {
    "mediaId": "7a3e0fe6-81f3-4f42-b61e-361beea3a217",
    "alt": "A landscape",
    "title": "Optional caption hint"
  }
}
```

`mediaId` must be a UUID v4. `alt` is required nonblank literal text, up to 500
UTF-16 units. Optional `title` is literal text up to 256 units; null is rejected.
No `src`, arbitrary URLs, dimensions, `dir`, marks, children or other attributes
are accepted. Images cannot be inline or appear in code blocks. Existing rich
document size/depth/node/Unicode rules still apply. Image alt text joins the
plain-text search projection; IDs, URLs and title attributes are not indexed.
Legacy `content` strings are never interpreted as images, HTML or JSON.

On writes, every reference must exist, be `resourceType: image`, format
`jpg`/`jpeg`/`png`/`webp`, and have positive stored bytes strictly below 5 MiB.
AUTHOR may attach only Media owned by the Post author; ADMIN may attach any
eligible Media. Article ownership and role checks remain in force. Missing,
unsupported or unsafe Media yields 400, foreign ownership 403, and a concurrent
foreign-key conflict yields a safe 400. Rejected writes do not partially replace
content or references.

Image nodes round-trip unchanged. Article write/detail/feed/own-list and embedded
bookmark article responses add `contentMedia`, containing unique referenced items
in document order:

```json
{
  "contentMedia": [
    {
      "id": "7a3e0fe6-81f3-4f42-b61e-361beea3a217",
      "url": "https://res.cloudinary.com/example/image/upload/v1/article.png",
      "width": 800,
      "height": 600
    }
  ]
}
```

Legacy/text-only content returns an empty array. Dimensions may be null. The
compact ADMIN inventory remains unchanged. The projection excludes ownership,
Cloudinary public IDs, credentials and unrelated Media. URLs come only from
stored Media records and must be credential-free HTTPS on `res.cloudinary.com`
with an `/<cloud>/image/upload/` path, without query, fragment or custom port.
Custom delivery domains are not supported by this MVP contract. A page resolves
its references in one Media query. The server never fetches a document URL.

Render using a fixed schema, resolving each `mediaId` through `contentMedia`.
Escape alt/title and apply URL checks again; do not spread arbitrary attributes
or render raw HTML. Never fall back to a client-supplied URL when resolution is
missing. This issue does not implement the frontend adapter, image UI, captions,
transforms, external URLs, cover images or an image-management subsystem.

## Reference integrity and deletion

Apply migration `20261107210000_add_post_media_references` before using images,
and regenerate Prisma. It adds only the `PostMedia` join table, with a cascading
Post foreign key and restrictive Media foreign key. Existing content and Media
are unchanged; Issue #47 could not store image nodes, so no backfill is needed.

Create and content replacement update canonical JSON, search text and references
in a single nested Prisma write. Duplicate images share one reference. Metadata
edits preserve references. Explicit string replacement or removing image nodes
detaches them; deleting a Post cascades only its reference rows, not the Media.

`DELETE /media/:mediaId` retains owner-or-ADMIN authorization. It returns 409
while **any** Post references the Media, including DRAFT and DEPRECATED, with no
remote deletion. Detach the image or delete every referencing Post first. This
approved stronger rule protects drafts as well as published content. A database
foreign key also prevents concurrent attachment/deletion from leaving dangling
references. Missing Media returns 404; unauthorized deletion returns 403.

Deletion first attempts the database delete inside an open transaction, then
uses existing idempotent Cloudinary deletion, then commits. Provider failure
rolls back metadata. As with existing cross-system workflows, PostgreSQL and
Cloudinary cannot commit atomically: a later database commit failure can require
operator reconciliation of an unreferenced asset. Do not delete assets directly
in Cloudinary: out-of-band provider changes are outside database FK protection.
Avatar replacement uses this same deletion policy for old-image cleanup; an old
avatar referenced by an article is retained while the new avatar stays active.

Isolated HTTP/module tests substitute persistence and Cloudinary only. Disposable
PostgreSQL verification checks migration preservation, JSON/reference writes,
all-status restrictions, rollback and detachment; it does not access production.

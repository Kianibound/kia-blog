# Canonical article content — Issue #47

Issue #48 extends this grammar with stable body-image references. See
[body image contracts](../../media/BODY_IMAGES.md) for authorization, response
resolution, image attributes and restrictive deletion behavior.

## Storage and API contract

Existing `Post.content` remains a non-null string. New nullable
`Post.contentDocument` is PostgreSQL JSONB. Legacy rows remain unchanged, with
SQL NULL in the new column. There is no backfill or automatic JSON/HTML parsing.
JSON-looking legacy strings are still literal text.

Existing article create/update endpoints accept either:

- `content`: the existing nonempty literal string; or
- `contentDocument`: the root Tiptap `doc` object described below.

Create requires exactly one source. PATCH accepts at most one; omitting both
preserves both stored fields. Supplying a document derives `content` server-side.
An explicit string replacement sets `contentDocument` to SQL NULL. Supplying both
fields, explicit nulls, a serialized JSON string in `contentDocument`, or a
fixture preview envelope is a 400 error. Existing title, ownership, publication,
taxonomy and authorization rules are unchanged.

For example, create an article with this JSON body:

```json
{
  "title": "Rich article",
  "contentDocument": {
    "type": "doc",
    "attrs": { "dir": "rtl" },
    "content": [
      {
        "type": "heading",
        "attrs": { "level": 2, "dir": "rtl" },
        "content": [{ "type": "text", "text": "Heading" }]
      },
      {
        "type": "paragraph",
        "content": [{ "type": "text", "text": "Plain search text", "marks": [{ "type": "bold" }] }]
      }
    ]
  }
}
```

Write, private detail, administrative detail, own-post list, public detail and
public feed responses expose both `content` and `contentDocument` through the
existing Post response DTOs. Legacy documents return `contentDocument: null`.
The compact ADMIN inventory remains a summary and excludes article content.
Node/mark order, text, and supplied allowed attributes round-trip without adding
editor defaults or converting to HTML. JSON object key order is not significant.

## Grammar and attributes

All objects have allowlisted keys only. Unknown nodes, marks, attributes, extra
fields, incorrect value types, NUL and unpaired UTF-16 surrogates are rejected.
Every non-text node except image may have `attrs.dir`: `rtl`, `ltr`, `auto`, or null.

| Node | Allowed content | Other attributes |
| --- | --- | --- |
| `doc` | One or more paragraph, heading, list, blockquote or codeBlock nodes | None |
| `paragraph` | Zero or more text/hardBreak nodes | None |
| `image` | Leaf; no inline placement | Required `mediaId`, `alt`; optional `title`; see Issue #48 contract |
| `heading` | Zero or more text/hardBreak nodes | Required numeric `level`: 2, 3 or 4 |
| `bulletList` | One or more listItem nodes | None |
| `orderedList` | One or more listItem nodes | Optional integer `start` 1–1,000,000; `type` null, `1`, `a`, `A`, `i` or `I` |
| `listItem` | A paragraph, followed by zero or more ordinary block nodes | None |
| `blockquote` | One or more ordinary block nodes | None |
| `codeBlock` | Zero or more text nodes without marks | Optional `language`: null or up to 64 ASCII letters/digits/`_+.#-` (empty allowed) |
| `hardBreak` | No content or text property | None |
| `text` | Required nonempty literal `text`; no children or attributes | None |

An ordinary block means paragraph, heading, bulletList, orderedList, blockquote
or codeBlock; listItem is valid only inside a list. Empty paragraphs and empty
code blocks are valid. An empty root document is not.

Text/hardBreak marks are `bold`, `italic`, `code` and `link`. Duplicate marks are
rejected. `code` cannot combine with other marks, and codeBlock text cannot have
marks. Bold/italic/code have no attributes. A link requires `attrs.href`:

- Absolute HTTP or HTTPS only, at most 2048 UTF-16 units; no credentials,
  whitespace or control characters. Relative, protocol-relative, mailto,
  javascript, data, blob and file links are rejected.
- Optional `target`: `_blank`, `_self` or null.
- Optional `rel`: single-space-separated noopener/noreferrer/nofollow tokens,
  including both noopener and noreferrer. Null is accepted only with an explicit
  null or `_self` target. Omission allows the renderer's safe defaults.
- Optional `class`: null only. Optional `title`: null or at most 256 UTF-16 units.

The rules match the current editor's heading levels, directions, list attributes,
code-block language and default link attributes. The backend also supports the
explicitly requested blockquote and inline-code features, which the current
frontend configuration disables. No frontend changes are made in this ticket.
Cover fields, tables, raw HTML, horizontal rules,
strike, underline and textStyle marks are not accepted here. Media work belongs
to Issues #48/#49.

## Bounds and search projection

The compact serialized document is limited to **65,536 UTF-8 bytes**, **16 node
levels** including the root and text, and **2,000 nodes plus marks**. Attributes
have the additional limits above. Validation examines raw document input before
Nest DTO transformation, preventing excessive recursive input from overflowing
that transformation. The same validator is used by DTO validation and storage
preparation. Malformed/unsupported/over-limit documents return 400 without writes.
Existing HTTP body-parser limits still apply; larger requests may return 413.
Legacy string validation and transport limits are otherwise unchanged.

Plain text concatenates inline text (including across marks), maps hardBreak to
newline, and separates block children with newline. Code text, Unicode, digits
and ZWNJ are preserved. Link destinations and formatting metadata are not indexed.
Existing title/content search queries continue to search this string projection;
no new search engine or index is introduced. A metadata-only edit does not rebuild
or clear content. Switching back to a string clears the JSON in the same write.

## Safe rendering and frontend integration

Stored content is **untrusted data**, not sanitized HTML. Never decode a legacy
string as HTML/JSON and never send article content to `dangerouslySetInnerHTML`,
raw template interpolation, `eval`, or executable code loaders. Render text with
escaping and rich JSON through a fixed read-only Tiptap/ProseMirror schema matching
this allowlist. Do not spread arbitrary attributes onto DOM elements. Recheck link
destinations on rendering and enforce `rel="noopener noreferrer"` for `_blank`
links independently of stored values. Treat language as a bounded display hint.
Any later HTML conversion needs its own safe escaping/sanitization boundary.

The current UI preview envelope is not an accepted API format. A later frontend
adapter must submit the editor's raw document as `contentDocument`, consume that
field when non-null, and fall back to literal `content` for legacy rows. It must
enable/handle blockquote and inline code before offering this full feature set.
Body images use the Issue #48 contract linked above. The optional article cover
is a separate field-level contract (Issue #49): `coverMediaId` + `coverAlt` on
create/update, resolved into `coverImage` on responses.

## Migration and verification

Apply `20261107193000_add_post_content_document` and regenerate Prisma before
using the new endpoints. The migration adds one nullable column and does not
rewrite existing rows. No new environment variable is needed.

The existing isolated HTTP/module seam covers rich/legacy round trips, grammar,
unsafe input, resource bounds, search projection and OpenAPI. The recursive schema
check uses a visited set to handle recursive Tiptap references. Existing Posts
behavior tests protect publication and ownership rules. Disposable PostgreSQL
verification additionally checks legacy row preservation, Prisma JSON create/
read/update, search, metadata-only edits and SQL-null clearing. These checks do not
constitute production migration or frontend integration.

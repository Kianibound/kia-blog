# Article editor UI preview

Issue #20 uses the existing AUTHOR create/edit preview at port 3102 and the
resettable loopback HTTP fixture at port 4101. Production routes have no fixture
adapter or save capability. No public article rendering or search behavior changes.

The proposed **UI review shape** is a separate test-only `previewDocument` field:

```json
{
  "format": "tiptap-ui-proposal-1",
  "document": {
    "type": "doc",
    "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "متن 123" }] }]
  }
}
```

This envelope is an experiment for preserving toolbar formatting between preview
reloads. It is not a canonical format, migration/versioning policy, backend schema,
or security validator. The existing `content` string contains the editor's plain
text, never serialized document JSON. The fixture retains the extra document on
the same resettable record used by author list/detail; scalar list responses omit
it. Public fixture records remain independent. Existing literal strings are
converted to paragraphs as text, without interpreting HTML or normalizing digits.

`RichEditor` accepts initial transient state once per mount, an `onChange` callback,
`editable`, and `error`; it exposes no Tiptap editor instance. Form changes do not
replace the document or reset undo history. A different article mounts a new
editor through the existing keyed preview composition.

The toolbar supports H2–H4 for review, paragraphs, bold/italic, lists, links,
code blocks, direction, and undo/redo. Alt+F10 enters the toolbar; RTL arrow keys,
Home/End, and Escape support keyboard navigation. Code renders LTR. Authored
digits and composition text are retained. Link feedback allows explicit HTTP(S)
URLs without credentials; it is not production content validation.

Implementation follows Tiptap's [Next.js deferred initialization guidance](https://tiptap.dev/docs/editor/getting-started/install/nextjs)
and [link URI validation interface](https://tiptap.dev/docs/editor/extensions/marks/link).
Browser evidence is fixture-backed; synthetic composition events do not replace
manual testing with a real Persian IME. Images, collaboration, real persistence,
canonical validation, and public rich-content rendering remain outside Issue #20.

Issue #22 adds the official Tiptap image node and an explicitly supplied upload
adapter in this preview. Choose PNG/JPEG/WebP (up to 5 MB), enter alt text, then
insert; select an inserted image to remove it. The image panel blocks saving and
publication until insertion or cancellation. Failed requests retain file and alt
text for retry; cancellation aborts the request and ignores late completion.
The resettable HTTP fixture stores selected bytes in memory and returns a
`/fixture-images/<id>` reference served through test-host routes. Blob/data URLs
are never inserted; fixture saves reject unknown image references. References
survive article save/reload and published test reading until fixture reset or
process restart. These routes and the upload adapter exist only in the test host.
Run `npm run test:dashboard -- --grep 'article images|image fixture'` to verify.

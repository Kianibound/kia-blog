import type { EditorDocument } from "@/components/editor/types";

// Proposed UI review envelope, used only by the resettable HTTP test double.
// Not a canonical schema/version or a security validator for production content.
export type PreviewDocument = { format: "tiptap-ui-proposal-1"; document: EditorDocument };

export function readPreviewDocument(value: unknown): PreviewDocument | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "object" || value === null || !("format" in value) || value.format !== "tiptap-ui-proposal-1" || !("document" in value) || typeof value.document !== "object" || value.document === null || !("type" in value.document) || value.document.type !== "doc" || !("content" in value.document) || !Array.isArray(value.document.content)) throw new Error("Invalid fixture UI document envelope");
  return value as PreviewDocument;
}

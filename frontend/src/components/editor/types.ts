/** Transient UI state only. This is not the blog's canonical storage contract. */
export type EditorDocument = {
  type: string;
  attrs?: Record<string, unknown>;
  text?: string;
  content?: EditorDocument[];
  marks?: { type: string; attrs?: Record<string, unknown> }[];
};

export type RichEditorProps = {
  id: string;
  label: string;
  initialDocument: EditorDocument;
  editable: boolean;
  error?: string;
  onChange: (value: { document: EditorDocument; plainText: string }) => void;
};

/** Treat existing string content literally, including HTML-looking text and digits. */
export function documentFromText(text: string): EditorDocument {
  return { type: "doc", content: text.split("\n").map(line => ({ type: "paragraph", ...(line ? { content: [{ type: "text", text: line }] } : {}) })) };
}

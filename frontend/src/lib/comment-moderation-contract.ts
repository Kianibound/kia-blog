// Minimal test-preview projection; this is not a production moderation API contract.
export type ModerationComment = { id: string; name: string; text: string; status: "PENDING" | "APPROVED" };
export type CommentOperation = "approve" | "delete";
export type CommentModerationResult = "saved" | "error" | "uncertain";

export function parseModerationComments(value: unknown): ModerationComment[] {
  if (!Array.isArray(value)) throw new Error("Invalid fixture Comments");
  const comments = value.map((item: unknown): ModerationComment => {
    if (typeof item !== "object" || item === null || Array.isArray(item) || !("id" in item) || typeof item.id !== "string" || !item.id.trim() || !("name" in item) || typeof item.name !== "string" || !item.name.trim() || !("text" in item) || typeof item.text !== "string" || !item.text.trim() || !("status" in item) || (item.status !== "PENDING" && item.status !== "APPROVED")) throw new Error("Invalid fixture Comment");
    return { id: item.id, name: item.name, text: item.text, status: item.status };
  });
  if (new Set(comments.map(item => item.id)).size !== comments.length) throw new Error("Duplicate fixture Comment");
  return comments;
}

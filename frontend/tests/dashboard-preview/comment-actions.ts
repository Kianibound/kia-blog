"use server";

import { readFixtureIdentity } from "./identity";
import type { CommentModerationResult, CommentOperation } from "@/lib/comment-moderation-contract";

// Test-only moderation adapter. No production endpoints, credentials or auth policy.
export async function moderateFixtureComment(id: string, operation: CommentOperation): Promise<CommentModerationResult> {
  if ((await readFixtureIdentity())?.role !== "ADMIN" || typeof id !== "string" || !id.trim() || (operation !== "approve" && operation !== "delete")) return "error";
  try {
    const response = await fetch(`http://127.0.0.1:4101/dashboard-comments/${encodeURIComponent(id)}`, {
      method: operation === "delete" ? "DELETE" : "PATCH",
      ...(operation === "approve" ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "APPROVED" }) } : {}),
      cache: "no-store", signal: AbortSignal.timeout(2500),
    });
    if (response.status === 204) return "saved";
    return response.status >= 400 && response.status < 500 ? "error" : "uncertain";
  } catch { return "uncertain"; }
}

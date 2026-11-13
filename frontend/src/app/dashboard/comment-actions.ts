"use server";

import {
  approveVersionIsValid,
  parseAdminComment,
  parseOwnComment,
  validateCommentText,
  type AdminComment,
  type CommentMutationOutcome,
  type OwnComment,
} from "@/lib/comments-contract";
import { runCommentMutation } from "@/lib/comment-mutations";

function isCommentId(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** Owner edit: Nest returns the comment as PENDING with a new version. */
export async function updateOwnCommentAction(
  id: string,
  content: string,
  csrfToken: string,
): Promise<CommentMutationOutcome<OwnComment>> {
  if (!isCommentId(id) || validateCommentText(content))
    return { state: "failure", reason: "validation" };
  return runCommentMutation<OwnComment>({
    csrfToken,
    method: "PATCH",
    path: `/comments/${encodeURIComponent(id)}`,
    body: { content: content.trim() },
    parse: parseOwnComment,
  });
}

/** Owner or ADMIN delete; Nest cascades the comment's replies. */
export async function deleteCommentAction(
  id: string,
  csrfToken: string,
): Promise<CommentMutationOutcome> {
  if (!isCommentId(id)) return { state: "failure", reason: "validation" };
  return runCommentMutation({
    csrfToken,
    method: "DELETE",
    path: `/comments/${encodeURIComponent(id)}`,
  });
}

/** Version-conditional approval; a stale version is a 409 and changes nothing. */
export async function approveCommentAction(
  id: string,
  version: number,
  csrfToken: string,
): Promise<CommentMutationOutcome<AdminComment>> {
  if (!isCommentId(id) || !approveVersionIsValid(version))
    return { state: "failure", reason: "validation" };
  return runCommentMutation<AdminComment>({
    csrfToken,
    method: "PATCH",
    path: `/admin/comments/${encodeURIComponent(id)}/approve`,
    body: { version },
    parse: parseAdminComment,
  });
}

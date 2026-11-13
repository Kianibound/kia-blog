"use server";

import {
  parseOwnComment,
  validateCommentText,
  type CommentMutationOutcome,
  type OwnComment,
} from "@/lib/comments-contract";
import { runCommentMutation } from "@/lib/comment-mutations";

/** Public article comment submission; Nest stores it as PENDING. */
export async function submitArticleCommentAction(
  postId: string,
  content: string,
  csrfToken: string,
): Promise<CommentMutationOutcome<OwnComment>> {
  if (typeof postId !== "string" || !postId.trim() || validateCommentText(content))
    return { state: "failure", reason: "validation" };
  return runCommentMutation<OwnComment>({
    csrfToken,
    method: "POST",
    path: `/posts/${encodeURIComponent(postId)}/comments`,
    body: { content: content.trim() },
    parse: parseOwnComment,
  });
}

import { redirect } from "next/navigation";
import {
  AuthorPostFilters,
  AuthorPostList,
  AuthorPostsDenied,
  AuthorPostsInvalidFilter,
  AuthorPostsLoading,
  AuthorPostsUnavailable,
} from "@/components/dashboard/author-post-list";
import { loadInventory } from "@/lib/dashboard/inventory";
import {
  inventoryHref,
  type OwnPostStatusFilter,
  type OwnPosts,
} from "@/lib/own-posts-contract";
import type { PublicAccount } from "@/lib/auth/current-user";

export async function ProductionPosts({
  account,
  page,
  status,
  invalidStatus = false,
}: {
  account: PublicAccount;
  page: number;
  status?: OwnPostStatusFilter;
  invalidStatus?: boolean;
}) {
  const role = account.user.role;
  if (role !== "AUTHOR" && role !== "ADMIN") return null;
  if (invalidStatus)
    return <AuthorPostsInvalidFilter href={inventoryHref(role, 1)} />;

  const result = await loadInventory({
    role,
    page,
    status: role === "AUTHOR" ? status : undefined,
    authorId: account.user.id,
  });

  if (result.status === "unauthenticated")
    redirect(`/session/clear?next=${encodeURIComponent(inventoryHref(role, page, status))}`);
  if (result.status === "forbidden") return <AuthorPostsDenied />;
  if (result.status === "unavailable")
    return (
      <AuthorPostsUnavailable
        page={page}
        status={role === "AUTHOR" ? status : undefined}
        admin={role === "ADMIN"}
      />
    );

  if (result.role === "ADMIN") {
    const posts: OwnPosts = {
      data: result.posts.data.map((post) => ({ ...post, content: "" })),
      meta: result.posts.meta,
    };
    const authors = Object.fromEntries(
      result.posts.data.map((post) => [
        post.authorId,
        post.author.name?.trim() || post.author.username,
      ]),
    );
    return (
      <AuthorPostList
        posts={posts}
        authors={authors}
        href={(nextPage) => inventoryHref("ADMIN", nextPage)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <AuthorPostFilters
        status={status}
        href={(nextStatus) => inventoryHref("AUTHOR", 1, nextStatus)}
      />
      <AuthorPostList
        posts={result.posts}
        status={status}
        href={(nextPage) => inventoryHref("AUTHOR", nextPage, status)}
      />
    </div>
  );
}

export function ProductionPostsLoading({
  admin = false,
}: {
  admin?: boolean;
}) {
  return <AuthorPostsLoading admin={admin} />;
}

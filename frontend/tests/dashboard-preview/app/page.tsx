import PublicLayout from "@/app/(public)/layout";
import Home from "@/app/(public)/page";
import type { PostsSearchParams } from "@/lib/posts-query";

export const dynamic = "force-dynamic";

export default function PreviewBlog({ searchParams }: { searchParams: Promise<PostsSearchParams> }) {
  return <PublicLayout><Home searchParams={searchParams} /></PublicLayout>;
}

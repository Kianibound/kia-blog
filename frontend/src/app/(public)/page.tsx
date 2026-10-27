import { PostCard } from "@/components/posts/post-card";
import { messages } from "@/i18n/messages/fa";
import { getFirstPublishedPosts } from "@/lib/posts";

// Keep environment validation and public reads at request time, not during builds.
export const dynamic = "force-dynamic";

export default async function Home() {
  const posts = await getFirstPublishedPosts();

  return (
    <div className="space-y-8">
      <div className="max-w-2xl space-y-4">
        <p className="text-sm font-medium text-brand">{messages.home.eyebrow}</p>
        <h1 className="text-3xl leading-tight font-bold sm:text-4xl">{messages.home.title}</h1>
        <p>{messages.home.description}</p>
      </div>
      <ul aria-label={messages.home.feedLabel} className="grid gap-4 md:grid-cols-2">
        {posts.map((post) => (
          <li key={post.id} className="min-w-0">
            <PostCard post={post} />
          </li>
        ))}
      </ul>
    </div>
  );
}

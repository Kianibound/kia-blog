import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { authorPostsMessages as copy, adminPostsMessages } from "@/i18n/messages/author-posts.fa";
import { formatPublicationDate } from "@/lib/publication-date";
import { fa } from "@/lib/utils";
import type { OwnPosts, OwnPostStatusFilter } from "@/lib/own-posts-contract";
import { articleFormMessages as formCopy } from "@/i18n/messages/article-form.fa";

const controlClass = "inline-flex min-h-12 items-center justify-center rounded-control border border-border px-4 font-semibold hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring";

export function AuthorPostFilters({ status, href }: { status?: OwnPostStatusFilter; href: (status?: OwnPostStatusFilter) => string }) {
  return <nav aria-label={copy.statusFilters} className="flex min-h-12 flex-wrap gap-4">
    {([undefined, "DRAFT", "PUBLISHED"] as const).map(value => <Link key={value ?? "all"} href={href(value)} aria-current={status === value ? "page" : undefined} className={`${controlClass} ${status === value ? "bg-secondary text-secondary-foreground" : ""}`}>{value ? copy.states[value] : copy.all}</Link>)}
  </nav>;
}

export function AuthorPostList({ posts, href, status, formLinks, authors }: { posts: OwnPosts; href: (page: number) => string; status?: OwnPostStatusFilter; formLinks?: { create?: string; edit: (id: string) => string }; authors?: Record<string, string> }) {
  const messages = authors ? adminPostsMessages : copy;
  const { data, meta } = posts;
  return <section className="min-h-64 space-y-6" aria-label={messages.title}>
    {formLinks?.create && <Link href={formLinks.create} className={controlClass}>{formCopy.create}</Link>}
    {data.length > 0 && <ul aria-label={messages.title} className="space-y-4">{data.map(post => <li key={post.id}>
      <Card className="space-y-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h2 className="min-w-0 text-xl leading-tight font-semibold wrap-anywhere">{fa(post.title)}</h2>
          <span className="rounded-control bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground">{copy.states[post.status]}</span>
        </div>
        {authors && <p className="wrap-anywhere">نویسنده: {fa(authors[post.authorId])}</p>}
        <p className="text-sm text-muted-foreground">{copy.updated}: <time dateTime={post.updatedAt}>{formatPublicationDate(post.updatedAt)}</time></p>
        <p className="text-sm wrap-anywhere">{copy.slug}: <bdi>{post.slug}</bdi></p>
        {formLinks && <Link href={formLinks.edit(post.id)} className={controlClass}>{formCopy.edit}</Link>}
      </Card>
    </li>)}</ul>}
    {meta.total === 0 ? <Card className="min-h-64 p-6"><p role="status">{status ? copy.emptyStatus : messages.empty}</p></Card> : data.length === 0 ? <Card className="min-h-64 space-y-4 p-6"><p role="status">{copy.outOfRange}</p><Link href={href(1)} className={controlClass}>{copy.firstPage}</Link></Card> :
      <nav aria-label={messages.pagination} className="flex flex-wrap items-center justify-center gap-4">
        {meta.page > 1 && <Link href={href(meta.page - 1)} className={controlClass}>{copy.previous}</Link>}
        <p>{copy.page} {fa(meta.page)} {copy.of} {fa(meta.totalPages)}</p>
        {meta.page < meta.totalPages && <Link href={href(meta.page + 1)} className={controlClass}>{copy.next}</Link>}
      </nav>}
  </section>;
}

export function AuthorPostsLoading({ admin = false }: { admin?: boolean }) {
  return <section className="min-h-64 space-y-4" aria-busy="true"><p role="status">{admin ? adminPostsMessages.loading : copy.loading}</p>{Array.from({ length: 10 }, (_, index) => <Card key={index} className="space-y-4 p-6"><Skeleton className="h-8 w-3/4 motion-reduce:animate-none" />{admin && <Skeleton className="h-6 w-1/2 motion-reduce:animate-none" />}<Skeleton className="h-6 w-1/2 motion-reduce:animate-none" /><Skeleton className="h-6 w-3/4 motion-reduce:animate-none" /></Card>)}</section>;
}

export function AuthorPostsUnavailable({ page, status, admin = false }: { page: number; status?: OwnPostStatusFilter; admin?: boolean }) {
  return <Card role="alert" className="min-h-64 space-y-4 p-6"><p>{admin ? adminPostsMessages.unavailable : copy.unavailable}</p><form method="get"><input type="hidden" name="page" value={page} />{status && <input type="hidden" name="status" value={status} />}<Button size="lg" type="submit" className="motion-reduce:transition-none">{copy.retry}</Button></form></Card>;
}

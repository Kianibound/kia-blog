import { notFound } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardLoading, DashboardUnavailable } from "@/components/dashboard/dashboard-states";
import { Card } from "@/components/ui/card";
import { dashboardMessages as copy } from "@/i18n/messages/dashboard.fa";
import { readFixtureIdentity } from "../../../identity";
import { PreviewOwnPosts } from "../../../own-posts";
import { AuthorPostsLoading, AuthorPostsUnavailable } from "@/components/dashboard/author-post-list";
import { authorPostsMessages as postsCopy } from "@/i18n/messages/author-posts.fa";
import { articleFormMessages as formCopy } from "@/i18n/messages/article-form.fa";
import { PreviewArticleForm } from "../../../article-form";
import { ArticleFormLoading } from "@/components/dashboard/article-form";

export const dynamic = "force-dynamic";

const workspaces = {
  USER: { title: "فضای خواندن", description: "مقاله‌ها را بخوانید و موضوع‌های دلخواهتان را دنبال کنید." },
  AUTHOR: { title: "فضای نویسندگی", description: "مقالهٔ جدیدی بنویسید یا برای ادامهٔ ویرایش به مقاله‌ها و پیش‌نویس‌های خود سر بزنید." },
  ADMIN: { title: "فضای مدیریت", description: "مدیریت کاربران، نویسندگان و مقاله‌ها در مرحله‌های بعدی اضافه می‌شود." },
};

async function PreviewContent({ workspacePage, postsPage, page, form }: { workspacePage: boolean; postsPage: boolean; page: number; form?: { id?: string; unavailable?: boolean } }) {
  const identity = await readFixtureIdentity();
  const workspace = identity ? workspaces[identity.role] : null;
  const destinations = workspace ? [{ href: "/dashboard", label: copy.title }, { href: "/dashboard/workspace", label: workspace.title }] : [];
  if (identity?.role === "AUTHOR") destinations.push({ href: "/dashboard/posts", label: postsCopy.title });
  return (
    <DashboardShell identity={identity} destinations={destinations} title={form ? form.id ? formCopy.edit : formCopy.create : postsPage ? postsCopy.title : workspacePage && workspace ? workspace.title : copy.title} description={postsPage ? postsCopy.description : copy.description} actions={<Link href="/" className="inline-flex min-h-12 items-center rounded-control bg-brand px-6 font-semibold text-brand-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">{copy.browse}</Link>}>
      {postsPage ? !identity ? <AuthorPostsUnavailable page={page} /> : identity.role === "AUTHOR" ? form ? <Suspense fallback={<ArticleFormLoading />}><PreviewArticleForm {...form} authorId={identity.id} /></Suspense> : <Suspense key={page} fallback={<AuthorPostsLoading />}><PreviewOwnPosts page={page} authorId={identity.id} /></Suspense> : <Card className="min-h-64 p-6"><p>فهرست مقاله‌های نویسنده در این پیش‌نمایش در دسترس نیست.</p></Card> : workspace ? <Card className="min-h-64 space-y-4 p-6 sm:p-8">
        <h2 className="text-xl leading-tight font-semibold">{workspace.title}</h2>
        <p>{workspace.description}</p>
        {workspacePage && identity?.role === "AUTHOR" && <div className="flex flex-wrap gap-4">
          <Link href="/dashboard/posts/new" className="inline-flex min-h-12 items-center justify-center rounded-control bg-brand px-6 font-semibold text-brand-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">مقاله جدید</Link>
          <Link href="/dashboard/posts" className="inline-flex min-h-12 items-center justify-center rounded-control border border-border px-6 font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">{postsCopy.title}</Link>
        </div>}
        <p>امکانات حساب و عملیات واقعی تا پیاده‌سازی ورود امن در دسترس نیستند.</p>
      </Card> : <DashboardUnavailable retryHref={workspacePage ? "/dashboard/workspace" : "/dashboard"} />}
    </DashboardShell>
  );
}

export default async function DashboardPreview({ params, searchParams }: { params: Promise<{ section?: string[] }>; searchParams: Promise<{ page?: string | string[] }> }) {
  const { section = [] } = await params;
  const form = section[0] === "posts" && section.length === 2 && ["new", "unavailable"].includes(section[1]) ? { unavailable: section[1] === "unavailable" } : section[0] === "posts" && section.length === 3 && section[2] === "edit" ? { id: section[1] } : undefined;
  if (!form && (section.length > 1 || (section.length === 1 && !["workspace", "posts"].includes(section[0])))) notFound();
  const input = (await searchParams).page;
  const numeric = typeof input === "string" && /^\d+$/.test(input) ? Number(input) : 1;
  const page = Number.isSafeInteger(numeric) && numeric > 0 ? numeric : 1;
  return <Suspense fallback={<DashboardLoading />}><PreviewContent workspacePage={section[0] === "workspace"} postsPage={section[0] === "posts"} page={page} form={form} /></Suspense>;
}

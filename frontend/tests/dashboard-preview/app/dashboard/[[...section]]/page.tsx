import { notFound } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardLoading, DashboardUnavailable } from "@/components/dashboard/dashboard-states";
import { Card } from "@/components/ui/card";
import { dashboardMessages as copy } from "@/i18n/messages/dashboard.fa";
import { readFixtureIdentity } from "../../../identity";

export const dynamic = "force-dynamic";

const workspaces = {
  USER: { title: "فضای خواندن", description: "مقاله‌ها را بخوانید و موضوع‌های دلخواهتان را دنبال کنید." },
  AUTHOR: { title: "فضای نویسندگی", description: "فضای نوشتن و مدیریت مقاله‌های شما در مرحله‌های بعدی اضافه می‌شود." },
  ADMIN: { title: "فضای مدیریت", description: "مدیریت کاربران، نویسندگان و مقاله‌ها در مرحله‌های بعدی اضافه می‌شود." },
};

async function PreviewContent({ workspacePage }: { workspacePage: boolean }) {
  const identity = await readFixtureIdentity();
  const workspace = identity ? workspaces[identity.role] : null;
  const destinations = workspace ? [{ href: "/dashboard", label: copy.title }, { href: "/dashboard/workspace", label: workspace.title }] : [];
  return (
    <DashboardShell identity={identity} destinations={destinations} title={workspacePage && workspace ? workspace.title : copy.title} description={copy.description} actions={<Link href="/" className="inline-flex min-h-12 items-center rounded-control bg-brand px-6 font-semibold text-brand-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">{copy.browse}</Link>}>
      {workspace ? <Card className="min-h-64 space-y-4 p-6 sm:p-8">
        <h2 className="text-xl leading-tight font-semibold">{workspace.title}</h2>
        <p>{workspace.description}</p>
        <p>امکانات حساب و عملیات واقعی تا پیاده‌سازی ورود امن در دسترس نیستند.</p>
      </Card> : <DashboardUnavailable retryHref={workspacePage ? "/dashboard/workspace" : "/dashboard"} />}
    </DashboardShell>
  );
}

export default async function DashboardPreview({ params }: { params: Promise<{ section?: string[] }> }) {
  const { section = [] } = await params;
  if (section.length > 1 || (section.length === 1 && section[0] !== "workspace")) notFound();
  return <Suspense fallback={<DashboardLoading />}><PreviewContent workspacePage={section.length === 1} /></Suspense>;
}

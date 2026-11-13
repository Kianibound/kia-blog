import type {
  DashboardDestination,
  DashboardIdentity,
  DashboardRole,
} from "@/components/dashboard/types";
import type { AuthenticatedUser } from "@/lib/auth/nest-auth";
import { dashboardMessages as copy } from "../../i18n/messages/dashboard.fa.ts";
import { authorsMessages } from "../../i18n/messages/authors.fa.ts";
import { articleFormMessages } from "../../i18n/messages/article-form.fa.ts";

export type DashboardSectionMeta = {
  title: string;
  description: string;
};

const sections: Record<
  string,
  { roles: ReadonlySet<DashboardRole>; meta: DashboardSectionMeta }
> = {
  "": {
    roles: new Set(["USER", "AUTHOR", "ADMIN"]),
    meta: { title: copy.title, description: copy.description },
  },
  workspace: {
    roles: new Set(["AUTHOR", "ADMIN"]),
    meta: copy.sections.workspace,
  },
  "my-comments": {
    roles: new Set(["USER"]),
    meta: copy.sections.myComments,
  },
  bookmarks: {
    roles: new Set(["USER"]),
    meta: copy.sections.bookmarks,
  },
  posts: {
    roles: new Set(["AUTHOR", "ADMIN"]),
    meta: copy.sections.posts,
  },
  comments: {
    roles: new Set(["ADMIN"]),
    meta: copy.sections.comments,
  },
  categories: {
    roles: new Set(["ADMIN"]),
    meta: copy.sections.categories,
  },
  authors: {
    roles: new Set(["ADMIN"]),
    meta: copy.sections.authors,
  },
  avatar: {
    roles: new Set(["AUTHOR"]),
    meta: copy.sections.avatar,
  },
};

/** The ADMIN author-creation form is a nested route, not a section. */
function authorCreateSection(section: readonly string[]): boolean {
  return section.length === 2 && section[0] === "authors" && section[1] === "new";
}

const destinations: Record<DashboardRole, DashboardDestination[]> = {
  USER: [
    { href: "/dashboard", label: copy.title },
    { href: "/dashboard/bookmarks", label: copy.sections.bookmarks.title },
    { href: "/dashboard/my-comments", label: copy.sections.myComments.title },
  ],
  AUTHOR: [
    { href: "/dashboard", label: copy.title },
    { href: "/dashboard/workspace", label: copy.workspaces.AUTHOR.title },
    { href: "/dashboard/posts", label: copy.authorPosts },
    { href: "/dashboard/avatar", label: copy.sections.avatar.title },
  ],
  ADMIN: [
    { href: "/dashboard", label: copy.title },
    { href: "/dashboard/workspace", label: copy.workspaces.ADMIN.title },
    { href: "/dashboard/categories", label: copy.sections.categories.title },
    { href: "/dashboard/comments", label: copy.sections.comments.title },
    { href: "/dashboard/posts", label: copy.sections.posts.title },
    { href: "/dashboard/authors", label: copy.sections.authors.title },
  ],
};

function sectionKey(section: readonly string[]): string {
  return section.join("/");
}

function articleSection(section: readonly string[]): "new" | "edit" | null {
  if (section.length === 2 && section[0] === "posts" && section[1] === "new")
    return "new";
  if (
    section.length === 3 &&
    section[0] === "posts" &&
    section[1] &&
    section[2] === "edit"
  )
    return "edit";
  return null;
}

const ROLE_SET = new Set<DashboardRole>(["USER", "AUTHOR", "ADMIN"]);

export function dashboardDestinations(
  role: DashboardRole,
): DashboardDestination[] {
  return destinations[role];
}

export function canAccessDashboard(
  role: string,
  section: readonly string[],
): boolean {
  if (!ROLE_SET.has(role as DashboardRole)) return false;
  if (articleSection(section))
    return role === "AUTHOR" || role === "ADMIN";
  if (authorCreateSection(section)) return role === "ADMIN";
  if (section.length > 1) return false;
  const entry = sections[sectionKey(section)];
  return !!entry && entry.roles.has(role as DashboardRole);
}

export function dashboardSectionMeta(
  role: string,
  section: readonly string[],
): DashboardSectionMeta | null {
  if (!canAccessDashboard(role, section)) return null;
  const article = articleSection(section);
  if (article)
    return {
      title:
        article === "new" ? articleFormMessages.productionCreate : articleFormMessages.edit,
      description: "",
    };
  if (authorCreateSection(section))
    return {
      title: authorsMessages.createTitle,
      description: authorsMessages.createDescription,
    };
  return sections[sectionKey(section)].meta;
}

export function dashboardDestination(
  section: readonly string[],
): string {
  const encoded = section.map((part) => encodeURIComponent(part)).join("/");
  return encoded ? `/dashboard/${encoded}` : "/dashboard";
}

/** Post-login return path; the login action re-validates it. */
export function dashboardLoginHref(section: readonly string[]): string {
  return `/login?next=${encodeURIComponent(dashboardDestination(section))}`;
}

export function toDashboardIdentity(user: AuthenticatedUser): DashboardIdentity {
  return { name: user.name, username: user.username, role: user.role };
}

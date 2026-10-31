// Test doubles matching Nest's PostFeedResponseDto; never used by application code.
import { articleContent } from "./article-content.mjs";
const titles = [
  "راهنمای Next.js و معماری وب",
  "عنوان <strong>مقاله</strong> باید متن بماند",
  "یادداشت‌های یک برنامه‌نویس دربارهٔ TypeScript و ساخت نرم‌افزار نگه‌داشت‌پذیر",
  "خواندن کد و یادگیری از تجربه‌ها",
  "طراحی رابط برای همه",
  "آشنایی با پایگاه داده",
  "چرا تست می‌نویسیم؟",
  "نوشتن مستندات کاربردی",
  "یادگیری در کنار دیگران",
  "نگاهی به مسیر توسعهٔ وب",
];

export const feed = {
  data: titles.map((title, index) => ({
    id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
    title,
    slug: `test-post-${index + 1}`,
    content: articleContent[index],
    status: "PUBLISHED",
    // 21:00 UTC is already the next day in Tehran (Nowruz 1405).
    publishedAt: index === 1 ? null : "2026-03-20T21:00:00.000Z",
    authorId: "10000000-0000-4000-8000-000000000001",
    createdAt: "2026-03-19T12:00:00.000Z",
    updatedAt: "2026-03-20T21:00:00.000Z",
    author: {
      id: "10000000-0000-4000-8000-000000000001",
      username: "nima",
      name: index === 1 ? null : "نیما کیانی",
      avatarUrl: null,
    },
    categories:
      index === 1
        ? []
        : [{ id: "20000000-0000-4000-8000-000000000001", name: "توسعهٔ وب", slug: "web" }],
    tags: index === 0 ? [{ id: "40000000-0000-4000-8000-000000000001", name: "برنامه‌نویسی", slug: "programming" }] : [],
  })),
  meta: { page: 1, limit: 10, total: 12, totalPages: 2 },
};

export const publishedPosts = [
  ...feed.data,
  ...["خواندن مقاله‌های بیشتر", "پایان این مجموعه"].map((title, index) => ({
    ...feed.data[0],
    id: `00000000-0000-4000-8000-${String(index + 11).padStart(12, "0")}`,
    slug: `test-post-${index + 11}`,
    title,
    content: articleContent[index + 10],
  })),
];

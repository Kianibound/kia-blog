import type { BookmarkFailureReason } from "@/lib/bookmarks-contract";

export const bookmarksMessages = {
  title: "مقالات ذخیره‌شده",
  description: "مقاله‌هایی که برای خواندن دوباره ذخیره کرده‌اید.",
  listLabel: "فهرست مقالات ذخیره‌شده",
  empty: "هنوز مقاله‌ای ذخیره نکرده‌اید.",
  loading: "در حال دریافت مقالات ذخیره‌شده…",
  unavailable: "دریافت مقالات ذخیره‌شده ممکن نشد.",
  denied: "این فهرست فقط برای حساب کاربر در دسترس است.",
  retry: "تلاش دوباره",
  save: "ذخیره مقاله",
  unsave: "حذف از ذخیره‌شده‌ها",
  saving: "در حال ثبت ذخیره‌سازی…",
  saved: "مقاله ذخیره شد.",
  removed: "مقاله از ذخیره‌شده‌ها حذف شد.",
  failed: "انجام عملیات ممکن نشد. دوباره تلاش کنید.",
  errors: {
    unauthorized: "نشست شما معتبر نیست؛ دوباره وارد شوید.",
    "not-found": "این مقاله پیدا نشد یا دیگر منتشر نشده است.",
    forbidden: "این عملیات برای نقش شما مجاز نیست.",
    validation: "درخواست ذخیره‌سازی معتبر نیست.",
    unavailable: "سامانه در دسترس نیست؛ دوباره تلاش کنید.",
    protocol: "پاسخ سامانه قابل خواندن نبود؛ صفحه را دوباره بارگذاری کنید.",
  } satisfies Record<BookmarkFailureReason, string>,
  csrf: "درخواست امنیتی معتبر نبود. صفحه را دوباره بارگذاری کنید.",
  uncertain:
    "نتیجهٔ ذخیره‌سازی مشخص نیست. پیش از تلاش دوباره، صفحه را دوباره بارگذاری کنید.",
};

export function bookmarkErrorMessage(reason: BookmarkFailureReason): string {
  return bookmarksMessages.errors[reason];
}

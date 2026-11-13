import type { TaxonomyFailureReason } from "@/lib/taxonomy-contract";

export const taxonomyMessages = {
  title: "دسته‌بندی‌ها و تگ‌ها",
  description: "افزودن و حذف دسته‌بندی‌ها و تگ‌های مقاله‌ها.",
  navigation: "مدیریت دسته‌بندی‌ها و تگ‌ها",
  categories: "دسته‌بندی‌ها",
  tags: "تگ‌ها",
  categoriesName: "نام دسته‌بندی",
  tagsName: "نام تگ",
  nameHint: "فاصله‌های ابتدا و انتهای نام حذف می‌شوند.",
  add: "افزودن",
  adding: "در حال افزودن…",
  loading: "در حال دریافت فهرست…",
  loadError: "دریافت فهرست ممکن نشد.",
  retry: "تلاش دوباره",
  empty: "موردی برای نمایش وجود ندارد.",
  delete: "حذف",
  deleteTitleCategories: "حذف دسته‌بندی",
  deleteTitleTags: "حذف تگ",
  deleteDescription:
    "اگر این مورد در مقاله‌ای استفاده شده باشد حذف نمی‌شود. آیا از حذف آن مطمئن هستید؟",
  deleteConfirm: "تأیید حذف",
  cancel: "انصراف",
  deleting: "در حال حذف…",
  createdCategories: "دسته‌بندی ایجاد شد.",
  createdTags: "تگ ایجاد شد.",
  deletedCategories: "دسته‌بندی حذف شد.",
  deletedTags: "تگ حذف شد.",
  nameRequired: "نام را وارد کنید.",
  errors: {
    duplicate: "این نام یا نشانی آن قبلاً ثبت شده است.",
    "in-use": "این مورد در مقاله‌ای استفاده شده است و حذف نمی‌شود.",
    validation: "نام واردشده معتبر نیست.",
    unauthorized: "نشست شما معتبر نیست؛ دوباره وارد شوید.",
    forbidden: "این عملیات برای نقش شما مجاز نیست.",
    "not-found": "این مورد پیدا نشد؛ فهرست را دوباره بارگذاری کنید.",
    unavailable: "سامانه در دسترس نیست؛ دوباره تلاش کنید.",
    protocol: "پاسخ سامانه قابل خواندن نبود؛ دوباره تلاش کنید.",
  } satisfies Record<TaxonomyFailureReason, string>,
  uncertain:
    "نتیجهٔ عملیات مشخص نیست. پیش از تلاش دوباره، فهرست را دوباره بارگذاری کنید.",
  csrf: "درخواست امنیتی معتبر نبود. صفحه را دوباره بارگذاری کنید.",
};

export function taxonomyErrorMessage(reason: TaxonomyFailureReason): string {
  return taxonomyMessages.errors[reason];
}

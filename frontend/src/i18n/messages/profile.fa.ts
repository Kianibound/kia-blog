import type { ProfileFailure } from "@/lib/profile-contract";

export const profileMessages = {
  title: "عکس پروفایل",
  description: "عکس حساب نویسنده را به‌روز یا حذف کنید.",
  update: "به‌روزرسانی عکس پروفایل",
  none: "بدون عکس پروفایل",
  preview: "پیش‌نمایش عکس تازه",
  selected: "تصویر انتخاب‌شده هنوز ذخیره نشده است.",
  fileLabel: "فایل عکس پروفایل",
  help: "فرمت‌های مجاز: PNG، JPEG و WebP؛ حداکثر اندازه: ۵ مگابایت.",
  save: "ذخیرهٔ عکس پروفایل",
  saving: "در حال ذخیرهٔ عکس…",
  saved: "عکس پروفایل ذخیره شد.",
  remove: "حذف عکس پروفایل",
  removing: "در حال حذف عکس…",
  removed: "عکس پروفایل حذف شد.",
  conflict:
    "عکس پروفایل همزمان تغییر کرده است. صفحه را دوباره بارگذاری کنید و سپس دوباره تلاش کنید.",
  reload: "بارگذاری دوباره",
  loadError: "دریافت عکس پروفایل ممکن نشد.",
  denied: "این بخش فقط برای نویسندگان در دسترس است.",
  retry: "تلاش دوباره",
  back: "بازگشت به پیشخوان",
  errors: {
    unauthorized: "نشست شما معتبر نیست؛ دوباره وارد شوید.",
    "not-found": "حساب شما پیدا نشد؛ دوباره وارد شوید.",
    conflict:
      "عکس پروفایل همزمان تغییر کرده است. صفحه را دوباره بارگذاری کنید و سپس دوباره تلاش کنید.",
    "too-large": "حجم تصویر باید کمتر از ۵ مگابایت باشد.",
    invalid: "فقط تصویر PNG، JPEG یا WebP مجاز است.",
    unavailable: "سامانه در دسترس نیست؛ دوباره تلاش کنید.",
    protocol: "پاسخ سامانه قابل خواندن نبود؛ صفحه را دوباره بارگذاری کنید.",
  } satisfies Record<ProfileFailure, string>,
  csrf: "درخواست امنیتی معتبر نبود. صفحه را دوباره بارگذاری کنید.",
  uncertain:
    "نتیجهٔ تغییر عکس مشخص نیست. پیش از تلاش دوباره، صفحه را دوباره بارگذاری کنید.",
};

export function profileErrorMessage(reason: ProfileFailure): string {
  return profileMessages.errors[reason];
}

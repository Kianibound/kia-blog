import type { OAuthFlowReason } from "@/lib/oauth/flow";

export const oauthMessages = {
  providers: { google: "گوگل", github: "گیت‌هاب" },
  help: "با گوگل یا گیت‌هاب وارد شوید؛ در ورود نخست، یک حساب کاربر ساخته می‌شود.",
  reasons: {
    state: "پیوند ورود منقضی یا نامعتبر شده است. دوباره تلاش کنید.",
    denied: "ورود با حساب خارجی لغو شد.",
    provider: "ورود با حساب خارجی انجام نشد. دوباره تلاش کنید.",
    conflict: "حسابی با این ایمیل از قبل وجود دارد. با همان روش قبلی وارد شوید.",
    unavailable: "ورود با حساب خارجی در حال حاضر در دسترس نیست. کمی بعد دوباره تلاش کنید.",
    unexpected: "خطای نامشخصی در ورود رخ داد. دوباره تلاش کنید.",
  } satisfies Record<OAuthFlowReason, string>,
};

export function oauthErrorMessage(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  return value in oauthMessages.reasons
    ? oauthMessages.reasons[value as OAuthFlowReason]
    : undefined;
}

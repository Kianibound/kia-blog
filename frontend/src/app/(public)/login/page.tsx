import { AuthForm } from "@/components/public/auth-form";
import { oauthErrorMessage } from "@/i18n/messages/oauth.fa";
import { getAuthFormToken } from "@/lib/auth/form-token";
import { loginAction } from "../auth-actions";

export const metadata = { title: "ورود" };
export const dynamic = "force-dynamic";

function single(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const token = getAuthFormToken();
  const oauthNotice =
    single(params.error) === "oauth"
      ? oauthErrorMessage(single(params.reason))
      : undefined;
  const notice =
    oauthNotice ??
    (single(params.registered) === "1"
      ? "ثبت‌نام انجام شد. اکنون با ایمیل و گذرواژهٔ خود وارد شوید."
      : single(params.loggedOut) === "1"
        ? "از حساب خود خارج شدید."
        : single(params.logout) === "error"
          ? "خروج کامل نشد. دوباره تلاش کنید."
          : undefined);

  return (
    <AuthForm
      mode="login"
      action={loginAction}
      csrfToken={token ?? ""}
      next={single(params.next) ?? "/"}
      notice={notice}
      available={token !== null}
    />
  );
}

import { AuthForm } from "@/components/public/auth-form";
import { getAuthFormToken } from "@/lib/auth/form-token";
import { registerAction } from "../auth-actions";

export const metadata = { title: "ثبت‌نام" };
export const dynamic = "force-dynamic";

export default function RegisterPage() {
  const token = getAuthFormToken();
  return (
    <AuthForm
      mode="register"
      action={registerAction}
      csrfToken={token ?? ""}
      available={token !== null}
    />
  );
}

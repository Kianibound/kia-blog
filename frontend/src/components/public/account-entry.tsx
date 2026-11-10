import { Button } from "@/components/ui/button";
import { logoutAction } from "@/app/(public)/auth-actions";
import type { PublicAccount } from "@/lib/auth/current-user";

export function AccountEntry({ account }: { account: PublicAccount }) {
  const label = account.user.name ?? account.user.username;
  return (
    <div className="flex min-h-12 flex-wrap items-center justify-end gap-3">
      <span className="max-w-48 truncate text-sm font-medium">{label}</span>
      <form action={logoutAction}>
        <input type="hidden" name="csrfToken" value={account.csrfToken} />
        <Button type="submit" variant="outline" size="lg">
          خروج
        </Button>
      </form>
    </div>
  );
}

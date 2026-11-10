import Link from "next/link";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/app/(public)/auth-actions";
import type { PublicAccount } from "@/lib/auth/current-user";

export function AccountEntry({ account }: { account: PublicAccount }) {
  const label = account.user.name ?? account.user.username;
  return (
    <div className="flex min-h-12 flex-wrap items-center justify-end gap-3">
      <Link
        href="/dashboard"
        className="inline-flex min-h-12 max-w-48 items-center truncate text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        {label}
      </Link>
      <form action={logoutAction}>
        <input type="hidden" name="csrfToken" value={account.csrfToken} />
        <Button type="submit" variant="outline" size="lg">
          خروج
        </Button>
      </form>
    </div>
  );
}

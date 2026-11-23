import Link from "next/link";
import { UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/app/(public)/auth-actions";
import type { PublicAccount } from "@/lib/auth/current-user";

export function AccountEntry({ account, showIdentity = true }: { account: PublicAccount; showIdentity?: boolean }) {
  const emailPrefix = account.user.email.split("@")[0] ?? "";
  const label =
    account.user.name ?? (emailPrefix ? emailPrefix : account.user.username);
  return (
    <div className="flex min-h-12 flex-wrap items-center justify-end gap-3">
      {showIdentity && (
      <Link
        href="/dashboard"
        className="inline-flex min-h-12 max-w-48 items-center gap-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        {account.user.avatarUrl ? (
          // Server-resolved avatar URL only.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={account.user.avatarUrl}
            alt=""
            width={40}
            height={40}
            className="size-10 shrink-0 rounded-full object-cover"
          />
        ) : (
          <UserRound
            aria-hidden="true"
            className="size-5 shrink-0"
            strokeWidth={2}
          />
        )}
        <span className="truncate">{label}</span>
      </Link>
      )}
      <form action={logoutAction}>
        <input type="hidden" name="csrfToken" value={account.csrfToken} />
        <Button type="submit" variant="outline" size="lg">
          خروج
        </Button>
      </form>
    </div>
  );
}

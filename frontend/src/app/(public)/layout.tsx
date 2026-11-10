import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
import { AccountEntry } from "@/components/public/account-entry";
import { getPublicAccount } from "@/lib/auth/current-user";

export default async function PublicLayout({
  children,
  accountEntry,
}: {
  children: React.ReactNode;
  /** Test preview override; production resolves the real Nest identity. */
  accountEntry?: React.ReactNode;
}) {
  const account = accountEntry ? null : await getPublicAccount();
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader
        accountEntry={
          accountEntry ?? (account ? <AccountEntry account={account} /> : undefined)
        }
      />
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto min-h-96 w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-14"
      >
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}

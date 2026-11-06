import PublicLayout from "@/app/(public)/layout";
import { readFixtureIdentity } from "./identity";
import { FixtureAccountEntry } from "./account-entry";

export async function FixturePublicLayout({ children }: { children: React.ReactNode }) {
  const identity = await readFixtureIdentity();
  return <PublicLayout accountEntry={identity ? <FixtureAccountEntry role={identity.role} /> : undefined}>{children}</PublicLayout>;
}

import "server-only";
import { AvatarEditor } from "./avatar-editor";
import { parseFixtureAvatar } from "@/lib/avatar-contract";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function AvatarLoading() {
  return <Card className="min-h-96 space-y-6 p-6 sm:p-8" aria-busy="true"><p role="status">در حال دریافت عکس پروفایل…</p><Skeleton className="size-32 motion-reduce:animate-none" /><Skeleton className="h-12 w-full motion-reduce:animate-none" /><Skeleton className="h-12 w-48 motion-reduce:animate-none" /></Card>;
}

export async function PreviewAvatar() {
  let src;
  try {
    const response = await fetch("http://127.0.0.1:4101/dashboard-avatar", { cache: "no-store", signal: AbortSignal.timeout(2500) });
    if (!response.ok) throw new Error("Fixture avatar unavailable");
    src = parseFixtureAvatar(await response.json());
  } catch {
    return <Card className="min-h-96 space-y-4 p-6" role="alert"><p>دریافت عکس پروفایل ممکن نشد.</p><form><Button size="lg" type="submit">تلاش دوباره</Button></form></Card>;
  }
  return <AvatarEditor initialSrc={src} />;
}

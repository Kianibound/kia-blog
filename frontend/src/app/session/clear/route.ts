import { redirect } from "next/navigation";
import { safeRedirectPath } from "@/lib/session/csrf";
import { clearBrowserSession } from "@/lib/session/server";

export const dynamic = "force-dynamic";

/** RSC pages cannot set cookies; this route performs terminal cleanup. */
export async function GET(request: Request) {
  const next = safeRedirectPath(
    new URL(request.url).searchParams.get("next"),
    "/dashboard",
  );
  await clearBrowserSession();
  redirect(`/login?next=${encodeURIComponent(next)}`);
}

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { loginErrorPath } from "@/lib/oauth/flow";
import {
  clearedOAuthFlowCookie,
  completeOAuth,
  oauthFlowCookieName,
} from "@/lib/oauth/server";
import { createBrowserSession, clearBrowserSession } from "@/lib/session/server";

export const dynamic = "force-dynamic";

/** Provider redirect target; exchanges the code server-to-server. */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const jar = await cookies();
  const flowId = jar.get(oauthFlowCookieName())?.value;
  jar.set(clearedOAuthFlowCookie());

  const result = await completeOAuth("github", {
    flowId,
    state: params.get("state"),
    code: params.get("code"),
    error: params.get("error"),
  });
  if (result.status !== "success") {
    // Never leave a pre-existing session behind a failed OAuth attempt.
    await clearBrowserSession();
    redirect(loginErrorPath(result.reason));
  }
  await createBrowserSession(result.tokens);
  // No caller-supplied target: the landing page is fixed, so no open redirect.
  redirect("/dashboard");
}

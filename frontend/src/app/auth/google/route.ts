import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { loginErrorPath } from "@/lib/oauth/flow";
import { beginOAuth, oauthFlowCookie } from "@/lib/oauth/server";

export const dynamic = "force-dynamic";

/** Starts the Google browser flow; the verifier never leaves the server. */
export async function GET(request: Request) {
  const result = await beginOAuth("google");
  if (result.status !== "ok")
    return NextResponse.redirect(
      new URL(loginErrorPath(result.reason), request.url),
    );
  (await cookies()).set(oauthFlowCookie(result.flowId));
  return NextResponse.redirect(result.authorizationUrl);
}

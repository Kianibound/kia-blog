"use server";

import { readFixtureIdentity } from "./identity";
import { parseFixtureAvatar } from "@/lib/avatar-contract";

// Test-only reference write; bytes remain in the existing resettable image fixture.
export async function saveFixtureAvatar(src: string | null): Promise<"saved" | "error" | "uncertain"> {
  if ((await readFixtureIdentity())?.role !== "AUTHOR") return "error";
  try { parseFixtureAvatar({ src }); } catch { return "error"; }
  try {
    const response = await fetch("http://127.0.0.1:4101/dashboard-avatar", {
      method: src === null ? "DELETE" : "PATCH", ...(src === null ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify({ src }) }), cache: "no-store", signal: AbortSignal.timeout(2500),
    });
    if (response.status >= 400 && response.status < 500) return "error";
    if (!response.ok || parseFixtureAvatar(await response.json()) !== src) return "uncertain";
    return "saved";
  } catch { return "uncertain"; }
}

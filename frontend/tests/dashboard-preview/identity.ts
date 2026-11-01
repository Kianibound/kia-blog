import "server-only";
import type { DashboardIdentity } from "@/components/dashboard/types";

// Test-preview I/O only. This is not an authentication or Nest account contract.
export async function readFixtureIdentity(): Promise<DashboardIdentity | null> {
  try {
    const origin = new URL(process.env.API_BASE_URL ?? "");
    if (origin.protocol !== "http:" || origin.hostname !== "127.0.0.1" || origin.port !== "4101" || origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash) throw new Error("Invalid fixture origin");
    const response = await fetch(new URL("/dashboard-identity", origin), { cache: "no-store", signal: AbortSignal.timeout(2500) });
    if (!response.ok) return null;
    const data: unknown = await response.json();
    if (typeof data !== "object" || data === null || !("name" in data) || !("username" in data) || !("role" in data)) return null;
    const { name, username, role } = data;
    if ((name !== null && typeof name !== "string") || typeof username !== "string" || !username.trim() || (role !== "USER" && role !== "AUTHOR" && role !== "ADMIN")) return null;
    return { name, username, role };
  } catch {
    return null;
  }
}

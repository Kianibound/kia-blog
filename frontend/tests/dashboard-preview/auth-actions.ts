"use server";
import type { AuthChoice } from "@/components/public/auth-screen";

// Test-only simulation: no credentials, tokens, cookies or production API.
export async function simulateAuth(choice: AuthChoice): Promise<boolean> {
  try {
    const response = await fetch("http://127.0.0.1:4101/__test/auth", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(choice),
      cache: "no-store", signal: AbortSignal.timeout(2500),
    });
    return response.status === 204;
  } catch { return false; }
}

export async function logoutFixture(): Promise<boolean> {
  try {
    return (await fetch("http://127.0.0.1:4101/__test/auth", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ operation: "logout" }),
      cache: "no-store", signal: AbortSignal.timeout(2500),
    })).status === 204;
  } catch { return false; }
}

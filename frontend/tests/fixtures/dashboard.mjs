// Test doubles only. There is no authentication or production account here.
const identities = {
  USER: { name: "نرگس رضایی", username: "narges", role: "USER" },
  AUTHOR: { name: "سارا کیانی", username: "sara", role: "AUTHOR" },
  ADMIN: { name: "مدیر نمونه", username: "admin", role: "ADMIN" },
};
let role = "USER";
let mode = "success";

export function handleDashboardFixture(request, response, url) {
  if (request.method === "POST" && url.pathname === "/__test/dashboard") {
    const nextRole = url.searchParams.get("role") ?? "USER";
    const nextMode = url.searchParams.get("mode") ?? "success";
    if (!Object.hasOwn(identities, nextRole) || !["success", "error", "invalid", "slow"].includes(nextMode)) {
      response.writeHead(400).end();
    } else {
      role = nextRole;
      mode = nextMode;
      response.writeHead(204).end();
    }
    return true;
  }
  if (request.method !== "GET" || url.pathname !== "/dashboard-identity") return false;
  if (mode === "error") {
    response.writeHead(503).end("TEST DOUBLE: dashboard unavailable");
    return true;
  }
  const payload = mode === "invalid" ? { ...identities[role], role: "UNKNOWN" } : identities[role];
  const send = () => response.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify(payload));
  if (mode === "slow") setTimeout(send, 1500);
  else send();
  return true;
}

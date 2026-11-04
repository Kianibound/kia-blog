// Test-only proxy to the resettable HTTP image double.
export async function POST(request: Request) {
  const response = await fetch("http://127.0.0.1:4101/fixture-images", {
    method: "POST", headers: { "Content-Type": request.headers.get("content-type") ?? "" },
    body: await request.arrayBuffer(), signal: request.signal,
  });
  return new Response(response.body, { status: response.status, headers: { "Content-Type": "application/json" } });
}

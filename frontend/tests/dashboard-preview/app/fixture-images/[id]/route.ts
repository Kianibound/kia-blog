export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-f0-9-]+$/.test(id)) return new Response(null, { status: 404 });
  const response = await fetch(`http://127.0.0.1:4101/fixture-images/${id}`, { cache: "no-store" });
  return new Response(response.body, { status: response.status, headers: {
    "Content-Type": response.headers.get("content-type") ?? "application/octet-stream",
    "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff",
  } });
}

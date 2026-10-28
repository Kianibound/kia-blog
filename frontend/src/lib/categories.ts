import "server-only";

export type Category = { id: string; name: string; slug: string };

/** Read only the public taxonomy fields needed for navigation. */
export async function getPublicCategories(): Promise<Category[] | null> {
  try {
    const configuredOrigin = process.env.API_BASE_URL;
    if (!configuredOrigin) throw new Error("Missing API origin");
    const origin = new URL(configuredOrigin);
    if (!["http:", "https:"].includes(origin.protocol) || origin.username || origin.password || origin.search || origin.hash || origin.pathname !== "/") {
      throw new Error("Invalid API origin");
    }
    const response = await fetch(new URL("/categories", origin), {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
    });
    if (!response.ok) throw new Error("Categories unavailable");
    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) throw new Error("Invalid categories");
    return payload.map((item: unknown) => {
      if (typeof item !== "object" || item === null || Array.isArray(item)) throw new Error("Invalid category");
      const category = item as Record<string, unknown>;
      const { id, name, slug } = category;
      if (typeof id !== "string" || !id.trim() || typeof name !== "string" || !name.trim() || typeof slug !== "string") {
        throw new Error("Invalid category");
      }
      return { id, name, slug };
    });
  } catch {
    // The public shell and feed remain usable even when taxonomy cannot be loaded.
    return null;
  }
}

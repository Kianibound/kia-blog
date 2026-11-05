/** Test-preview reference only; never a production avatar or storage contract. */
export function parseFixtureAvatar(value: unknown): string | null {
  if (typeof value !== "object" || value === null || !("src" in value) || (value.src !== null && (typeof value.src !== "string" || !/^\/fixture-images\/[a-f0-9-]+$/.test(value.src)))) throw new Error("Invalid fixture avatar");
  return value.src;
}

// Existing test-only image proxy, shared by article and avatar preview composition.
export async function uploadFixtureImage(file: File, signal: AbortSignal): Promise<string> {
  const response = await fetch("/fixture-images", { method: "POST", headers: { "Content-Type": file.type }, body: file, signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]) });
  if (!response.ok) throw new Error("Fixture image upload failed");
  const result = await response.json();
  if (typeof result.src !== "string" || !/^\/fixture-images\/[a-f0-9-]+$/.test(result.src)) throw new Error("Invalid fixture image reference");
  return result.src;
}

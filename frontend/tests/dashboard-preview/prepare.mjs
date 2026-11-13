import { cpSync } from "node:fs";

// Share the real blog's static assets with the separate, test-only host.
cpSync(new URL("../../public/", import.meta.url), new URL("./public/", import.meta.url), { recursive: true });

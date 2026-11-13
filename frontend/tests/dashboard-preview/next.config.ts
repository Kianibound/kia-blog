import type { NextConfig } from "next";
import { resolve } from "node:path";

// A separate test-only application; never part of the production route tree.
const config: NextConfig = { turbopack: { root: resolve(process.cwd()) } };
export default config;

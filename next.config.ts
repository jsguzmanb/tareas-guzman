import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // TypeScript 5 exposes the compiler API. Using it avoids an intermittent
    // empty `tsc --showConfig` capture in detached build environments.
    useTypeScriptCli: false,
  },
};

export default nextConfig;

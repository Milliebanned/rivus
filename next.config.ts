import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // mppx lazily imports optional peers (e.g. the MCP SDK) that bundling can't resolve; load it from node_modules at runtime.
  serverExternalPackages: ["mppx"],
  agentRules: false,
  // Keeps the dev badge out of screen recordings.
  devIndicators: false,
};

export default nextConfig;

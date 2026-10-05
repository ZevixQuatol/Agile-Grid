import type { NextConfig } from "next";

const config: NextConfig = {
  experimental: { useTypeScriptCli: false },
  devIndicators: false,
};

export default config;

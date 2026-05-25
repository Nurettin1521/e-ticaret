import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins: ["localhost", "127.0.0.1", "192.168.1.33"],
};

export default nextConfig;

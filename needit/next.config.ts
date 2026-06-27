import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // cacheComponents (Next 16 experimental caching) is disabled: this app is
  // auth-gated and highly dynamic, so pages render on-demand rather than being
  // statically prerendered. Re-evaluate caching optimizations post-MVP.
  experimental: {
    // Allow photo uploads through server actions (default is 1mb).
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;

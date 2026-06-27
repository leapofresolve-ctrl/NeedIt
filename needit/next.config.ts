import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // cacheComponents (Next 16 experimental caching) is disabled: this app is
  // auth-gated and highly dynamic, so pages render on-demand rather than being
  // statically prerendered. Re-evaluate caching optimizations post-MVP.
};

export default nextConfig;

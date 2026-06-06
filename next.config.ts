import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disabled because the WebRTC call setup uses effects that must run once;
  // Strict Mode's dev-only double-invoke re-runs negotiation on a fresh peer
  // connection mid-handshake and breaks calls in development.
  reactStrictMode: false,
};

export default nextConfig;

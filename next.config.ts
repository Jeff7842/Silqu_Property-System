import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    authInterrupts: true, // enables forbidden() for caretaker unit-scoping (403, not 404)
  },
};

export default nextConfig;

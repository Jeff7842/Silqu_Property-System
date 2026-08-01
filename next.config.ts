import type { NextConfig } from "next";

const imageRemotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
  {
    protocol: "https",
    hostname: "**.r2.dev",
  },
];

if (process.env.R2_PUBLIC_BASE_URL) {
  try {
    const r2PublicUrl = new URL(process.env.R2_PUBLIC_BASE_URL);
    imageRemotePatterns.push({
      protocol: r2PublicUrl.protocol.replace(":", "") as "http" | "https",
      hostname: r2PublicUrl.hostname,
      pathname: `${r2PublicUrl.pathname.replace(/\/$/, "")}/**`,
    });
  } catch {
    // Ignore invalid build-time env values; runtime upload code will still fail loudly.
  }
}

const nextConfig: NextConfig = {
  experimental: {
    authInterrupts: true, // enables forbidden() for caretaker unit-scoping (403, not 404)
  },
  images: {
    remotePatterns: imageRemotePatterns,
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;

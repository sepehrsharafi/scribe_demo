import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // A consultation now lives on one page. Keep the old links working.
      { source: "/review/:visitId", destination: "/visits/:visitId", permanent: false },
      { source: "/notes", destination: "/visits?filter=draft-ready", permanent: false },
    ];
  },
};

export default nextConfig;

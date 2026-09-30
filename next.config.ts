import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // The visit list is the sidebar now, and a visit lives on one page. Keep old links working.
      { source: "/visits", destination: "/", permanent: false },
      { source: "/notes", destination: "/", permanent: false },
      { source: "/review/:visitId", destination: "/visits/:visitId", permanent: false },
    ];
  },
};

export default nextConfig;

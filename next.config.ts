import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/sign-up/applicant",
        destination: "/applicant-signup",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;

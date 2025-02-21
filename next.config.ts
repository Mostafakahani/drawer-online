import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      canvas: false,
    };

    if (!isServer) {
      // Remove this part since we're using dynamic import
      // config.externals.push({
      //   konva: "commonjs konva",
      //   "react-konva": "commonjs react-konva",
      // });
      config.cache = false;
    }

    return config;
  },
};

export default nextConfig;

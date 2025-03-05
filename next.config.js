import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // swcMinify option is no longer needed in Next.js 15
  // We're using standard CSS for fonts, no need for SWC transforms

  // Exclude the temp_app directory from the build
  experimental: {
    externalDir: true,
  },

  // Prevent webpack from trying to process the temp_app directory
  webpack: (config, { isServer }) => {
    // Create a new config object to avoid modifying read-only properties
    const newConfig = { ...config };

    // Create new watchOptions or use existing ones
    newConfig.watchOptions = { ...config.watchOptions } || {};

    // Create new ignored array
    const existingIgnored = Array.isArray(newConfig.watchOptions.ignored)
      ? [...newConfig.watchOptions.ignored]
      : ['**/node_modules/**'];

    // Add temp_app to ignored
    newConfig.watchOptions.ignored = [...existingIgnored, '**/temp_app/**'];

    return newConfig;
  },

  // ESLint configuration for Next.js
  eslint: {
    // Don't run ESLint during build - we handle it separately
    ignoreDuringBuilds: true,
  },
};

export default withBundleAnalyzer(nextConfig);

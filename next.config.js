/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // swcMinify option is no longer needed in Next.js 15
  // We're using standard CSS for fonts, no need for SWC transforms
  
  // Exclude the temp_app directory from the build
  experimental: {
    externalDir: true
  },
  
  // Prevent webpack from trying to process the temp_app directory
  webpack: (config, { isServer }) => {
    // Ensure watchOptions exists
    config.watchOptions = config.watchOptions || {};
    
    // Ensure ignored property exists and is an array
    config.watchOptions.ignored = Array.isArray(config.watchOptions.ignored)
      ? [...config.watchOptions.ignored, '**/temp_app/**']
      : ['**/node_modules/**', '**/temp_app/**'];
    
    return config;
  }
}

module.exports = nextConfig 
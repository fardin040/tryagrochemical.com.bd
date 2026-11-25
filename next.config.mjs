/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { agentUpgrade: "security" },
  images: { unoptimized: true },
  output: "standalone"
};
export default nextConfig;

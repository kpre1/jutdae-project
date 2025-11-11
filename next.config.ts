/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // ✅ ESLint 에러 무시하고 빌드 진행
  },
};

export default nextConfig;

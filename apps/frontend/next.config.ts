import path from "node:path";
import type { NextConfig } from "next";

const monorepoRoot = path.join(__dirname, "..", "..");

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: monorepoRoot,
  turbopack: {
    root: monorepoRoot,
  },
  images: {
    // Ảnh minh hoạ tĩnh (browse-by-need, explore-by-scenario) lấy từ
    // Unsplash — domain cố định nên cho next/image optimize thật. Ảnh
    // sản phẩm/blog do admin paste URL tự do (domain bất kỳ) dùng prop
    // `unoptimized` ở nơi render thay vì khai báo remotePatterns ở đây,
    // vì không có danh sách domain cố định để allowlist.
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};



export default nextConfig;

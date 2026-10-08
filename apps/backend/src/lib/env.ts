import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  // Nhiều origin cách nhau dấu phẩy — cần vì giờ có cả apps/frontend lẫn
  // apps/admin (2 origin khác nhau) cùng gọi vào 1 backend.
  corsOrigins: required("CORS_ORIGIN").split(",").map((s) => s.trim()),
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET"),
  cookieName: process.env.COOKIE_NAME ?? "logilab_session",
  // Bật true khi đứng sau HTTPS (qua Caddy) — local dev vẫn HTTP nên mặc
  // định false.
  cookieSecure: process.env.COOKIE_SECURE === "true",
  // Bucket S3 chứa ảnh sản phẩm/banner đã resize — xem lib/image-upload.ts.
  mediaBucket: required("MEDIA_BUCKET_NAME"),
  awsRegion: process.env.AWS_REGION ?? "ap-southeast-1",
  // Optional: Sentry error tracking. Left unset locally — Sentry.init() is a
  // no-op without a DSN, so this never breaks local dev.
  sentryDsn: process.env.SENTRY_DSN,
};

// Hằng số/type thuần, không đụng tới apiFetch (next/headers) — tách riêng để
// Client Component (components/layout/header.tsx) import được mà không kéo
// theo lib/api-client.ts vào bundle trình duyệt (next/headers chỉ chạy được
// ở server).
export const DEVELOPER_CATEGORY_SLUGS = [
  "dev-board",
  "drone",
  "robotics",
  "aiot",
  "display",
  "diy-workshop",
];

export type CategoryNode = { id: string; name: string; slug: string; children: CategoryNode[] };

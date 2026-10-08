// Port nguyên từ logilab-client/lib/product-filters.ts — phải khớp tuyệt đối
// với danh sách ID mà frontend gửi lên qua ?price=..., nếu không filter sẽ âm
// thầm không khớp gì cả.
export const PRICE_RANGES = [
  { id: "under-200k", min: 0, max: 200_000 },
  { id: "200k-500k", min: 200_000, max: 500_000 },
  { id: "500k-1m", min: 500_000, max: 1_000_000 },
  { id: "1m-2m", min: 1_000_000, max: 2_000_000 },
  { id: "over-2m", min: 2_000_000, max: Infinity },
] as const;

export const PAGE_SIZE = 20;

// Phải khớp đúng CHECK constraint orders_status_check trong migration
// 20260726000000_add_user_roles.sql, và STATUS_LABEL ở
// apps/frontend/app/orders/page.tsx / orders/[id]/page.tsx.
export const ORDER_STATUSES = ["pending", "paid", "shipped", "completed", "cancelled"] as const;

export const DEVELOPER_CATEGORY_SLUGS = [
  "dev-board",
  "drone",
  "robotics",
  "aiot",
  "display",
  "diy-workshop",
];

export const HIDDEN_FROM_NAV_SLUGS = ["nguon-pin"];

export const BLOG_TAGS = ["Hướng dẫn", "So sánh", "Dự án DIY", "Tin tức"];

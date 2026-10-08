import type { CategoryNode } from "@/lib/categories-shared";

// Tìm 1 node bất kỳ độ sâu trong cây theo slug — dùng để xác định tên hiển
// thị của danh mục đang chọn (?category=) mà không cần gọi thêm API.
export function findNodeBySlug(nodes: CategoryNode[], slug: string): CategoryNode | null {
  for (const node of nodes) {
    if (node.slug === slug) return node;
    const found = findNodeBySlug(node.children, slug);
    if (found) return found;
  }
  return null;
}

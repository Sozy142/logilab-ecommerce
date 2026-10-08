import Link from "next/link";
import { ChevronRight } from "lucide-react";

type Crumb = { label: string; href?: string };

// Cuộn ngang 1 dòng duy nhất thay vì để flex tự bọc chữ xuống dòng — tên
// category/sản phẩm dài trên màn hình hẹp từng khiến "Trang chủ" và các
// đoạn khác bị bẻ chữ lung tung giữa chừng, rất rối mắt.
export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-2 overflow-x-auto whitespace-nowrap text-sm text-neutral-500 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {items.map((item, i) => (
        <span key={i} className="flex shrink-0 items-center gap-2">
          {i > 0 && <ChevronRight className="size-3.5 shrink-0" />}
          {item.href ? (
            <Link href={item.href} className="shrink-0 transition-colors hover:text-neutral-900">
              {item.label}
            </Link>
          ) : (
            <span className="shrink-0 font-medium text-neutral-900">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

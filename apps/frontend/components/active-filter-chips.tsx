import Link from "next/link";
import { X } from "lucide-react";
import { buildFilterUrl, PRICE_RANGES, type FilterState } from "@/lib/product-filters";
import { findNodeBySlug } from "@/lib/category-tree";
import type { CategoryNode } from "@/lib/categories-shared";
import type { BrandFacet } from "@logilab/shared-types";

function formatVnd(n: number): string {
  return `${n.toLocaleString("vi-VN")}đ`;
}

// Dải chip hiển thị các filter đang áp dụng, bấm "x" để bỏ nhanh từng cái —
// dùng chung cho cả 3 trang có filter sản phẩm.
export function ActiveFilterChips({
  basePath,
  current,
  categories,
  brands,
}: {
  basePath: string;
  current: FilterState;
  categories: CategoryNode[];
  brands: BrandFacet[];
}) {
  const chips: { key: string; label: string; href: string }[] = [];

  if (current.category) {
    const node = findNodeBySlug(categories, current.category);
    chips.push({
      key: "category",
      label: node?.name ?? current.category,
      href: buildFilterUrl(basePath, current, { category: null }),
    });
  }

  for (const slug of current.brand ?? []) {
    const brand = brands.find((b) => b.slug === slug);
    chips.push({
      key: `brand-${slug}`,
      label: brand?.name ?? slug,
      href: buildFilterUrl(basePath, current, { toggleBrand: slug }),
    });
  }

  if (current.stock === "in") {
    chips.push({ key: "stock", label: "Còn hàng", href: buildFilterUrl(basePath, current, { stock: null }) });
  }

  for (const id of current.price ?? []) {
    const range = PRICE_RANGES.find((r) => r.id === id);
    if (!range) continue;
    chips.push({
      key: `price-${id}`,
      label: range.label,
      href: buildFilterUrl(basePath, current, { togglePrice: id }),
    });
  }

  if (current.priceMin || current.priceMax) {
    const label =
      current.priceMin && current.priceMax
        ? `${formatVnd(Number(current.priceMin))} - ${formatVnd(Number(current.priceMax))}`
        : current.priceMin
          ? `Từ ${formatVnd(Number(current.priceMin))}`
          : `Đến ${formatVnd(Number(current.priceMax))}`;
    chips.push({
      key: "price-range",
      label,
      href: buildFilterUrl(basePath, current, { priceMin: null, priceMax: null }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {chips.map((chip) => (
        <Link
          key={chip.key}
          href={chip.href}
          className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:border-neutral-950 hover:text-neutral-950"
        >
          {chip.label}
          <X className="size-3" />
        </Link>
      ))}
    </div>
  );
}

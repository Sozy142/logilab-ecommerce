"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRICE_RANGES, buildFilterUrl, type FilterState } from "@/lib/product-filters";
import type { BrandFacet } from "@logilab/shared-types";

// 1 dòng chọn filter — desktop (href) điều hướng ngay khi bấm; mobile
// (onClick, deferApply) chỉ đổi state nháp, chờ bấm nút "Áp dụng" tổng.
function OptionRow({
  active,
  label,
  count,
  href,
  onClick,
}: {
  active: boolean;
  label: string;
  count?: number;
  href?: string;
  onClick?: () => void;
}) {
  const className =
    "flex w-full items-center justify-between gap-2 text-left text-sm text-neutral-600 transition-colors hover:text-neutral-950";
  const content = (
    <>
      <span className="flex min-w-0 items-center gap-2">
        <span
          className={cn(
            "flex size-4 shrink-0 items-center justify-center rounded border",
            active ? "border-neutral-950 bg-neutral-950" : "border-neutral-300"
          )}
        >
          {active && <Check className="size-3 text-white" strokeWidth={3} />}
        </span>
        <span className="truncate">{label}</span>
      </span>
      {count !== undefined && <span className="shrink-0 text-xs text-neutral-400">{count}</span>}
    </>
  );
  return href ? (
    <Link href={href} className={className}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

// Dùng chung cho cả 3 trang có filter sản phẩm (/products, /categories/[slug],
// /developer) — chọn danh mục đã có menu trên cùng (header.tsx) đảm nhiệm,
// panel này chỉ còn lọc theo Hãng/Khoảng giá (các mức giá có sẵn).
//
// `deferApply` (mobile, bên trong FilterDrawer): mỗi lựa chọn chỉ đổi 1
// state nháp cục bộ thay vì điều hướng ngay — tránh mỗi lần chọn 1 filter
// lại nhảy trang, khó chọn nhiều filter cùng lúc. Bấm "Áp dụng" ở cuối mới
// thực sự điều hướng 1 lần với toàn bộ lựa chọn đã gộp. Desktop (mặc định,
// deferApply=false) giữ nguyên hành vi cũ: bấm là áp dụng ngay.
export function ProductFilterPanel({
  basePath,
  current,
  brands,
  priceBucketCounts,
  deferApply = false,
}: {
  basePath: string;
  current: FilterState;
  brands: BrandFacet[];
  priceBucketCounts: Record<string, number>;
  deferApply?: boolean;
}) {
  const [draft, setDraft] = useState<FilterState>(current);

  // current là object mới mỗi lần trang server render lại (sau điều hướng
  // thật — Áp dụng, Xoá tất cả, đổi danh mục qua menu...) — so sánh tham
  // chiếu là đủ để biết cần đồng bộ lại nháp, không phải do đổi state nội bộ.
  const [trackedCurrent, setTrackedCurrent] = useState(current);
  if (current !== trackedCurrent) {
    setTrackedCurrent(current);
    setDraft(current);
  }

  const active = deferApply ? draft : current;

  function toggleDraftBrand(slug: string) {
    setDraft((d) => {
      const brand = d.brand ?? [];
      return { ...d, brand: brand.includes(slug) ? brand.filter((b) => b !== slug) : [...brand, slug] };
    });
  }
  function toggleDraftPrice(id: string) {
    setDraft((d) => {
      const price = d.price ?? [];
      return { ...d, price: price.includes(id) ? price.filter((p) => p !== id) : [...price, id] };
    });
  }

  const hasActiveFilter = Boolean(
    active.category ||
      (active.brand && active.brand.length > 0) ||
      active.stock ||
      (active.price && active.price.length > 0) ||
      active.priceMin ||
      active.priceMax
  );

  return (
    <div className="flex flex-col gap-5">
      {hasActiveFilter && (
        <Link
          href={basePath}
          className="self-start text-xs font-semibold text-neutral-500 underline-offset-2 hover:text-neutral-950 hover:underline"
        >
          Xoá tất cả
        </Link>
      )}

      {brands.length > 0 && (
        <div className="border-b border-neutral-100 pb-5">
          <h3 className="mb-3 text-sm font-bold text-neutral-950">Hãng</h3>
          <div className="flex flex-col gap-2">
            {brands.map((brand) => (
              <OptionRow
                key={brand.slug}
                active={(active.brand ?? []).includes(brand.slug)}
                label={brand.name}
                count={brand.count}
                href={deferApply ? undefined : buildFilterUrl(basePath, current, { toggleBrand: brand.slug })}
                onClick={deferApply ? () => toggleDraftBrand(brand.slug) : undefined}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-3 text-sm font-bold text-neutral-950">Khoảng giá</h3>
        <div className="flex flex-col gap-2">
          {PRICE_RANGES.map((range) => (
            <OptionRow
              key={range.id}
              active={(active.price ?? []).includes(range.id)}
              label={range.label}
              count={priceBucketCounts[range.id] ?? 0}
              href={deferApply ? undefined : buildFilterUrl(basePath, current, { togglePrice: range.id })}
              onClick={deferApply ? () => toggleDraftPrice(range.id) : undefined}
            />
          ))}
        </div>
      </div>

      {deferApply && (
        <Link
          href={buildFilterUrl(basePath, draft, {})}
          className="sticky bottom-0 flex h-11 items-center justify-center rounded-xl bg-neutral-950 text-sm font-bold text-white shadow-lg"
        >
          Áp dụng
        </Link>
      )}
    </div>
  );
}

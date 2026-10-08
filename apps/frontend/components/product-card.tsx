import Link from "next/link";
import type { Product, Variant } from "@logilab/shared-types";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { ProductTitleTooltip } from "@/components/product-title-tooltip";
import { ProductImage } from "@/components/product-image";

const DISCOUNT_PERCENT = 20;

export function ProductCard({ product, index }: { product: Product; index: number }) {
  const variants = product.product_variants ?? [];
  const cheapest =
    variants.length > 0
      ? variants.reduce((min: Variant, v: Variant) => (v.price < min.price ? v : min), variants[0])
      : null;
  const totalStock = variants.reduce((sum: number, v: Variant) => sum + (v.stock ?? 0), 0);
  const image = product.product_images?.[0]?.image_url;

  const hasDiscount = index % 3 === 0 && cheapest;
  const originalPrice = hasDiscount
    ? Math.round(cheapest.price / (1 - DISCOUNT_PERCENT / 100))
    : null;

  return (
    <div className="group flex h-full flex-col rounded-xl border border-neutral-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/products/${product.slug}`} className="relative aspect-square w-full overflow-hidden rounded-t-xl bg-white p-4 sm:p-5">
        {hasDiscount && (
          <span className="absolute left-2 top-2 z-10 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
            -{DISCOUNT_PERCENT}%
          </span>
        )}
        <ProductImage
          src={image}
          alt={product.name}
          className="size-full object-contain transition-transform duration-300 group-hover:scale-105"
          iconClassName="size-8"
        />
      </Link>

      <div className="flex flex-1 flex-col p-2.5 sm:p-3">
        {/* Tên sản phẩm chiếm 1 khối chiều cao cố định (line-clamp-3 + min-h)
            nên giá luôn đứng cùng 1 vị trí trên mọi card, bất kể tên ngắn
            hay dài (đa số sản phẩm hiện đủ tên trong 3 dòng). Chỉ tên nào
            thực sự bị cắt (đo bằng scrollHeight) mới hiện tooltip đầy đủ khi
            rê chuột — xem components/product-title-tooltip.tsx. */}
        <Link href={`/products/${product.slug}`} className="group/title relative block">
          <ProductTitleTooltip name={product.name} />
        </Link>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          <span className="text-sm font-extrabold text-neutral-950 sm:text-base">
            {cheapest ? `${Number(cheapest.price).toLocaleString("vi-VN")}đ` : "Liên hệ"}
          </span>
          {originalPrice && (
            <span className="text-xs text-neutral-400 line-through">
              {originalPrice.toLocaleString("vi-VN")}đ
            </span>
          )}
        </div>

        <span className={`mt-1 mb-2.5 text-[10px] font-medium ${totalStock > 0 ? "text-emerald-600" : "text-rose-500"}`}>
          {totalStock > 0 ? `Còn hàng (${totalStock})` : "Tạm hết hàng"}
        </span>

        <AddToCartButton
          product={{ id: product.id, slug: product.slug, name: product.name }}
          variant={cheapest}
          image={image ?? null}
          className="mt-auto h-8 w-full shrink-0 rounded-full bg-neutral-950 text-[11px] font-semibold text-white hover:bg-neutral-800 sm:h-9"
        />
      </div>
    </div>
  );
}

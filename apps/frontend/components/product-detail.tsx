"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, StarHalf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { useCartStore } from "@/lib/cart-store";
import { cn } from "@/lib/utils";
import { ProductImage as ProductImg } from "@/components/product-image";

type ProductImage = { id: string; image_url: string };
type ProductVariant = { id: string; variant_name: string; price: number; stock: number | null };

export function getMockRating(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  const ratings = [4, 4.5, 5];
  return ratings[hash % ratings.length];
}

export function RatingStars({ rating }: { rating: number }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) {
      stars.push(<Star key={i} className="size-4 fill-amber-400 text-amber-400" />);
    } else if (rating >= i - 0.5) {
      stars.push(<StarHalf key={i} className="size-4 fill-amber-400 text-amber-400" />);
    } else {
      stars.push(<Star key={i} className="size-4 text-neutral-200" />);
    }
  }
  return <div className="flex items-center gap-0.5">{stars}</div>;
}

export function ProductDetail({
  product,
  images,
  variants,
}: {
  product: { id: string; name: string; slug: string };
  images: ProductImage[];
  variants: ProductVariant[];
}) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState(variants[0]?.id ?? null);
  const [quantity, setQuantity] = useState(1);

  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? variants[0] ?? null;
  const stock = selectedVariant?.stock ?? 0;
  const rating = getMockRating(product.id);
  const selectedImage = images[selectedImageIdx];

  function addToCart() {
    if (!selectedVariant) return;
    addItem(
      {
        variantId: selectedVariant.id,
        productId: product.id,
        productSlug: product.slug,
        productName: product.name,
        variantName: selectedVariant.variant_name,
        price: Number(selectedVariant.price),
        image: selectedImage?.image_url ?? null,
        stock: selectedVariant.stock ?? 0,
      },
      quantity
    );
  }

  function buyNow() {
    addToCart();
    router.push("/cart");
  }

  function changeVariant(id: string) {
    setSelectedVariantId(id);
    setQuantity(1);
  }

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,320px)_1fr] md:gap-8 lg:grid-cols-[minmax(0,480px)_1fr] lg:gap-12">
      {/* GALLERY */}
      <div className="flex flex-col gap-4">
        <div className="aspect-square w-full max-w-[480px] overflow-hidden rounded-2xl bg-neutral-100">
          <ProductImg
            src={selectedImage?.image_url}
            alt={product.name}
            className="size-full object-cover"
            iconClassName="size-16"
          />
        </div>

        {images.length > 1 && (
          <div className="flex gap-3 overflow-x-auto">
            {images.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setSelectedImageIdx(i)}
                className={cn(
                  "aspect-square w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-neutral-100 transition-colors",
                  i === selectedImageIdx ? "border-neutral-950" : "border-transparent hover:border-neutral-300"
                )}
              >
                <ProductImg src={img.image_url} alt={product.name} className="size-full object-cover" iconClassName="size-6" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* INFO */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-neutral-950 sm:text-3xl">{product.name}</h1>

        <div className="mt-3 flex items-center gap-2">
          <RatingStars rating={rating} />
          <span className="text-sm text-neutral-500">
            {rating.toFixed(1)}<span className="text-neutral-400">/5</span>
          </span>
        </div>

        <div className="mt-4 text-3xl font-extrabold text-neutral-950">
          {selectedVariant ? `${Number(selectedVariant.price).toLocaleString("vi-VN")}đ` : "Liên hệ"}
        </div>

        <p className={cn("mt-2 text-sm font-medium", stock > 0 ? "text-emerald-600" : "text-rose-500")}>
          {stock > 0 ? `Còn hàng (${stock})` : "Tạm hết hàng"}
        </p>

        {variants.length > 1 && (
          <div className="mt-6 border-t border-neutral-100 pt-6">
            <h3 className="mb-3 text-sm font-bold text-neutral-950">Phiên bản</h3>
            <div className="flex flex-wrap gap-2">
              {variants.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => changeVariant(variant.id)}
                  className={cn(
                    "rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
                    variant.id === selectedVariant?.id
                      ? "border-neutral-950 bg-neutral-950 text-white"
                      : "border-neutral-200 text-neutral-700 hover:border-neutral-400"
                  )}
                >
                  {variant.variant_name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 border-t border-neutral-100 pt-6">
          <h3 className="mb-3 text-sm font-bold text-neutral-950">Số lượng</h3>
          <QuantityStepper quantity={quantity} onChange={setQuantity} max={stock} />
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            disabled={stock <= 0}
            onClick={addToCart}
            className="h-12 sm:flex-1 rounded-full bg-neutral-950 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            {stock > 0 ? "Thêm vào giỏ hàng" : "Tạm hết hàng"}
          </Button>
          <Button
            disabled={stock <= 0}
            onClick={buyNow}
            variant="outline"
            className="h-12 sm:flex-1 rounded-full border-neutral-200 text-sm font-semibold text-neutral-950 hover:bg-neutral-950 hover:text-white"
          >
            Mua ngay
          </Button>
        </div>
      </div>
    </div>
  );
}

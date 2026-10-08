"use client";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/cart-store";

type Variant = { id: string; variant_name: string; price: number; stock: number | null };

export function AddToCartButton({
  product,
  variant,
  image,
  className,
  quantity = 1,
}: {
  product: { id: string; slug: string; name: string };
  variant: Variant | null;
  image: string | null;
  className?: string;
  quantity?: number;
}) {
  const addItem = useCartStore((state) => state.addItem);
  const stock = variant?.stock ?? 0;
  const disabled = !variant || stock <= 0;

  function handleAddToCart() {
    if (!variant) return;
    addItem(
      {
        variantId: variant.id,
        productId: product.id,
        productSlug: product.slug,
        productName: product.name,
        variantName: variant.variant_name,
        price: Number(variant.price),
        image,
        stock: variant.stock ?? 0,
      },
      quantity
    );
  }

  return (
    <Button className={className} disabled={disabled} onClick={handleAddToCart}>
      {disabled ? "Tạm hết hàng" : "Thêm vào giỏ hàng"}
    </Button>
  );
}

"use client";

import Link from "next/link";
import { ShoppingCart, Trash2 } from "lucide-react";
import { Breadcrumb } from "@/components/breadcrumb";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { selectTotalPrice, useCartStore } from "@/lib/cart-store";
import { useMounted } from "@/lib/use-mounted";
import { ProductImage } from "@/components/product-image";

const FREE_SHIPPING_THRESHOLD = 500000;

export default function CartPage() {
  // Cart state is persisted to localStorage and only available after mount.
  // Rendering the empty state until then keeps the client's first render in
  // sync with the server-rendered HTML and avoids a hydration mismatch.
  const mounted = useMounted();

  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  const cartItems = mounted ? items : [];
  const subtotal = selectTotalPrice(cartItems);
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;

  if (cartItems.length === 0) {
    return (
      <main className="mx-auto flex max-w-7xl flex-col items-center px-4 py-24 text-center sm:px-6">
        <div className="flex size-20 items-center justify-center rounded-full bg-neutral-100">
          <ShoppingCart className="size-9 text-neutral-300" strokeWidth={1.25} />
        </div>
        <h1 className="mt-6 text-xl font-extrabold tracking-tight text-neutral-950">
          Giỏ hàng của bạn đang trống
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Hãy khám phá thêm sản phẩm và thêm vào giỏ hàng nhé.
        </p>
        <Button
          asChild
          className="mt-6 h-11 rounded-full bg-neutral-950 px-8 text-sm font-semibold text-white hover:bg-neutral-800"
        >
          <Link href="/">Tiếp tục mua sắm</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      <Breadcrumb items={[{ label: "Trang chủ", href: "/" }, { label: "Giỏ hàng" }]} />

      <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-neutral-950 sm:text-3xl">
        Giỏ hàng của bạn
      </h1>

      <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* ITEMS */}
        <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm sm:p-6 md:col-span-2">
          <div className="flex flex-col divide-y divide-neutral-100">
            {cartItems.map((item) => (
              <div key={item.variantId} className="flex gap-4 py-5 first:pt-0 last:pb-0">
                <Link
                  href={`/products/${item.productSlug}`}
                  className="size-20 shrink-0 overflow-hidden rounded-xl bg-neutral-100 sm:size-24"
                >
                  <ProductImage
                    src={item.image}
                    alt={item.productName}
                    className="size-full object-cover"
                    iconClassName="size-6"
                  />
                </Link>

                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/products/${item.productSlug}`}
                        className="line-clamp-2 text-sm font-semibold text-neutral-900 hover:text-neutral-600"
                      >
                        {item.productName}
                      </Link>
                      <p className="mt-1 text-xs text-neutral-500">{item.variantName}</p>
                    </div>
                    <button
                      type="button"
                      aria-label="Xoá sản phẩm"
                      onClick={() => removeItem(item.variantId)}
                      className="flex size-8 shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                    <QuantityStepper
                      quantity={item.quantity}
                      onChange={(q) => updateQuantity(item.variantId, q)}
                      max={item.stock}
                      size="sm"
                    />
                    <div className="text-right">
                      <div className="text-sm font-bold text-neutral-950">
                        {(item.price * item.quantity).toLocaleString("vi-VN")}đ
                      </div>
                      <div className="text-xs text-neutral-400">
                        {item.price.toLocaleString("vi-VN")}đ / sản phẩm
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SUMMARY */}
        <div className="h-fit rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-neutral-950">Tóm tắt đơn hàng</h2>

          <div className="mt-4 flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-between text-neutral-600">
              <span>Tạm tính</span>
              <span className="font-medium text-neutral-950">{subtotal.toLocaleString("vi-VN")}đ</span>
            </div>
            <div className="flex items-center justify-between text-neutral-600">
              <span>Phí vận chuyển</span>
              <span className={isFreeShipping ? "font-medium text-emerald-600" : "font-medium text-neutral-950"}>
                {isFreeShipping ? "Miễn phí" : "Tính khi thanh toán"}
              </span>
            </div>
          </div>

          {!isFreeShipping && (
            <p className="mt-3 rounded-xl bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
              Mua thêm {(FREE_SHIPPING_THRESHOLD - subtotal).toLocaleString("vi-VN")}đ để được miễn phí vận
              chuyển.
            </p>
          )}

          <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-4">
            <span className="text-sm font-bold text-neutral-950">Tổng cộng</span>
            <span className="text-lg font-extrabold text-neutral-950">
              {subtotal.toLocaleString("vi-VN")}đ
            </span>
          </div>

          <Button
            asChild
            className="mt-6 h-12 w-full rounded-full bg-neutral-950 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            <Link href="/checkout">Tiến hành thanh toán</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

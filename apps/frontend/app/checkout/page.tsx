"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { Breadcrumb } from "@/components/breadcrumb";
import { Button } from "@/components/ui/button";
import { useCartStore, selectTotalPrice } from "@/lib/cart-store";
import { useMounted } from "@/lib/use-mounted";
import { clientApiFetch, getMe, ApiError } from "@/lib/auth-client";

type CheckStatus = "checking" | "signed-in" | "signed-out";

export default function CheckoutPage() {
  const router = useRouter();
  const mounted = useMounted();
  const items = useCartStore((state) => state.items);
  const clear = useCartStore((state) => state.clear);

  const [authStatus, setAuthStatus] = useState<CheckStatus>("checking");
  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMe()
      .then((me) => {
        setAuthStatus("signed-in");
        if (me.customer?.full_name) setRecipientName(me.customer.full_name);
        if (me.customer?.phone) setPhone(me.customer.phone);
      })
      .catch(() => setAuthStatus("signed-out"));
  }, []);

  useEffect(() => {
    if (authStatus === "signed-out") router.replace("/login?redirect=/checkout");
  }, [authStatus, router]);

  const cartItems = mounted ? items : [];
  const subtotal = selectTotalPrice(cartItems);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { order } = await clientApiFetch<{ order: { id: string } }>("/checkout", {
        method: "POST",
        body: JSON.stringify({
          items: cartItems.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
          shippingAddress: `${recipientName} - ${addressLine}, ${city}`,
          phone,
        }),
      });
      clear();
      router.push(`/orders/${order.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không thể đặt hàng, vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  if (authStatus !== "signed-in") {
    return <main className="mx-auto max-w-3xl px-4 py-24 text-center text-sm text-neutral-400">Đang kiểm tra đăng nhập...</main>;
  }

  if (cartItems.length === 0) {
    return (
      <main className="mx-auto flex max-w-7xl flex-col items-center px-4 py-24 text-center sm:px-6">
        <ShoppingBag className="size-10 text-neutral-300" strokeWidth={1.25} />
        <h1 className="mt-4 text-lg font-bold text-neutral-950">Giỏ hàng đang trống</h1>
        <Button asChild className="mt-6 h-11 rounded-full bg-neutral-950 px-8 text-sm font-semibold text-white">
          <Link href="/products">Tiếp tục mua sắm</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      <Breadcrumb
        items={[
          { label: "Trang chủ", href: "/" },
          { label: "Giỏ hàng", href: "/cart" },
          { label: "Thanh toán" },
        ]}
      />

      <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-neutral-950 sm:text-3xl">Thanh toán</h1>

      <form onSubmit={onSubmit} className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* SHIPPING FORM */}
        <div className="flex flex-col gap-4 rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm md:col-span-2">
          <h2 className="text-base font-bold text-neutral-950">Thông tin giao hàng</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">Người nhận</label>
              <input
                required
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm focus:border-neutral-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">Số điện thoại</label>
              <input
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm focus:border-neutral-400 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Địa chỉ</label>
            <input
              required
              value={addressLine}
              onChange={(e) => setAddressLine(e.target.value)}
              placeholder="Số nhà, tên đường, phường/xã"
              className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm focus:border-neutral-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Tỉnh/Thành phố</label>
            <input
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm focus:border-neutral-400 focus:outline-none"
            />
          </div>

          <div className="mt-2 flex flex-col divide-y divide-neutral-100 border-t border-neutral-100 pt-4">
            {cartItems.map((item) => (
              <div key={item.variantId} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="text-neutral-600">
                  {item.productName} <span className="text-neutral-400">× {item.quantity}</span>
                </span>
                <span className="font-medium text-neutral-950">
                  {(item.price * item.quantity).toLocaleString("vi-VN")}đ
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* SUMMARY */}
        <div className="h-fit rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-neutral-950">Tóm tắt đơn hàng</h2>
          <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-4">
            <span className="text-sm font-bold text-neutral-950">Tổng cộng</span>
            <span className="text-lg font-extrabold text-neutral-950">{subtotal.toLocaleString("vi-VN")}đ</span>
          </div>

          {error && <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}

          <Button
            type="submit"
            disabled={submitting}
            className="mt-6 h-12 w-full rounded-full bg-neutral-950 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            {submitting ? "Đang đặt hàng..." : "Đặt hàng"}
          </Button>
        </div>
      </form>
    </main>
  );
}

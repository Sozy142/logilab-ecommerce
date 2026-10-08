import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api-client";
import { Breadcrumb } from "@/components/breadcrumb";

type OrderItem = {
  id: string;
  quantity: number;
  price: number;
  product_variants: {
    variant_name: string;
    products: { name: string; slug: string } | null;
  } | null;
};

type OrderDetail = {
  order: { id: string; status: string; total: number; shipping_address: string; phone: string; created_at: string };
  items: OrderItem[];
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Chờ xử lý",
  paid: "Đã thanh toán",
  shipped: "Đang giao",
  completed: "Hoàn tất",
  cancelled: "Đã huỷ",
};

type Props = { params: Promise<{ id: string }> };

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;

  let detail: OrderDetail;
  try {
    detail = await apiFetch<OrderDetail>(`/orders/${id}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect(`/login?redirect=/orders/${id}`);
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const { order, items } = detail;

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <Breadcrumb
        items={[
          { label: "Trang chủ", href: "/" },
          { label: "Đơn hàng của tôi", href: "/orders" },
          { label: `#${order.id.slice(0, 8).toUpperCase()}` },
        ]}
      />

      <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-6 text-center">
        <CheckCircle2 className="size-9 text-emerald-500" strokeWidth={1.5} />
        <h1 className="text-lg font-bold text-neutral-950">Đặt hàng thành công</h1>
        <p className="text-sm text-neutral-500">
          Đơn #{order.id.slice(0, 8).toUpperCase()} · {STATUS_LABEL[order.status] ?? order.status}
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold text-neutral-950">Địa chỉ giao hàng</h2>
        <p className="mt-2 text-sm text-neutral-600">{order.shipping_address}</p>
        <p className="text-sm text-neutral-600">{order.phone}</p>

        <div className="mt-6 flex flex-col divide-y divide-neutral-100 border-t border-neutral-100">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <div>
                <Link
                  href={item.product_variants?.products ? `/products/${item.product_variants.products.slug}` : "#"}
                  className="font-medium text-neutral-900 hover:underline"
                >
                  {item.product_variants?.products?.name ?? "Sản phẩm"}
                </Link>
                <p className="text-xs text-neutral-500">
                  {item.product_variants?.variant_name} × {item.quantity}
                </p>
              </div>
              <span className="font-semibold text-neutral-950">
                {(Number(item.price) * item.quantity).toLocaleString("vi-VN")}đ
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-4">
          <span className="text-sm font-bold text-neutral-950">Tổng cộng</span>
          <span className="text-lg font-extrabold text-neutral-950">
            {Number(order.total).toLocaleString("vi-VN")}đ
          </span>
        </div>
      </div>
    </main>
  );
}

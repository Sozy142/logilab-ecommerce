import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, PackageOpen } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api-client";
import { Breadcrumb } from "@/components/breadcrumb";

type Order = {
  id: string;
  status: string;
  total: number;
  shipping_address: string;
  phone: string;
  created_at: string;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Chờ xử lý",
  paid: "Đã thanh toán",
  shipped: "Đang giao",
  completed: "Hoàn tất",
  cancelled: "Đã huỷ",
};

export default async function OrdersPage() {
  let orders: Order[];
  try {
    ({ orders } = await apiFetch<{ orders: Order[] }>("/orders"));
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect("/login?redirect=/orders");
    throw err;
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <Breadcrumb items={[{ label: "Trang chủ", href: "/" }, { label: "Đơn hàng của tôi" }]} />

      <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-neutral-950 sm:text-3xl">
        Đơn hàng của tôi
      </h1>

      {orders.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-neutral-300 p-16 text-center">
          <PackageOpen className="size-10 text-neutral-300" strokeWidth={1.25} />
          <p className="text-sm font-medium text-neutral-400">Bạn chưa có đơn hàng nào.</p>
          <Link href="/products" className="mt-2 text-sm font-semibold text-neutral-950 hover:underline">
            Bắt đầu mua sắm
          </Link>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="flex items-center justify-between gap-4 rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div>
                <p className="text-sm font-semibold text-neutral-900">
                  Đơn #{order.id.slice(0, 8).toUpperCase()}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  {new Date(order.created_at).toLocaleDateString("vi-VN")} · {STATUS_LABEL[order.status] ?? order.status}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-neutral-950">{Number(order.total).toLocaleString("vi-VN")}đ</p>
                <ChevronRight className="ml-auto mt-1 size-4 text-neutral-300" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

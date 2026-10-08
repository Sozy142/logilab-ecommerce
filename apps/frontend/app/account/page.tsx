import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, PackageOpen, UserCircle } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api-client";
import { Breadcrumb } from "@/components/breadcrumb";
import { LogoutButton } from "@/components/logout-button";
import type { MeResponse } from "@logilab/shared-types";

export default async function AccountPage() {
  let me: MeResponse;
  try {
    me = await apiFetch<MeResponse>("/auth/me");
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect("/login?redirect=/account");
    throw err;
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
      <Breadcrumb items={[{ label: "Trang chủ", href: "/" }, { label: "Tài khoản" }]} />

      <div className="mt-6 flex items-center gap-4 rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-white">
          <UserCircle className="size-7" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-neutral-950">
            {me.customer?.full_name || me.user.email}
          </p>
          <p className="truncate text-sm text-neutral-500">{me.user.email}</p>
          {me.customer?.phone && <p className="text-sm text-neutral-500">{me.customer.phone}</p>}
        </div>
      </div>

      <Link
        href="/orders"
        className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
      >
        <div className="flex items-center gap-3">
          <PackageOpen className="size-5 text-neutral-400" />
          <span className="text-sm font-semibold text-neutral-900">Đơn hàng của tôi</span>
        </div>
        <ChevronRight className="size-4 text-neutral-300" />
      </Link>

      <div className="mt-6">
        <LogoutButton />
      </div>
    </main>
  );
}

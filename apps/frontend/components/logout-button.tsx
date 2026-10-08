"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clientApiFetch } from "@/lib/auth-client";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    try {
      await clientApiFetch("/auth/logout", { method: "POST" });
    } finally {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <Button
      onClick={onClick}
      disabled={loading}
      variant="outline"
      className="h-11 rounded-full border-neutral-200 px-6 text-sm font-semibold text-neutral-950 hover:bg-neutral-950 hover:text-white"
    >
      <LogOut className="size-4" />
      {loading ? "Đang đăng xuất..." : "Đăng xuất"}
    </Button>
  );
}

"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clientApiFetch, ApiError } from "@/lib/auth-client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await clientApiFetch("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không thể đăng nhập, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-10 sm:px-6">
      <div className="flex flex-col items-center text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-neutral-950 text-white">
          <LogIn className="size-5" />
        </div>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-neutral-950">Đăng nhập</h1>
        <p className="mt-1 text-sm text-neutral-500">Đăng nhập để tiếp tục mua hàng tại Logilab.</p>
      </div>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-neutral-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm text-neutral-900 focus:border-neutral-400 focus:outline-none"
            placeholder="ban@email.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-neutral-700">
            Mật khẩu
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm text-neutral-900 focus:border-neutral-400 focus:outline-none"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="mt-2 h-12 w-full rounded-full bg-neutral-950 text-sm font-semibold text-white hover:bg-neutral-800"
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500">
        Chưa có tài khoản?{" "}
        <Link
          href={`/signup${redirectTo !== "/" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
          className="font-semibold text-neutral-950 hover:underline"
        >
          Đăng ký ngay
        </Link>
      </p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

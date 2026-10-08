// Bản dành cho Client Component — gọi thẳng trình duyệt sang backend Express,
// browser tự đính kèm cookie session qua credentials:"include" (khác với
// lib/api-client.ts vốn dùng trong Server Component, phải tự forward cookie
// thủ công vì fetch() ở server không có cookie trình duyệt).
import type { MeResponse } from "@logilab/shared-types";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function clientApiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const res = await fetch(`${BACKEND_URL}${path}`, { ...init, headers, credentials: "include" });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body?.error?.message ?? `Có lỗi xảy ra (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export function getMe(): Promise<MeResponse> {
  return clientApiFetch<MeResponse>("/auth/me");
}

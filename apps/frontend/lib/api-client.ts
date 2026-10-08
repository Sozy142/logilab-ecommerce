import { cookies } from "next/headers";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";
const COOKIE_NAME = process.env.NEXT_PUBLIC_COOKIE_NAME ?? "logilab_session";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Server Component gọi fetch() không tự mang theo cookie trình duyệt như
// request gốc — phải tự đọc từ next/headers rồi gắn thủ công vào header
// Cookie khi gọi sang backend Express.
async function authCookieHeader(): Promise<string | undefined> {
  if (typeof window !== "undefined") return undefined; // client component: browser tự gửi cookie qua credentials:"include"
  const store = await cookies();
  const session = store.get(COOKIE_NAME);
  return session ? `${session.name}=${session.value}` : undefined;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const cookieHeader = await authCookieHeader();
  if (cookieHeader) headers.set("Cookie", cookieHeader);

  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body?.error?.message ?? `API error ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function apiFetchOrNull<T>(path: string, init: RequestInit = {}): Promise<T | null> {
  try {
    return await apiFetch<T>(path, init);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

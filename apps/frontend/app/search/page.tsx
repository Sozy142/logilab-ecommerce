import Link from "next/link";
import { Boxes, Search } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { Breadcrumb } from "@/components/breadcrumb";
import { ProductCard } from "@/components/product-card";
import { Pagination } from "@/components/pagination";
import type { SearchResponse } from "@logilab/shared-types";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const query = typeof sp.q === "string" ? sp.q.trim() : "";
  const page = typeof sp.page === "string" ? sp.page : undefined;

  const qs = new URLSearchParams({ q: query });
  if (page) qs.set("page", page);

  const { items, total, page: currentPage, totalPages } =
    query.length === 0
      ? { items: [], total: 0, page: 1, totalPages: 1 }
      : await apiFetch<SearchResponse>(`/search?${qs.toString()}`);

  const buildHref = (page: number) =>
    `/search?q=${encodeURIComponent(query)}${page > 1 ? `&page=${page}` : ""}`;

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      <Breadcrumb items={[{ label: "Trang chủ", href: "/" }, { label: "Tìm kiếm" }]} />

      {/* SEARCH FORM */}
      <form action="/search" className="mx-auto mt-6 max-w-xl">
        <div className="flex w-full items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-3 shadow-sm transition-colors focus-within:border-neutral-400">
          <Search className="size-5 shrink-0 text-neutral-400" />
          <input
            type="search"
            name="q"
            defaultValue={query}
            autoFocus
            placeholder="Tìm linh kiện, module, cảm biến..."
            className="w-full bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none sm:text-base"
          />
        </div>
      </form>

      {query.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-neutral-300 p-16 text-center">
          <Search className="size-10 text-neutral-300" strokeWidth={1.25} />
          <p className="text-sm font-medium text-neutral-400">
            Nhập tên linh kiện, module hoặc cảm biến bạn muốn tìm.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-8">
            <h1 className="text-lg font-bold text-neutral-950 sm:text-xl">
              Kết quả tìm kiếm cho &quot;{query}&quot;
            </h1>
            <p className="mt-1 text-sm text-neutral-500">{total} sản phẩm</p>
          </div>

          {items.length > 0 ? (
            <>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
                {items.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>
              <Pagination currentPage={currentPage} totalPages={totalPages} buildHref={buildHref} />
            </>
          ) : (
            <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-neutral-300 p-16 text-center">
              <Boxes className="size-10 text-neutral-300" strokeWidth={1.25} />
              <p className="text-sm font-medium text-neutral-400">
                Không tìm thấy sản phẩm nào khớp với &quot;{query}&quot;.
              </p>
              <Link
                href="/products"
                className="mt-2 text-sm font-semibold text-neutral-950 underline-offset-2 hover:underline"
              >
                Xem tất cả sản phẩm
              </Link>
            </div>
          )}
        </>
      )}
    </main>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductImage } from "@/components/product-image";

type Suggestion = {
  id: string;
  name: string;
  slug: string;
  product_variants?: { price: number }[] | null;
  product_images?: { image_url: string }[] | null;
};

export function HeaderSearch({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const trimmed = query.trim();

  useEffect(() => {
    // Dưới 2 ký tự thì không fetch — dropdown cũng không hiện (xem
    // showDropdown bên dưới) nên không cần reset `results` ở đây, tránh
    // setState đồng bộ ngay trong effect.
    if (trimmed.length < 2) return;
    const timer = setTimeout(() => {
      setLoading(true);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";
      fetch(`${backendUrl}/search/suggestions?q=${encodeURIComponent(trimmed)}`)
        .then((res) => res.json())
        .then((data) => setResults(data.results ?? []))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [trimmed]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function goToResults() {
    if (!trimmed) return;
    setOpen(false);
    onNavigate?.();
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  const showDropdown = open && trimmed.length >= 2;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <form
        action="/search"
        onSubmit={(e) => {
          e.preventDefault();
          goToResults();
        }}
      >
        <div className="flex w-full items-center gap-2 rounded-full bg-neutral-100 px-4 py-2.5 transition-colors focus-within:bg-neutral-200/70">
          <Search className="size-4 shrink-0 text-neutral-400" />
          <input
            type="search"
            name="q"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
            }}
            autoComplete="off"
            placeholder="Tìm linh kiện, module, cảm biến..."
            className="w-full bg-transparent text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none"
          />
        </div>
      </form>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-black/5 bg-white shadow-xl">
          {loading ? (
            <div className="p-4 text-center text-sm text-neutral-400">Đang tìm...</div>
          ) : results.length > 0 ? (
            <>
              <ul className="max-h-80 overflow-y-auto py-2">
                {results.map((product) => {
                  const image = product.product_images?.[0]?.image_url;
                  const prices = product.product_variants?.map((v) => v.price) ?? [];
                  const price = prices.length > 0 ? Math.min(...prices) : null;
                  return (
                    <li key={product.id}>
                      <Link
                        href={`/products/${product.slug}`}
                        onClick={() => {
                          setOpen(false);
                          onNavigate?.();
                        }}
                        className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-neutral-50"
                      >
                        <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-neutral-100">
                          <ProductImage
                            src={image}
                            alt={product.name}
                            className="size-full object-contain"
                            icon={Search}
                            iconClassName="size-4"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-neutral-800">{product.name}</p>
                          {price !== null && (
                            <p className="text-xs font-semibold text-neutral-950">
                              {price.toLocaleString("vi-VN")}đ
                            </p>
                          )}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <button
                type="button"
                onClick={goToResults}
                className="block w-full border-t border-neutral-100 px-4 py-3 text-center text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
              >
                Xem tất cả kết quả cho &quot;{trimmed}&quot;
              </button>
            </>
          ) : (
            <div className="p-4 text-center text-sm text-neutral-400">
              Không tìm thấy sản phẩm nào khớp &quot;{trimmed}&quot;.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

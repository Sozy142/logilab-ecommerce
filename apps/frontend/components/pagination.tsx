import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function getPageList(current: number, total: number): (number | "...")[] {
  const pages = new Set<number>([1, total]);
  for (let p = current - 1; p <= current + 1; p++) {
    if (p >= 1 && p <= total) pages.add(p);
  }
  const sorted = Array.from(pages).sort((a, b) => a - b);

  const result: (number | "...")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) result.push("...");
    result.push(p);
    prev = p;
  }
  return result;
}

export function Pagination({
  currentPage,
  totalPages,
  buildHref,
}: {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const pageButtonClass =
    "flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors";

  return (
    <nav aria-label="Phân trang" className="mt-10 flex items-center justify-center gap-1.5">
      {currentPage > 1 ? (
        <Link
          href={buildHref(currentPage - 1)}
          aria-label="Trang trước"
          className={cn(pageButtonClass, "text-neutral-600 hover:bg-neutral-100")}
        >
          <ChevronLeft className="size-4" />
        </Link>
      ) : (
        <span aria-hidden="true" className={cn(pageButtonClass, "text-neutral-300")}>
          <ChevronLeft className="size-4" />
        </span>
      )}

      {getPageList(currentPage, totalPages).map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="flex h-9 min-w-9 items-center justify-center text-sm text-neutral-400">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={buildHref(p)}
            aria-current={p === currentPage ? "page" : undefined}
            className={cn(
              pageButtonClass,
              p === currentPage
                ? "bg-neutral-950 text-white"
                : "text-neutral-700 hover:bg-neutral-100"
            )}
          >
            {p}
          </Link>
        )
      )}

      {currentPage < totalPages ? (
        <Link
          href={buildHref(currentPage + 1)}
          aria-label="Trang sau"
          className={cn(pageButtonClass, "text-neutral-600 hover:bg-neutral-100")}
        >
          <ChevronRight className="size-4" />
        </Link>
      ) : (
        <span aria-hidden="true" className={cn(pageButtonClass, "text-neutral-300")}>
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  );
}

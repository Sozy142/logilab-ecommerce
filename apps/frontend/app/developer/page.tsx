import { Boxes } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { Breadcrumb } from "@/components/breadcrumb";
import { ProductCard } from "@/components/product-card";
import { SortDropdown } from "@/components/sort-dropdown";
import { ProductFilterPanel } from "@/components/product-filter-panel";
import { ActiveFilterChips } from "@/components/active-filter-chips";
import { FilterDrawer } from "@/components/ui/filter-drawer";
import { Pagination } from "@/components/pagination";
import { SORT_OPTIONS, buildFilterUrl, type FilterState } from "@/lib/product-filters";
import type { DeveloperProductListResponse } from "@logilab/shared-types";

const BASE_PATH = "/developer";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function DeveloperPage({ searchParams }: Props) {
  const sp = await searchParams;

  const categorySlug = typeof sp.category === "string" ? sp.category : undefined;
  const sort = typeof sp.sort === "string" ? sp.sort : "newest";
  const priceFilters = Array.isArray(sp.price) ? sp.price : sp.price ? [sp.price] : [];
  const priceMin = typeof sp.priceMin === "string" ? sp.priceMin : undefined;
  const priceMax = typeof sp.priceMax === "string" ? sp.priceMax : undefined;
  const brandFilters = Array.isArray(sp.brand) ? sp.brand : sp.brand ? [sp.brand] : [];
  const stockOnly = sp.stock === "in";
  const page = typeof sp.page === "string" ? sp.page : undefined;

  const qs = new URLSearchParams();
  if (categorySlug) qs.set("category", categorySlug);
  if (sort) qs.set("sort", sort);
  for (const b of brandFilters) qs.append("brand", b);
  if (stockOnly) qs.set("stock", "in");
  for (const p of priceFilters) qs.append("price", p);
  if (priceMin) qs.set("priceMin", priceMin);
  if (priceMax) qs.set("priceMax", priceMax);
  if (page) qs.set("page", page);

  const {
    devCategories,
    activeCategory,
    items,
    total,
    page: currentPage,
    totalPages,
    brands,
    priceBucketCounts,
  } = await apiFetch<DeveloperProductListResponse>(`/products/developer?${qs.toString()}`);

  const activeBrandNames = brandFilters
    .map((s) => brands.find((b) => b.slug === s)?.name)
    .filter((name): name is string => Boolean(name));
  let activeName = activeCategory ? activeCategory.name : "Developer";
  if (activeBrandNames.length > 0) activeName = `${activeName} · ${activeBrandNames.join(", ")}`;

  const filterState: FilterState = {
    category: categorySlug,
    price: priceFilters,
    priceMin,
    priceMax,
    brand: brandFilters,
    stock: stockOnly ? "in" : undefined,
    sort,
  };

  const activeCount =
    (categorySlug ? 1 : 0) +
    brandFilters.length +
    priceFilters.length +
    (priceMin ? 1 : 0) +
    (priceMax ? 1 : 0) +
    (stockOnly ? 1 : 0);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      <Breadcrumb
        items={[
          { label: "Trang chủ", href: "/" },
          ...(activeCategory ? [{ label: "Developer", href: "/developer" }] : []),
          { label: activeName },
        ]}
      />

      <div className="mt-6 flex flex-col gap-8 lg:flex-row">
        {/* SIDEBAR FILTER — desktop only, mobile dùng FilterDrawer */}
        <aside className="hidden shrink-0 lg:block lg:w-64">
          <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
            <ProductFilterPanel
              basePath={BASE_PATH}
              current={filterState}
              brands={brands}
              priceBucketCounts={priceBucketCounts}
            />
          </div>
        </aside>

        {/* PRODUCT GRID */}
        <div className="flex-1">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-neutral-950 sm:text-2xl">
                {activeName}
              </h1>
              <p className="mt-1 text-sm text-neutral-500">{total} sản phẩm</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="lg:hidden">
                <FilterDrawer activeCount={activeCount}>
                  <ProductFilterPanel
                    basePath={BASE_PATH}
                    current={filterState}
                    brands={brands}
                    priceBucketCounts={priceBucketCounts}
                    deferApply
                  />
                </FilterDrawer>
              </div>

              <SortDropdown
                current={sort}
                options={SORT_OPTIONS.map((opt) => ({
                  ...opt,
                  href: buildFilterUrl(BASE_PATH, filterState, { sort: opt.value }),
                }))}
              />
            </div>
          </div>

          <ActiveFilterChips basePath={BASE_PATH} current={filterState} categories={devCategories} brands={brands} />

          {items.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
                {items.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                buildHref={(page) => buildFilterUrl(BASE_PATH, filterState, { page })}
              />
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-neutral-300 p-16 text-center">
              <Boxes className="size-10 text-neutral-300" strokeWidth={1.25} />
              <p className="text-sm font-medium text-neutral-400">
                Không tìm thấy sản phẩm phù hợp với bộ lọc.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

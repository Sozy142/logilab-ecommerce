// getCheapestPrice/getTotalStock/getAvailableBrands trước đây tính bằng JS ở
// đây đã chuyển sang backend (logilab-server-api) — response API giờ trả sẵn
// cheapest_price/total_stock trên từng sản phẩm và brands[] ở list response.
// File này chỉ còn giữ phần thuần UI: hằng số hiển thị + xây query string.
// Dùng chung cho cả 3 trang có filter sản phẩm (/products, /categories/[slug],
// /developer) — tất cả đều dùng chung param "category" (danh mục ở bất kỳ
// cấp nào, không chỉ con trực tiếp).

export const PRICE_RANGES = [
  { id: "under-200k", label: "Dưới 200.000đ", min: 0, max: 200000 },
  { id: "200k-500k", label: "200.000đ - 500.000đ", min: 200000, max: 500000 },
  { id: "500k-1m", label: "500.000đ - 1.000.000đ", min: 500000, max: 1000000 },
  { id: "1m-2m", label: "1.000.000đ - 2.000.000đ", min: 1000000, max: 2000000 },
  { id: "over-2m", label: "Trên 2.000.000đ", min: 2000000, max: Infinity },
];

export const SORT_OPTIONS = [
  { value: "newest", label: "Mới nhất" },
  { value: "price-asc", label: "Giá thấp đến cao" },
  { value: "price-desc", label: "Giá cao đến thấp" },
];

export const PAGE_SIZE = 20;

export type FilterState = {
  category?: string;
  price?: string[];
  priceMin?: string;
  priceMax?: string;
  brand?: string[];
  stock?: string;
  sort?: string;
};

export function buildFilterUrl(
  basePath: string,
  current: FilterState,
  overrides: Partial<{
    category: string | null;
    toggleBrand: string;
    togglePrice: string;
    priceMin: string | null;
    priceMax: string | null;
    stock: string | null;
    sort: string;
    page: number;
  }>
): string {
  const params = new URLSearchParams();

  const category = overrides.category !== undefined ? overrides.category : current.category ?? null;
  if (category) params.set("category", category);

  const sort = overrides.sort ?? current.sort;
  if (sort && sort !== "newest") params.set("sort", sort);

  let brand = current.brand ?? [];
  if (overrides.toggleBrand) {
    brand = brand.includes(overrides.toggleBrand)
      ? brand.filter((b) => b !== overrides.toggleBrand)
      : [...brand, overrides.toggleBrand];
  }
  for (const b of brand) params.append("brand", b);

  const stock = overrides.stock !== undefined ? overrides.stock : current.stock ?? null;
  if (stock) params.set("stock", stock);

  let price = current.price ?? [];
  if (overrides.togglePrice) {
    price = price.includes(overrides.togglePrice)
      ? price.filter((p) => p !== overrides.togglePrice)
      : [...price, overrides.togglePrice];
  }
  for (const p of price) params.append("price", p);

  const priceMin = overrides.priceMin !== undefined ? overrides.priceMin : current.priceMin ?? null;
  if (priceMin) params.set("priceMin", priceMin);
  const priceMax = overrides.priceMax !== undefined ? overrides.priceMax : current.priceMax ?? null;
  if (priceMax) params.set("priceMax", priceMax);

  // page không phải 1 phần của FilterState "current" — mọi thay đổi
  // filter/sort (không truyền page) sẽ tự động về lại trang 1.
  if (overrides.page && overrides.page > 1) params.set("page", String(overrides.page));

  const qs = params.toString();
  return `${basePath}${qs ? `?${qs}` : ""}`;
}

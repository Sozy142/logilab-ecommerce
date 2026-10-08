import { z } from "zod";
import * as repo from "../repositories/products.repository.js";
import * as categoriesRepo from "../repositories/categories.repository.js";
import { slugify } from "../lib/slugify.js";
import { PAGE_SIZE } from "../lib/constants.js";
import { conflict, notFound } from "../lib/app-error.js";
import { isForeignKeyViolation, isUniqueViolation } from "../lib/pg-errors.js";

export type ListProductsQuery = {
  categoryIds?: string[];
  brandSlugs?: string[];
  stock?: string;
  price?: string[];
  priceMin?: string;
  priceMax?: string;
  sort?: string;
  page?: string;
};

function parseSort(sort?: string): "newest" | "price-asc" | "price-desc" {
  if (sort === "price-asc" || sort === "price-desc") return sort;
  return "newest";
}

function parsePage(page?: string): number {
  const n = page ? parseInt(page, 10) : 1;
  return Number.isFinite(n) && n > 0 ? n : 1;
}

// Chấp nhận số nguyên không âm hợp lệ, bỏ qua giá trị rác thay vì lỗi 400 —
// khoảng giá tự nhập là tiện ích phụ, không đáng để chặn cả trang vì gõ sai.
function parsePriceNumber(value?: string): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

async function resolveBrandNames(brandSlugs: string[] | undefined, categoryIds: string[] | undefined) {
  if (!brandSlugs || brandSlugs.length === 0) return undefined;
  const brands = await repo.getDistinctBrands(categoryIds);
  const matched = brands.filter((name) => brandSlugs.includes(slugify(name)));
  return matched.length > 0 ? matched : undefined;
}

function toRepoParams(q: ListProductsQuery, brands: string[] | undefined) {
  return {
    categoryIds: q.categoryIds,
    brands,
    inStockOnly: q.stock === "in",
    priceBucketIds: q.price,
    priceMin: parsePriceNumber(q.priceMin),
    priceMax: parsePriceNumber(q.priceMax),
  };
}

export async function listProducts(q: ListProductsQuery) {
  const brands = await resolveBrandNames(q.brandSlugs, q.categoryIds);
  const page = parsePage(q.page);

  const { items, total } = await repo.queryProducts({
    ...toRepoParams(q, brands),
    sort: parseSort(q.sort),
    page,
    pageSize: PAGE_SIZE,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return { items, total, page: Math.min(page, totalPages), totalPages };
}

export async function getAvailableBrands(categoryIds?: string[]) {
  const names = await repo.getDistinctBrands(categoryIds);
  return names.map((name) => ({ name, slug: slugify(name) })).sort((a, b) => a.name.localeCompare(b.name));
}

// Số lượng sản phẩm khớp mỗi lựa chọn filter (danh mục/hãng/khung giá), tính
// theo các filter KHÁC đang áp dụng — để hiện "Arduino (12)" trong sidebar
// và tránh người dùng bấm vào lựa chọn ra 0 kết quả mà không biết trước.
export async function getFilterFacets(q: ListProductsQuery) {
  const brands = await resolveBrandNames(q.brandSlugs, q.categoryIds);
  const [counts, availableBrands] = await Promise.all([
    repo.getFacetCounts(toRepoParams(q, brands)),
    getAvailableBrands(q.categoryIds),
  ]);

  return {
    brands: availableBrands.map((b) => ({ ...b, count: counts.brandCounts[b.name] ?? 0 })),
    categoryCounts: counts.categoryCounts,
    priceBucketCounts: counts.priceBucketCounts,
  };
}

export async function getProductDetail(slug: string) {
  const product = await repo.getProductBySlug(slug);
  if (!product) throw notFound("Không tìm thấy sản phẩm");

  const [category, related] = await Promise.all([
    categoriesRepo.getCategoryById(product.category_id),
    repo.getRelatedProducts(product.category_id, product.id, 12),
  ]);

  return { product, category, related };
}

export async function getFeaturedProducts() {
  return repo.getTopByPrice("desc", 14);
}

export async function getBestSellerProducts() {
  return repo.getTopByPrice("asc", 14);
}

export async function searchProducts(q: string, page?: string) {
  if (q.trim().length === 0) return { items: [], total: 0, page: 1, totalPages: 1 };
  const parsedPage = parsePage(page);
  const { items, total } = await repo.searchProducts(q.trim(), { page: parsedPage, pageSize: PAGE_SIZE });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return { items, total, page: Math.min(parsedPage, totalPages), totalPages };
}

export async function searchSuggestions(q: string) {
  if (q.trim().length < 2) return [];
  const { items } = await repo.searchProducts(q.trim(), { limit: 6 });
  return items;
}

// ---- Admin CRUD ----

const productSpecSchema = z.object({ label: z.string().min(1), value: z.string().min(1) });

export const productCreateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  categoryId: z.string().uuid(),
  brand: z.string().nullable().optional(),
  specs: z.array(productSpecSchema).optional(),
  datasheetUrl: z.string().url().nullable().optional(),
  libraryUrl: z.string().url().nullable().optional(),
});
export const productUpdateSchema = productCreateSchema.partial();

export const variantSchema = z.object({
  variantName: z.string().min(1),
  sku: z.string().nullable().optional(),
  price: z.number().positive(),
  stock: z.number().int().min(0).optional(),
});
export const variantUpdateSchema = variantSchema.partial();

export const productImageSchema = z.object({
  imageUrl: z.string().url(),
  displayOrder: z.number().int().optional(),
});
export const productImageUpdateSchema = productImageSchema.partial();

export async function listProductsAdmin(q: string | undefined, page: string | undefined) {
  if (q && q.trim()) return searchProducts(q, page);
  return listProducts({ page });
}

export async function getProductAdmin(id: string) {
  const product = await repo.getProductById(id);
  if (!product) throw notFound("Không tìm thấy sản phẩm");
  return product;
}

export async function createProductAdmin(input: z.infer<typeof productCreateSchema>) {
  const slug = input.slug?.trim() || slugify(input.name);
  try {
    const { id } = await repo.createProduct({ ...input, slug });
    return await repo.getProductById(id);
  } catch (err) {
    if (isUniqueViolation(err)) throw conflict("Slug sản phẩm đã tồn tại");
    throw err;
  }
}

export async function updateProductAdmin(id: string, input: z.infer<typeof productUpdateSchema>) {
  try {
    const updated = await repo.updateProduct(id, input);
    if (!updated) throw notFound("Không tìm thấy sản phẩm");
    return await repo.getProductById(id);
  } catch (err) {
    if (isUniqueViolation(err)) throw conflict("Slug sản phẩm đã tồn tại");
    throw err;
  }
}

export async function deleteProductAdmin(id: string) {
  try {
    const ok = await repo.deleteProduct(id);
    if (!ok) throw notFound("Không tìm thấy sản phẩm");
  } catch (err) {
    if (isForeignKeyViolation(err)) throw conflict("Không thể xoá sản phẩm đã có đơn hàng liên quan");
    throw err;
  }
}

export async function createVariantAdmin(productId: string, input: z.infer<typeof variantSchema>) {
  try {
    return await repo.createVariant(productId, input);
  } catch (err) {
    if (isUniqueViolation(err)) throw conflict("SKU đã tồn tại");
    throw err;
  }
}

export async function updateVariantAdmin(id: string, input: z.infer<typeof variantUpdateSchema>) {
  try {
    const updated = await repo.updateVariant(id, input);
    if (!updated) throw notFound("Không tìm thấy phiên bản");
    return updated;
  } catch (err) {
    if (isUniqueViolation(err)) throw conflict("SKU đã tồn tại");
    throw err;
  }
}

export async function deleteVariantAdmin(id: string) {
  try {
    const ok = await repo.deleteVariant(id);
    if (!ok) throw notFound("Không tìm thấy phiên bản");
  } catch (err) {
    if (isForeignKeyViolation(err)) throw conflict("Không thể xoá phiên bản đã có trong đơn hàng");
    throw err;
  }
}

export async function addProductImageAdmin(productId: string, input: z.infer<typeof productImageSchema>) {
  return repo.addProductImage(productId, input);
}

export async function updateProductImageAdmin(id: string, input: z.infer<typeof productImageUpdateSchema>) {
  const updated = await repo.updateProductImage(id, input);
  if (!updated) throw notFound("Không tìm thấy ảnh");
  return updated;
}

export async function deleteProductImageAdmin(id: string) {
  const ok = await repo.deleteProductImage(id);
  if (!ok) throw notFound("Không tìm thấy ảnh");
}

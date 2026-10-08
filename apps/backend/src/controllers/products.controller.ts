import type { Request, Response } from "express";
import * as productsService from "../services/products.service.js";
import * as categoriesService from "../services/categories.service.js";
import { notFound } from "../lib/app-error.js";
import type {
  ProductListResponse,
  CategoryProductListResponse,
  DeveloperProductListResponse,
  ProductDetailResponse,
} from "@logilab/shared-types";

function asArray(value: unknown): string[] | undefined {
  if (Array.isArray(value)) return value as string[];
  if (typeof value === "string") return [value];
  return undefined;
}
function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

// GET /products?category=... — dùng cho trang /products. category có thể là
// danh mục ở BẤT KỲ cấp nào (gốc hoặc con/cháu) — gộp cả con/cháu của nó,
// giống hệt cách /categories/[slug] đã làm, để chọn 1 danh mục cha (thường
// không có sản phẩm gắn trực tiếp) vẫn ra kết quả thay vì rỗng.
export async function list(req: Request, res: Response) {
  const categorySlug = asString(req.query.category);
  let categoryIds: string[] | undefined;
  if (categorySlug) {
    const category = await categoriesService.getCategoryDetail(categorySlug);
    categoryIds = category.descendantCategoryIds;
  }

  const query = {
    categoryIds,
    brandSlugs: asArray(req.query.brand),
    stock: asString(req.query.stock),
    price: asArray(req.query.price),
    priceMin: asString(req.query.priceMin),
    priceMax: asString(req.query.priceMax),
    sort: asString(req.query.sort),
    page: asString(req.query.page),
  };

  const [result, facets] = await Promise.all([
    productsService.listProducts(query),
    productsService.getFilterFacets(query),
  ]);

  res.json({ ...result, ...facets } satisfies ProductListResponse);
}

// GET /products/by-category/:slug?category=... — dùng cho /categories/[slug].
// ?category= chọn 1 danh mục con/cháu bất kỳ độ sâu bên trong slug hiện tại
// (không chỉ con trực tiếp) để thu hẹp kết quả.
export async function listByCategory(req: Request, res: Response) {
  const category = await categoriesService.getCategoryDetail(req.params.slug);

  let categoryIds = category.descendantCategoryIds;
  const subSlug = asString(req.query.category);
  if (subSlug) {
    const sub = await categoriesService.findScopedCategory(req.params.slug, subSlug);
    if (!sub) throw notFound("Không tìm thấy danh mục con");
    const subDetail = await categoriesService.getCategoryDetail(sub.slug);
    categoryIds = subDetail.descendantCategoryIds;
  }

  const query = {
    categoryIds,
    brandSlugs: asArray(req.query.brand),
    stock: asString(req.query.stock),
    price: asArray(req.query.price),
    priceMin: asString(req.query.priceMin),
    priceMax: asString(req.query.priceMax),
    sort: asString(req.query.sort),
    page: asString(req.query.page),
  };

  const [result, facets] = await Promise.all([
    productsService.listProducts(query),
    productsService.getFilterFacets(query),
  ]);

  res.json({ category, ...result, ...facets } satisfies CategoryProductListResponse);
}

// GET /products/developer?category=... — dùng cho /developer. category có
// thể là 1 trong 6 danh mục gốc Developer hoặc bất kỳ con/cháu nào của chúng.
export async function listDeveloper(req: Request, res: Response) {
  const categorySlug = asString(req.query.category);
  const scope = await categoriesService.getDeveloperScope(categorySlug);

  const query = {
    categoryIds: scope.categoryIds,
    brandSlugs: asArray(req.query.brand),
    stock: asString(req.query.stock),
    price: asArray(req.query.price),
    priceMin: asString(req.query.priceMin),
    priceMax: asString(req.query.priceMax),
    sort: asString(req.query.sort),
    page: asString(req.query.page),
  };

  const [result, facets] = await Promise.all([
    productsService.listProducts(query),
    productsService.getFilterFacets(query),
  ]);

  res.json({
    devCategories: scope.devCategories,
    activeCategory: scope.activeCategory,
    ...result,
    ...facets,
  } satisfies DeveloperProductListResponse);
}

export async function getBySlug(req: Request, res: Response) {
  const detail = await productsService.getProductDetail(req.params.slug);
  res.json(detail satisfies ProductDetailResponse);
}

export async function featured(_req: Request, res: Response) {
  res.json({ items: await productsService.getFeaturedProducts() });
}

export async function bestSellers(_req: Request, res: Response) {
  res.json({ items: await productsService.getBestSellerProducts() });
}

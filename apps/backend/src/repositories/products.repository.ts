import { pool } from "../lib/db.js";
import { PRICE_RANGES } from "../lib/constants.js";
import type { ProductSpec } from "@logilab/shared-types";

export type ProductCatalogRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category_id: string;
  brand: string | null;
  specs: ProductSpec[] | null;
  datasheet_url: string | null;
  library_url: string | null;
  created_at: string;
  cheapest_price: number | null;
  total_stock: number;
};

export type Variant = { id: string; product_id: string; variant_name: string; sku: string; price: number; stock: number };
export type ProductImage = { id: string; product_id: string; image_url: string; display_order: number };

export type ProductWithRelations = ProductCatalogRow & {
  product_variants: Variant[];
  product_images: ProductImage[];
};

async function attachRelations(rows: ProductCatalogRow[]): Promise<ProductWithRelations[]> {
  const ids = rows.map((r) => r.id);
  if (ids.length === 0) return [];

  const [variantsResult, imagesResult] = await Promise.all([
    pool.query<Variant>("SELECT * FROM product_variants WHERE product_id = ANY($1::uuid[])", [ids]),
    pool.query<ProductImage>(
      "SELECT * FROM product_images WHERE product_id = ANY($1::uuid[]) ORDER BY display_order ASC",
      [ids]
    ),
  ]);

  return rows.map((row) => ({
    ...row,
    product_variants: variantsResult.rows.filter((v) => v.product_id === row.id),
    product_images: imagesResult.rows.filter((i) => i.product_id === row.id),
  }));
}

export type QueryProductsParams = {
  categoryIds?: string[];
  brands?: string[];
  inStockOnly?: boolean;
  priceBucketIds?: string[];
  priceMin?: number;
  priceMax?: number;
  sort?: "newest" | "price-asc" | "price-desc";
  page?: number;
  pageSize?: number;
};

// Dùng chung cho câu truy vấn chính lẫn các câu đếm facet (facetCounts) —
// `exclude` bỏ qua đúng 1 điều kiện để tính "còn bao nhiêu sản phẩm nếu chọn
// lựa chọn X" dựa trên các filter khác đang áp dụng (không tính chính X).
function buildConditions(
  params: QueryProductsParams,
  values: unknown[],
  exclude?: "category" | "brand" | "price"
): string[] {
  const conditions: string[] = [];

  if (exclude !== "category" && params.categoryIds) {
    // Rỗng nghĩa là "không có danh mục nào khớp" — ép về 0 kết quả thay vì bỏ
    // qua filter (bỏ qua sẽ vô tình trả về TẤT CẢ sản phẩm).
    values.push(params.categoryIds.length > 0 ? params.categoryIds : ["00000000-0000-0000-0000-000000000000"]);
    conditions.push(`category_id = ANY($${values.length}::uuid[])`);
  }
  if (exclude !== "brand" && params.brands && params.brands.length > 0) {
    values.push(params.brands);
    conditions.push(`brand = ANY($${values.length}::text[])`);
  }
  if (params.inStockOnly) {
    conditions.push("total_stock > 0");
  }
  if (exclude !== "price") {
    const priceClauses: string[] = [];
    if (params.priceBucketIds && params.priceBucketIds.length > 0) {
      const bucketClauses: string[] = [];
      for (const id of params.priceBucketIds) {
        const range = PRICE_RANGES.find((r) => r.id === id);
        if (!range) continue;
        values.push(range.min);
        const minParam = `$${values.length}`;
        if (range.max === Infinity) {
          bucketClauses.push(`cheapest_price >= ${minParam}`);
        } else {
          values.push(range.max);
          bucketClauses.push(`(cheapest_price >= ${minParam} AND cheapest_price < $${values.length})`);
        }
      }
      if (bucketClauses.length > 0) priceClauses.push(`(${bucketClauses.join(" OR ")})`);
    }
    // Khoảng giá tự nhập — độc lập với các khung có sẵn, AND với nhau nếu
    // người dùng dùng cả 2 (hiếm, nhưng vẫn đúng nghĩa: giao của 2 điều kiện).
    if (params.priceMin !== undefined) {
      values.push(params.priceMin);
      priceClauses.push(`cheapest_price >= $${values.length}`);
    }
    if (params.priceMax !== undefined) {
      values.push(params.priceMax);
      priceClauses.push(`cheapest_price <= $${values.length}`);
    }
    conditions.push(...priceClauses);
  }

  return conditions;
}

export async function queryProducts(
  params: QueryProductsParams
): Promise<{ items: ProductWithRelations[]; total: number }> {
  const values: unknown[] = [];
  const conditions = buildConditions(params, values);
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  let orderClause = "ORDER BY created_at DESC";
  if (params.sort === "price-asc") orderClause = "ORDER BY cheapest_price ASC NULLS LAST";
  else if (params.sort === "price-desc") orderClause = "ORDER BY cheapest_price DESC NULLS LAST";

  const pageSize = params.pageSize ?? 20;
  const page = Math.max(1, params.page ?? 1);
  const offset = (page - 1) * pageSize;

  values.push(pageSize, offset);
  const limitParam = `$${values.length - 1}`;
  const offsetParam = `$${values.length}`;

  const { rows } = await pool.query<ProductCatalogRow & { total_count: string }>(
    `SELECT *, COUNT(*) OVER() AS total_count FROM product_catalog
     ${whereClause} ${orderClause} LIMIT ${limitParam} OFFSET ${offsetParam}`,
    values
  );

  const total = rows.length > 0 ? Number(rows[0].total_count) : 0;
  const items = await attachRelations(rows.map(({ total_count, ...row }) => row));
  return { items, total };
}

export type FacetCounts = {
  categoryCounts: Record<string, number>;
  brandCounts: Record<string, number>;
  priceBucketCounts: Record<string, number>;
};

// Catalog hiện chỉ vài chục sản phẩm — lấy nguyên danh sách khớp (bỏ qua
// đúng 1 filter mỗi lần) rồi đếm bằng JS, đơn giản và chắc đúng hơn viết 3
// câu GROUP BY SQL riêng cho quy mô dữ liệu này.
export async function getFacetCounts(params: QueryProductsParams): Promise<FacetCounts> {
  async function countBy(exclude: "category" | "brand" | "price") {
    const values: unknown[] = [];
    const conditions = buildConditions(params, values, exclude);
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const { rows } = await pool.query<{ category_id: string; brand: string | null; cheapest_price: number | null }>(
      `SELECT category_id, brand, cheapest_price FROM product_catalog ${whereClause}`,
      values
    );
    return rows;
  }

  const [categoryRows, brandRows, priceRows] = await Promise.all([
    countBy("category"),
    countBy("brand"),
    countBy("price"),
  ]);

  const categoryCounts: Record<string, number> = {};
  for (const row of categoryRows) categoryCounts[row.category_id] = (categoryCounts[row.category_id] ?? 0) + 1;

  const brandCounts: Record<string, number> = {};
  for (const row of brandRows) {
    if (!row.brand) continue;
    brandCounts[row.brand] = (brandCounts[row.brand] ?? 0) + 1;
  }

  const priceBucketCounts: Record<string, number> = {};
  for (const range of PRICE_RANGES) {
    priceBucketCounts[range.id] = priceRows.filter(
      (row) =>
        row.cheapest_price !== null &&
        row.cheapest_price >= range.min &&
        (range.max === Infinity ? true : row.cheapest_price < range.max)
    ).length;
  }

  return { categoryCounts, brandCounts, priceBucketCounts };
}

export async function getProductBySlug(slug: string): Promise<ProductWithRelations | null> {
  const { rows } = await pool.query<ProductCatalogRow>("SELECT * FROM product_catalog WHERE slug = $1", [slug]);
  if (rows.length === 0) return null;
  const [withRelations] = await attachRelations(rows);
  return withRelations;
}

export async function getRelatedProducts(categoryId: string, excludeId: string, limit = 12): Promise<ProductWithRelations[]> {
  const { rows } = await pool.query<ProductCatalogRow>(
    "SELECT * FROM product_catalog WHERE category_id = $1 AND id != $2 LIMIT $3",
    [categoryId, excludeId, limit]
  );
  return attachRelations(rows);
}

export async function getTopByPrice(direction: "asc" | "desc", limit = 14): Promise<ProductWithRelations[]> {
  const order = direction === "asc" ? "ASC" : "DESC";
  const { rows } = await pool.query<ProductCatalogRow>(
    `SELECT * FROM product_catalog WHERE cheapest_price IS NOT NULL ORDER BY cheapest_price ${order} NULLS LAST LIMIT $1`,
    [limit]
  );
  return attachRelations(rows);
}

export async function getDistinctBrands(categoryIds?: string[]): Promise<string[]> {
  const conditions = ["brand IS NOT NULL"];
  const values: unknown[] = [];
  if (categoryIds) {
    values.push(categoryIds);
    conditions.push(`category_id = ANY($${values.length}::uuid[])`);
  }
  const { rows } = await pool.query<{ brand: string }>(
    `SELECT DISTINCT brand FROM product_catalog WHERE ${conditions.join(" AND ")}`,
    values
  );
  return rows.map((r) => r.brand);
}

export async function getProductById(id: string): Promise<ProductWithRelations | null> {
  const { rows } = await pool.query<ProductCatalogRow>("SELECT * FROM product_catalog WHERE id = $1", [id]);
  if (rows.length === 0) return null;
  const [withRelations] = await attachRelations(rows);
  return withRelations;
}

export type ProductInput = {
  name: string;
  slug: string;
  description?: string | null;
  categoryId: string;
  brand?: string | null;
  specs?: ProductSpec[];
  datasheetUrl?: string | null;
  libraryUrl?: string | null;
};

export async function createProduct(input: ProductInput): Promise<{ id: string }> {
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO products (name, slug, description, category_id, brand, specs, datasheet_url, library_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [
      input.name,
      input.slug,
      input.description ?? null,
      input.categoryId,
      input.brand ?? null,
      JSON.stringify(input.specs ?? []),
      input.datasheetUrl ?? null,
      input.libraryUrl ?? null,
    ]
  );
  return rows[0];
}

const PRODUCT_COLUMNS: Record<keyof ProductInput, string> = {
  name: "name",
  slug: "slug",
  description: "description",
  categoryId: "category_id",
  brand: "brand",
  specs: "specs",
  datasheetUrl: "datasheet_url",
  libraryUrl: "library_url",
};

export async function updateProduct(id: string, input: Partial<ProductInput>): Promise<{ id: string } | null> {
  const sets: string[] = [];
  const values: unknown[] = [];
  for (const [key, column] of Object.entries(PRODUCT_COLUMNS) as [keyof ProductInput, string][]) {
    if (input[key] === undefined) continue;
    values.push(key === "specs" ? JSON.stringify(input[key]) : input[key]);
    sets.push(`${column} = $${values.length}`);
  }
  if (sets.length === 0) return { id };

  values.push(id);
  const { rows } = await pool.query<{ id: string }>(
    `UPDATE products SET ${sets.join(", ")} WHERE id = $${values.length} RETURNING id`,
    values
  );
  return rows[0] ?? null;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const { rowCount } = await pool.query("DELETE FROM products WHERE id = $1", [id]);
  return (rowCount ?? 0) > 0;
}

export type VariantInput = { variantName: string; sku?: string | null; price: number; stock?: number };

export async function createVariant(productId: string, input: VariantInput): Promise<Variant> {
  const { rows } = await pool.query<Variant>(
    `INSERT INTO product_variants (product_id, variant_name, sku, price, stock)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [productId, input.variantName, input.sku ?? null, input.price, input.stock ?? 0]
  );
  return rows[0];
}

const VARIANT_COLUMNS: Record<keyof VariantInput, string> = {
  variantName: "variant_name",
  sku: "sku",
  price: "price",
  stock: "stock",
};

export async function updateVariant(id: string, input: Partial<VariantInput>): Promise<Variant | null> {
  const sets: string[] = [];
  const values: unknown[] = [];
  for (const [key, column] of Object.entries(VARIANT_COLUMNS) as [keyof VariantInput, string][]) {
    if (input[key] === undefined) continue;
    values.push(input[key]);
    sets.push(`${column} = $${values.length}`);
  }
  if (sets.length === 0) {
    const { rows } = await pool.query<Variant>("SELECT * FROM product_variants WHERE id = $1", [id]);
    return rows[0] ?? null;
  }

  values.push(id);
  const { rows } = await pool.query<Variant>(
    `UPDATE product_variants SET ${sets.join(", ")} WHERE id = $${values.length} RETURNING *`,
    values
  );
  return rows[0] ?? null;
}

export async function deleteVariant(id: string): Promise<boolean> {
  const { rowCount } = await pool.query("DELETE FROM product_variants WHERE id = $1", [id]);
  return (rowCount ?? 0) > 0;
}

export type ProductImageInput = { imageUrl: string; displayOrder?: number };

export async function addProductImage(productId: string, input: ProductImageInput): Promise<ProductImage> {
  const { rows } = await pool.query<ProductImage>(
    `INSERT INTO product_images (product_id, image_url, display_order) VALUES ($1, $2, $3) RETURNING *`,
    [productId, input.imageUrl, input.displayOrder ?? 0]
  );
  return rows[0];
}

export async function updateProductImage(id: string, input: Partial<ProductImageInput>): Promise<ProductImage | null> {
  const sets: string[] = [];
  const values: unknown[] = [];
  if (input.imageUrl !== undefined) {
    values.push(input.imageUrl);
    sets.push(`image_url = $${values.length}`);
  }
  if (input.displayOrder !== undefined) {
    values.push(input.displayOrder);
    sets.push(`display_order = $${values.length}`);
  }
  if (sets.length === 0) {
    const { rows } = await pool.query<ProductImage>("SELECT * FROM product_images WHERE id = $1", [id]);
    return rows[0] ?? null;
  }

  values.push(id);
  const { rows } = await pool.query<ProductImage>(
    `UPDATE product_images SET ${sets.join(", ")} WHERE id = $${values.length} RETURNING *`,
    values
  );
  return rows[0] ?? null;
}

export async function deleteProductImage(id: string): Promise<boolean> {
  const { rowCount } = await pool.query("DELETE FROM product_images WHERE id = $1", [id]);
  return (rowCount ?? 0) > 0;
}

export async function searchProducts(
  q: string,
  opts: { page?: number; pageSize?: number; limit?: number } = {}
): Promise<{ items: ProductWithRelations[]; total: number }> {
  // Giữ đúng cách làm hiện tại: 2 truy vấn riêng (theo name và theo
  // description) rồi gộp + khử trùng lặp bằng JS, thay vì 1 câu OR — dễ kiểm
  // soát hơn khi từ khoá người dùng gõ có ký tự đặc biệt.
  const limit = opts.limit;
  const nameQuery = limit
    ? pool.query<ProductCatalogRow>(
        "SELECT * FROM product_catalog WHERE name ILIKE $1 ORDER BY created_at DESC LIMIT $2",
        [`%${q}%`, limit]
      )
    : pool.query<ProductCatalogRow>(
        "SELECT * FROM product_catalog WHERE name ILIKE $1 ORDER BY created_at DESC",
        [`%${q}%`]
      );
  const descQuery = limit
    ? pool.query<ProductCatalogRow>(
        "SELECT * FROM product_catalog WHERE description ILIKE $1 ORDER BY created_at DESC LIMIT $2",
        [`%${q}%`, limit]
      )
    : pool.query<ProductCatalogRow>(
        "SELECT * FROM product_catalog WHERE description ILIKE $1 ORDER BY created_at DESC",
        [`%${q}%`]
      );

  const [nameResult, descResult] = await Promise.all([nameQuery, descQuery]);

  const merged = new Map<string, ProductCatalogRow>();
  for (const row of [...nameResult.rows, ...descResult.rows]) merged.set(row.id, row);
  const all = Array.from(merged.values());

  const total = all.length;
  const pageSize = opts.pageSize ?? 20;
  const page = Math.max(1, opts.page ?? 1);
  const pageRows = limit ? all.slice(0, limit) : all.slice((page - 1) * pageSize, page * pageSize);

  return { items: await attachRelations(pageRows), total };
}

import { pool } from "../lib/db.js";

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  display_order: number;
  image_url: string | null;
};

const COLUMNS = "id, name, slug, parent_id, display_order, image_url";

export async function listAllCategories(): Promise<CategoryRow[]> {
  const { rows } = await pool.query<CategoryRow>(
    `SELECT ${COLUMNS} FROM categories ORDER BY display_order ASC`
  );
  return rows;
}

export async function getCategoryBySlug(slug: string): Promise<CategoryRow | null> {
  const { rows } = await pool.query<CategoryRow>(
    `SELECT ${COLUMNS} FROM categories WHERE slug = $1`,
    [slug]
  );
  return rows[0] ?? null;
}

export async function getCategoryById(id: string): Promise<CategoryRow | null> {
  const { rows } = await pool.query<CategoryRow>(
    `SELECT ${COLUMNS} FROM categories WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function getChildren(parentId: string): Promise<CategoryRow[]> {
  const { rows } = await pool.query<CategoryRow>(
    `SELECT ${COLUMNS} FROM categories WHERE parent_id = $1 ORDER BY display_order ASC`,
    [parentId]
  );
  return rows;
}

export async function getChildrenOfMany(parentIds: string[]): Promise<CategoryRow[]> {
  if (parentIds.length === 0) return [];
  const { rows } = await pool.query<CategoryRow>(
    `SELECT ${COLUMNS} FROM categories WHERE parent_id = ANY($1::uuid[])`,
    [parentIds]
  );
  return rows;
}

export async function getCategoriesBySlugs(slugs: string[]): Promise<CategoryRow[]> {
  if (slugs.length === 0) return [];
  const { rows } = await pool.query<CategoryRow>(
    `SELECT ${COLUMNS} FROM categories WHERE slug = ANY($1::text[]) ORDER BY display_order ASC`,
    [slugs]
  );
  return rows;
}

export type CategoryInput = {
  name: string;
  slug: string;
  parentId?: string | null;
  imageUrl?: string | null;
  displayOrder?: number;
};

export async function createCategory(input: CategoryInput): Promise<CategoryRow> {
  const { rows } = await pool.query<CategoryRow>(
    `INSERT INTO categories (name, slug, parent_id, image_url, display_order)
     VALUES ($1, $2, $3, $4, $5) RETURNING ${COLUMNS}`,
    [input.name, input.slug, input.parentId ?? null, input.imageUrl ?? null, input.displayOrder ?? 0]
  );
  return rows[0];
}

const CATEGORY_COLUMNS: Record<keyof CategoryInput, string> = {
  name: "name",
  slug: "slug",
  parentId: "parent_id",
  imageUrl: "image_url",
  displayOrder: "display_order",
};

export async function updateCategory(id: string, input: Partial<CategoryInput>): Promise<CategoryRow | null> {
  const sets: string[] = [];
  const values: unknown[] = [];
  for (const [key, column] of Object.entries(CATEGORY_COLUMNS) as [keyof CategoryInput, string][]) {
    if (input[key] === undefined) continue;
    values.push(input[key]);
    sets.push(`${column} = $${values.length}`);
  }
  if (sets.length === 0) return getCategoryById(id);

  values.push(id);
  const { rows } = await pool.query<CategoryRow>(
    `UPDATE categories SET ${sets.join(", ")} WHERE id = $${values.length} RETURNING ${COLUMNS}`,
    values
  );
  return rows[0] ?? null;
}

export async function deleteCategory(id: string): Promise<boolean> {
  const { rowCount } = await pool.query("DELETE FROM categories WHERE id = $1", [id]);
  return (rowCount ?? 0) > 0;
}

export async function getDistinctBrandsForCategories(categoryIds: string[]): Promise<string[]> {
  if (categoryIds.length === 0) return [];
  const { rows } = await pool.query<{ brand: string }>(
    `SELECT DISTINCT brand FROM products WHERE category_id = ANY($1::uuid[]) AND brand IS NOT NULL`,
    [categoryIds]
  );
  return rows.map((r) => r.brand);
}

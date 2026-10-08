import { z } from "zod";
import * as repo from "../repositories/categories.repository.js";
import { slugify } from "../lib/slugify.js";
import { HIDDEN_FROM_NAV_SLUGS, DEVELOPER_CATEGORY_SLUGS } from "../lib/constants.js";
import { conflict, notFound } from "../lib/app-error.js";
import { isForeignKeyViolation, isUniqueViolation } from "../lib/pg-errors.js";

export type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  children: CategoryNode[];
};

function collectIds(node: CategoryNode): string[] {
  return [node.id, ...node.children.flatMap(collectIds)];
}

// Dựng toàn bộ cây danh mục 1 lần (đủ rẻ — catalog hiện chỉ vài chục danh
// mục) — dùng chung cho getCategoryTree, getCategoryDetail, getDeveloperScope
// để lấy đúng phân cấp không giới hạn độ sâu thay vì chỉ con/cháu.
async function buildCategoryNodeMap(): Promise<{ nodes: Map<string, CategoryNode>; roots: CategoryNode[] }> {
  const rows = (await repo.listAllCategories()).filter((row) => !HIDDEN_FROM_NAV_SLUGS.includes(row.slug));

  const nodes = new Map<string, CategoryNode>();
  for (const row of rows) nodes.set(row.id, { id: row.id, name: row.name, slug: row.slug, children: [] });

  const roots: CategoryNode[] = [];
  for (const row of rows) {
    const node = nodes.get(row.id)!;
    if (row.parent_id && nodes.has(row.parent_id)) {
      nodes.get(row.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return { nodes, roots };
}

// Port nguyên logic getCategoryTree() từ logilab-client/lib/categories.ts.
export async function getCategoryTree(): Promise<CategoryNode[]> {
  const { roots } = await buildCategoryNodeMap();
  return roots;
}

export async function getDevBoardBrands(): Promise<{ name: string; slug: string }[]> {
  const devBoardRootId = "11111111-1111-1111-1111-111111111111";
  const children = await repo.getChildren(devBoardRootId);
  const categoryIds = [devBoardRootId, ...children.map((c) => c.id)];
  const brands = await repo.getDistinctBrandsForCategories(categoryIds);
  return brands
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({ name, slug: slugify(name) }));
}

export type CategoryDetail = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  parent: { name: string; slug: string } | null;
  // Đệ quy (không chỉ con trực tiếp) để sidebar filter hiện được phân cấp
  // đầy đủ bên dưới danh mục hiện tại.
  children: CategoryNode[];
  // category + toàn bộ con/cháu ở mọi tầng — dùng để gom sản phẩm.
  descendantCategoryIds: string[];
};

export async function getCategoryDetail(slug: string): Promise<CategoryDetail> {
  const category = await repo.getCategoryBySlug(slug);
  if (!category) throw notFound("Không tìm thấy danh mục");

  const [{ nodes }, parent] = await Promise.all([
    buildCategoryNodeMap(),
    category.parent_id ? repo.getCategoryById(category.parent_id) : Promise.resolve(null),
  ]);

  const node = nodes.get(category.id);

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    parentId: category.parent_id,
    parent: parent ? { name: parent.name, slug: parent.slug } : null,
    children: node ? node.children : [],
    descendantCategoryIds: node ? collectIds(node) : [category.id],
  };
}

// Tìm 1 danh mục con/cháu (bất kỳ độ sâu) theo slug bên trong 1 subtree —
// dùng để xác nhận ?category=<slug> trên /categories/[slug] thực sự thuộc
// phạm vi danh mục đang xem, tránh lộ danh mục không liên quan qua URL.
function findDescendantBySlug(node: CategoryNode, slug: string): CategoryNode | null {
  if (node.slug === slug) return node;
  for (const child of node.children) {
    const found = findDescendantBySlug(child, slug);
    if (found) return found;
  }
  return null;
}

export async function findScopedCategory(rootSlug: string, targetSlug: string): Promise<CategoryNode | null> {
  const { nodes } = await buildCategoryNodeMap();
  const root = [...nodes.values()].find((n) => n.slug === rootSlug);
  if (!root) return null;
  return findDescendantBySlug(root, targetSlug);
}

// Dùng cho /developer — 6 danh mục gốc cố định + toàn bộ con/cháu của chúng
// (mọi tầng, không chỉ con trực tiếp — để sidebar hiện được phân cấp đầy đủ
// và lọc được tới tận danh mục lá như "Arduino").
export async function getDeveloperScope(activeCategorySlug?: string) {
  const { nodes } = await buildCategoryNodeMap();
  const devCategories = DEVELOPER_CATEGORY_SLUGS.map((slug) =>
    [...nodes.values()].find((n) => n.slug === slug)
  ).filter((n): n is CategoryNode => Boolean(n));

  const allScopeIds = devCategories.flatMap(collectIds);

  if (!activeCategorySlug) {
    return { devCategories, categoryIds: allScopeIds, activeCategory: null as repo.CategoryRow | null };
  }

  const activeCategory = await repo.getCategoryBySlug(activeCategorySlug);
  if (!activeCategory || !allScopeIds.includes(activeCategory.id)) {
    throw notFound("Không tìm thấy danh mục");
  }

  const activeNode = nodes.get(activeCategory.id);
  return {
    devCategories,
    categoryIds: activeNode ? collectIds(activeNode) : [activeCategory.id],
    activeCategory,
  };
}

// ---- Admin CRUD ----

export const categoryCreateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  parentId: z.string().uuid().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  displayOrder: z.number().int().optional(),
});
export const categoryUpdateSchema = categoryCreateSchema.partial();

export async function listCategoriesAdmin() {
  return repo.listAllCategories();
}

export async function createCategoryAdmin(input: z.infer<typeof categoryCreateSchema>) {
  const slug = input.slug?.trim() || slugify(input.name);
  try {
    return await repo.createCategory({ ...input, slug });
  } catch (err) {
    if (isUniqueViolation(err)) throw conflict("Slug danh mục đã tồn tại");
    throw err;
  }
}

export async function updateCategoryAdmin(id: string, input: z.infer<typeof categoryUpdateSchema>) {
  try {
    const updated = await repo.updateCategory(id, input);
    if (!updated) throw notFound("Không tìm thấy danh mục");
    return updated;
  } catch (err) {
    if (isUniqueViolation(err)) throw conflict("Slug danh mục đã tồn tại");
    throw err;
  }
}

export async function deleteCategoryAdmin(id: string) {
  try {
    const ok = await repo.deleteCategory(id);
    if (!ok) throw notFound("Không tìm thấy danh mục");
  } catch (err) {
    if (isForeignKeyViolation(err)) {
      throw conflict("Không thể xoá danh mục đang có sản phẩm hoặc danh mục con");
    }
    throw err;
  }
}

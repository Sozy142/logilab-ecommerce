import { apiFetch } from "@/lib/api-client";
import type { Brand } from "@logilab/shared-types";
import { DEVELOPER_CATEGORY_SLUGS, type CategoryNode } from "@/lib/categories-shared";

export { DEVELOPER_CATEGORY_SLUGS };
export type { CategoryNode };

export async function getCategoryTree(): Promise<CategoryNode[]> {
  const { categories } = await apiFetch<{ categories: CategoryNode[] }>("/categories/tree");
  return categories;
}

export function slugifyBrand(brand: string): string {
  return brand
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp("[̀-ͯ]", "g"), "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function getDevBoardBrands(): Promise<Brand[]> {
  const { brands } = await apiFetch<{ brands: Brand[] }>("/categories/dev-board-brands");
  return brands;
}

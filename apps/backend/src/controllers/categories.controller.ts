import type { Request, Response } from "express";
import * as categoriesService from "../services/categories.service.js";
import type { CategoryNode, Brand, CategoryDetail } from "@logilab/shared-types";

export async function getTree(_req: Request, res: Response) {
  const tree = await categoriesService.getCategoryTree();
  res.json({ categories: tree } satisfies { categories: CategoryNode[] });
}

export async function getDevBoardBrands(_req: Request, res: Response) {
  const brands = await categoriesService.getDevBoardBrands();
  res.json({ brands } satisfies { brands: Brand[] });
}

export async function getBySlug(req: Request, res: Response) {
  const detail = await categoriesService.getCategoryDetail(req.params.slug);
  res.json({ category: detail } satisfies { category: CategoryDetail });
}

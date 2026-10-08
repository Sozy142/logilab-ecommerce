import type { Request, Response } from "express";
import * as categoriesService from "../services/categories.service.js";

export async function list(_req: Request, res: Response) {
  res.json({ categories: await categoriesService.listCategoriesAdmin() });
}

export async function create(req: Request, res: Response) {
  const input = categoriesService.categoryCreateSchema.parse(req.body);
  res.status(201).json(await categoriesService.createCategoryAdmin(input));
}

export async function update(req: Request, res: Response) {
  const input = categoriesService.categoryUpdateSchema.parse(req.body);
  res.json(await categoriesService.updateCategoryAdmin(req.params.id, input));
}

export async function remove(req: Request, res: Response) {
  await categoriesService.deleteCategoryAdmin(req.params.id);
  res.status(204).end();
}

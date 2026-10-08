import type { Request, Response } from "express";
import * as productsService from "../services/products.service.js";

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export async function list(req: Request, res: Response) {
  const result = await productsService.listProductsAdmin(asString(req.query.q), asString(req.query.page));
  res.json(result);
}

export async function getById(req: Request, res: Response) {
  res.json(await productsService.getProductAdmin(req.params.id));
}

export async function create(req: Request, res: Response) {
  const input = productsService.productCreateSchema.parse(req.body);
  res.status(201).json(await productsService.createProductAdmin(input));
}

export async function update(req: Request, res: Response) {
  const input = productsService.productUpdateSchema.parse(req.body);
  res.json(await productsService.updateProductAdmin(req.params.id, input));
}

export async function remove(req: Request, res: Response) {
  await productsService.deleteProductAdmin(req.params.id);
  res.status(204).end();
}

export async function createVariant(req: Request, res: Response) {
  const input = productsService.variantSchema.parse(req.body);
  res.status(201).json(await productsService.createVariantAdmin(req.params.id, input));
}

export async function updateVariant(req: Request, res: Response) {
  const input = productsService.variantUpdateSchema.parse(req.body);
  res.json(await productsService.updateVariantAdmin(req.params.variantId, input));
}

export async function removeVariant(req: Request, res: Response) {
  await productsService.deleteVariantAdmin(req.params.variantId);
  res.status(204).end();
}

export async function createImage(req: Request, res: Response) {
  const input = productsService.productImageSchema.parse(req.body);
  res.status(201).json(await productsService.addProductImageAdmin(req.params.id, input));
}

export async function updateImage(req: Request, res: Response) {
  const input = productsService.productImageUpdateSchema.parse(req.body);
  res.json(await productsService.updateProductImageAdmin(req.params.imageId, input));
}

export async function removeImage(req: Request, res: Response) {
  await productsService.deleteProductImageAdmin(req.params.imageId);
  res.status(204).end();
}

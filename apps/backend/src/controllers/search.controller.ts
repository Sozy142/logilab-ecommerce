import type { Request, Response } from "express";
import * as productsService from "../services/products.service.js";
import type { SearchResponse } from "@logilab/shared-types";

export async function search(req: Request, res: Response) {
  const q = typeof req.query.q === "string" ? req.query.q : "";
  const page = typeof req.query.page === "string" ? req.query.page : undefined;
  res.json((await productsService.searchProducts(q, page)) satisfies SearchResponse);
}

export async function suggestions(req: Request, res: Response) {
  const q = typeof req.query.q === "string" ? req.query.q : "";
  res.json({ results: await productsService.searchSuggestions(q) });
}

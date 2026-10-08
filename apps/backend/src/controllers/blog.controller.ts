import type { Request, Response } from "express";
import * as blogService from "../services/blog.service.js";
import type { BlogListResponse, BlogDetailResponse } from "@logilab/shared-types";

export async function list(req: Request, res: Response) {
  const tag = typeof req.query.tag === "string" ? req.query.tag : undefined;
  res.json((await blogService.listBlog(tag)) satisfies BlogListResponse);
}

export async function getBySlug(req: Request, res: Response) {
  res.json((await blogService.getBlogPostDetail(req.params.slug)) satisfies BlogDetailResponse);
}

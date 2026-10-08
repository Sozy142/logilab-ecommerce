import type { Request, Response } from "express";
import * as blogService from "../services/blog.service.js";

export async function list(_req: Request, res: Response) {
  res.json({ posts: await blogService.listPostsAdmin() });
}

export async function getById(req: Request, res: Response) {
  res.json(await blogService.getPostAdmin(req.params.id));
}

export async function create(req: Request, res: Response) {
  const input = blogService.blogPostCreateSchema.parse(req.body);
  res.status(201).json(await blogService.createPostAdmin(input));
}

export async function update(req: Request, res: Response) {
  const input = blogService.blogPostUpdateSchema.parse(req.body);
  res.json(await blogService.updatePostAdmin(req.params.id, input));
}

export async function remove(req: Request, res: Response) {
  await blogService.deletePostAdmin(req.params.id);
  res.status(204).end();
}
